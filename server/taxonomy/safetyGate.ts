/**
 * Safety gate: detect emergency / high-risk signals before calling Gemini.
 */
import type { UserProfile } from "../../utils/types.ts";
import type { SafetyAssessment } from './types.ts';

function extractCriticalGlucoseFromText(text: string): { kind: 'low' | 'high'; value: number } | null {
    const patterns = [
        /(?:血糖|度到|量到|測到|测到|讀數|读数|數值|数值)[^\d\n%]{0,8}(\d{1,2}(?:\.\d)?)/gi,
        /(\d{1,2}(?:\.\d)?)\s*(?:mmol\/?l|mmol)/gi
    ];

    for (const regex of patterns) {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            const fullIdx = match.index;
            const valueStr = match[1];
            const afterChar = text.slice(fullIdx + match[0].length, fullIdx + match[0].length + 2);
            const beforeContext = text.slice(Math.max(0, fullIdx - 10), fullIdx + match[0].length).toLowerCase();

            if (afterChar.includes('%') || /糖化|hba1c|a1c/.test(beforeContext)) {
                continue;
            }

            const num = parseFloat(valueStr);
            if (isNaN(num)) continue;
            if (num >= 0.8 && num < 3.9) {
                return { kind: 'low', value: num };
            }
            if (num >= 16.7 && num <= 45) {
                return { kind: 'high', value: num };
            }
        }
    }
    return null;
}

function isEducationalSafetyInquiry(text: string): boolean {
    const activeFirstPersonPatterns = [
        '而家', '現在', '现在', '啱啱', '剛才', '刚才', '剛剛', '刚刚', '頭先', '头先',
        '正在', '不停', '一直', '突然',
        '我好暈', '我好晕', '我好震', '我手震', '我手抖', '我冒冷汗', '我出冷汗',
        '我頭暈', '我头晕', '我心悸', '我心慌', '我嘔', '我呕', '我吐', '我肚痛', '我腹痛',
        '我隻腳', '我只脚', '我腳', '我脚', '我個傷口', '我个伤口',
        '測到', '测到', '量到', '度到', '血糖得', '血糖只有',
        '暈低', '晕倒', '昏迷', '叫唔醒', '叫不醒', '唔埋口', '流膿', '流脓', '發黑', '发黑', '變黑', '变黑'
    ];
    if (activeFirstPersonPatterns.some(p => text.includes(p))) {
        return false;
    }

    const hypotheticalMarkers = ['如果', '假如', '一旦', '萬一'];
    if (hypotheticalMarkers.some(m => text.includes(m))) {
        return true;
    }

    const educationalPatterns = [
        '該如何緊急處理', '该如何紧急处理', '該如何處理', '该如何处理',
        '點樣緊急處理', '點樣處理', '點處理', '應該點處理',
        '怎麼處理', '怎么处理', '如何處理', '如何处理', '如何緊急處理', '如何紧急处理',
        '什麼是', '甚麼是', '什么是', '係咩', '代表咩',
        '點樣預防', '如何預防', '如何预防', '有咩症狀', '有哪些症狀', '有哪些症状',
        '如果出現', '如果出现', '假如出現', '假如出现', '萬一出現', '万一出现', '一旦出現', '一旦出现'
    ];
    if (educationalPatterns.some(p => text.includes(p))) {
        return true;
    }

    if (/出現.{0,20}等症狀/.test(text) || /出现.{0,20}等症状/.test(text)) {
        return true;
    }

    return false;
}

export function checkSafetyGate(query: string, profile?: Partial<UserProfile>): SafetyAssessment {
    const raw = (query || '').trim();
    if (!raw) {
        return { isEmergency: false, triggered: false, blockLLM: false, severity: 'NONE' };
    }

    const text = raw.toLowerCase();
    const safeProfile = profile || {};
    const patientName = safeProfile.name?.trim() || '老友記';
    const isEducational = isEducationalSafetyInquiry(text);
    const criticalGlucose = extractCriticalGlucoseFromText(text);

    const mentalHealthKeywords = [
        '自殺', '自杀', '想死', '唔想做人', '不想做人', '死咗去', '傷害自己', '伤害自己',
        '輕生', '轻生', '生無可戀', '生无可恋', '厭世', '厌世', '絕望', '绝望',
        '崩潰', '崩溃', '無出口', '无出口', '情緒好差', '情绪很差', '抑鬱', '抑郁'
    ];
    const matchedMental = mentalHealthKeywords.find(k => text.includes(k));
    if (matchedMental) {
        return {
            isEmergency: true,
            triggered: true,
            blockLLM: true,
            severity: 'EMERGENCY',
            category: 'mental_health',
            matchedSignal: matchedMental,
            title: '情緒支援與關懷提示',
            message: '察覺到您現在可能承受著很大壓力或情緒困擾。您並不孤單，請先把控糖的事放一放，優先照顧自己的心情，並與信任的家人或專業支援人員傾訴。',
            replyMessage: `${patientName}，我聽到你好辛苦，亦好關心你而家嘅感受。💛\n\n你唔使一個人撐住，建議你而家先聯絡身邊信任嘅家人朋友，或者直接致電上方嘅香港 24 小時情緒支援熱線，有專人可以陪你傾偈。`,
            actionSteps: [
                '先暫停處理日常控糖煩惱，找一個安靜安全的地方稍作休息。',
                '聯絡身邊信任的家人、朋友或照顧者陪伴您。',
                '如需專人傾訴，可隨時自行致電下方香港 24 小時免費支援熱線。'
            ],
            contacts: [
                { label: '香港撒瑪利亞防止自殺會', number: '2389 2222', note: '24 小時熱線' },
                { label: '生命熱線', number: '2382 0000', note: '24 小時熱線' },
                { label: '醫管局精神科電話諮詢', number: '2466 7350', note: '24 小時專線' },
                { label: '社會福利署熱線', number: '2343 2255', note: '支援及轉介' },
                { label: '如感到即時生命危險', number: '999', note: '請立即請身邊人協助或致電求助' }
            ]
        };
    }

    const dkaKeywords = [
        '口渴難忍', '口渴难忍', '極度口渴', '极度口渴',
        '不停嘔吐', '不停呕吐', '嘔吐', '呕吐', '吐咗',
        '呼吸有果味', '呼吸果味', '呼吸果香', '酮酸中毒',
        '意識模糊', '意识模糊', '昏迷', '暈低', '晕倒', '叫唔醒', '叫不醒',
        '極度疲倦', '极度疲倦'
    ];
    const matchedDka = dkaKeywords.find(k => text.includes(k));
    const hasAbdominalPainWithHighSignal =
        (text.includes('肚痛') || text.includes('腹痛')) &&
        (criticalGlucose?.kind === 'high' || text.includes('高血糖') || text.includes('多尿') || text.includes('口渴'));
    const isCriticalHighGlucose = criticalGlucose?.kind === 'high' && (criticalGlucose.value >= 20 || Boolean(matchedDka) || text.includes('口渴') || text.includes('多尿') || text.includes('肚痛'));

    if (matchedDka || hasAbdominalPainWithHighSignal || isCriticalHighGlucose) {
        const block = !isEducational || Boolean(isCriticalHighGlucose);
        const glucoseNote = criticalGlucose?.kind === 'high'
            ? `（提及血糖值約 ${criticalGlucose.value} mmol/L）`
            : '';
        return {
            isEmergency: block,
            triggered: true,
            blockLLM: block,
            severity: block ? 'EMERGENCY' : 'CAUTION',
            category: 'dka_hhs',
            matchedSignal: matchedDka || (isCriticalHighGlucose ? `glucose:${criticalGlucose?.value}` : '肚痛+高血糖徵象'),
            title: block ? '嚴重高血糖危象安全警示' : '嚴重高血糖危象處理速查',
            message: block
                ? `偵測到可能屬於嚴重高血糖危象（如酮酸中毒 DKA 或高滲透壓高血糖狀態 HHS）的危險徵象${glucoseNote}，此情況需即時由醫院處理，請勿等待或單靠 AI 回覆。`
                : '如出現極度口渴、持續嘔吐、腹痛、呼吸有果味或意識模糊等徵象，可能屬嚴重高血糖危象（DKA／HHS），需立即前往急症室求醫。',
            replyMessage: block
                ? `${patientName}，呢啲徵象有機會係嚴重高血糖危象${glucoseNote}，安全第一！\n\n請即刻通知身邊家人，盡快前往最近嘅急症室，或者致電 999 尋求緊急醫療協助，唔好自己硬撐呀。`
                : undefined,
            actionSteps: [
                '立即通知身邊家人或照顧者，切勿獨自留在家中觀察。',
                '儘快前往最近的醫院急症室求醫；如出現呼吸急促、持續嘔吐或意識模糊，請立即致電 999。',
                '就醫時請攜帶現時服用的降糖藥物、胰島素及近期血糖紀錄，切勿自行胡亂加大藥量。'
            ],
            contacts: [
                { label: '香港緊急救護服務', number: '999', note: '如情況危急請立即請家人協助或自行致電' }
            ]
        };
    }

    const hypoSymptomKeywords = [
        '手震', '手抖', '冒冷汗', '出冷汗', '狂標汗', '大汗淋漓',
        '心悸', '心慌', '頭暈', '头晕', '昏咗', '昏倒', '昏低', '意識不清', '意识不清', '發軟', '发软'
    ];
    const hasSweatWithHypoContext =
        (text.includes('冒汗') || (text.includes('出汗') && !/運動|运动|微出汗|無明顯出汗|無出汗|冇出汗/.test(text))) &&
        (text.includes('低血糖') || text.includes('暈') || text.includes('晕') || text.includes('震') || text.includes('心'));
    const matchedHypo = hypoSymptomKeywords.find(k => text.includes(k)) || (hasSweatWithHypoContext ? '出汗伴低血糖徵象' : undefined);
    const isCriticalLowGlucose = criticalGlucose?.kind === 'low';

    if (matchedHypo || isCriticalLowGlucose) {
        const block = !isEducational || isCriticalLowGlucose;
        const glucoseNote = isCriticalLowGlucose ? `（提及血糖值 ${criticalGlucose.value} mmol/L，已低於 3.9 mmol/L）` : '';
        return {
            isEmergency: block,
            triggered: true,
            blockLLM: block,
            severity: block ? 'EMERGENCY' : 'CAUTION',
            category: 'acute_hypoglycemia',
            matchedSignal: matchedHypo || `glucose:${criticalGlucose?.value}`,
            title: block ? '急性低血糖急救警示' : '低血糖突發處理速查（15/15 原則）',
            message: block
                ? `偵測到可能正在發作的低血糖徵狀${glucoseNote}！安全第一，請立即先按「15/15 原則」補充糖分，暫時不要依賴 AI 聊天。`
                : '如您或身邊人正出現手震、心慌、冒冷汗或血糖低於 3.9 mmol/L，請立即先按下方「15/15 原則」處理；如屬日常學習，可繼續閱讀下方解說。',
            replyMessage: block
                ? `${patientName}，手震、冒冷汗或頭暈好可能係急性低血糖${glucoseNote}，安全第一！\n\n如果你而家清醒，請即刻按上方「15/15 原則」食 15 克快速糖（例如 3 粒方糖、半罐普通含糖汽水或一盒小紙包果汁），坐低休息 15 分鐘後再篤手指覆檢。\n\n如果 15 分鐘後仲低過 3.9 或者人越來越暈，請立即搵身邊人幫手同致電 999！`
                : undefined,
            actionSteps: [
                '立即停下活動並坐下休息；如有血糖機可即時量度，但切勿因等量度而延誤補糖。',
                '若神智清醒，立即實施「15/15 原則」：進食 15 克快速吸收糖分（如 3 粒方糖、半罐普通含糖汽水、約 150 毫升果汁或 3 粒葡萄糖片）。',
                '靜待 15 分鐘後覆檢血糖；如仍低於 3.9 mmol/L 或徵狀未緩解，重複補充 15 克糖分一次。',
                '血糖回升後，若距離下一頓正餐超過 1 小時，可補充少量複合碳水化合物（如 2-3 塊梳打餅）。',
                '若出現意識模糊、昏迷或無法吞嚥，切勿強行餵食，應立即請身邊人致電 999。'
            ],
            contacts: [
                { label: '香港緊急救護服務', number: '999', note: '徵狀無改善、意識模糊或獨居感不適時請立即求助' }
            ]
        };
    }

    const footKeywords = [
        '傷口不癒合', '伤口不愈合', '唔埋口', '紅腫發熱', '红肿发热',
        '潰瘍', '溃疡', '腳趾變黑', '脚趾变黑', '腳發黑', '脚发黑',
        '腳部感染', '脚部感染', '流膿', '流脓', '腳爛', '脚烂'
    ];
    const matchedFoot = footKeywords.find(k => text.includes(k));
    if (matchedFoot) {
        const block = !isEducational;
        return {
            isEmergency: block,
            triggered: true,
            blockLLM: block,
            severity: block ? 'URGENT' : 'CAUTION',
            category: 'foot_wound',
            matchedSignal: matchedFoot,
            title: block ? '糖尿病足部傷口緊急求醫提示' : '糖尿病足部異常處理速查',
            message: block
                ? '偵測到可能涉及足部感染、潰瘍或血液循環異常。糖尿病友的足部傷口惡化速度較快，建議於 24 小時內儘快由醫生或專科護士檢查處理。'
                : '糖尿病友一旦發現足部紅腫發熱、流膿、傷口不癒合或腳趾變黑，需於 24 小時內儘快求醫，切勿自行處理。',
            replyMessage: block
                ? `${patientName}，糖尿腳嘅傷口變化可以好快，呢種情況一定要比醫生或護士親眼檢查先安心。\n\n建議你喺 24 小時內盡快去門診或診所睇醫生；如果伴隨發燒、發冷或者紅腫迅速蔓延，請即刻去急症室呀。`
                : undefined,
            actionSteps: [
                '請於 24 小時內儘快前往普通科門診、家庭醫生或足病診療師處檢查。',
                '就醫前保持傷口清潔乾爽，避免患處受壓、長時間步行或自行剪皮／塗抹成藥／用熱水浸腳。',
                '如伴隨發燒、發冷、劇痛或紅腫迅速向上蔓延，請立即前往急症室求醫。'
            ],
            contacts: [
                { label: '如伴隨發燒／發冷／紅腫急劇擴散', number: '999 / 急症室', note: '請立即尋求緊急醫療協助' }
            ]
        };
    }

    const hasHighRiskProfile = Boolean(
        safeProfile.isInsulinUser ||
        safeProfile.hasHypoUnawareness ||
        safeProfile.hasHypoHistory ||
        safeProfile.isFrail
    );
    const unwellKeywords = ['好唔舒服', '很不舒服', '好暈', '好晕', '想嘔', '想吐', '作嘔'];
    const matchedUnwell = unwellKeywords.find(k => text.includes(k));
    if (hasHighRiskProfile && matchedUnwell && !isEducational) {
        return {
            isEmergency: true,
            triggered: true,
            blockLLM: true,
            severity: 'URGENT',
            category: 'high_risk_unwell',
            matchedSignal: matchedUnwell,
            title: '高風險糖友身體不適安全提醒',
            message: '留意到您的健康檔案屬於較需留意血糖波動的組別，且目前感到明顯不適。安全第一，建議先停止對話，即時量度血糖並通知家人或尋求醫護協助。',
            replyMessage: `${patientName}，見你話好唔舒服，加上你嘅健康背景需要特別留意血糖安全，我好擔心你。\n\n請你先坐低休息、即刻聯絡身邊家人或照顧者，喺安全情況下量一次血糖；如果唔適持續或加重，請盡快去求醫呀。`,
            actionSteps: [
                '立即坐下或躺下休息，避免站立或走動以防跌倒。',
                '如有血糖機且安全可行，即時量度一次血糖值以排除低血糖或過高血糖。',
                '立即通知家人、照顧者或鄰居留意您的情況；如症狀惡化，請前往求醫或致電 999。'
            ],
            contacts: [
                { label: '如情況惡化或獨居無人協助', number: '999', note: '請立即尋求緊急協助' }
            ]
        };
    }

    return { isEmergency: false, triggered: false, blockLLM: false, severity: 'NONE' };
}
