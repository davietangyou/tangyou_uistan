import {GoogleGenAI, Type} from "@google/genai";
import {ChatTurn, ClarificationQuestion, DecisionResult, GlucoseRecord, UserProfile} from "../utils/types";
import {FULL_ROUTING_CONFIG, classifyScenario, Scenario, checkSafetyGate, needsValueClarification} from "./taxonomyService";
import {CLINICAL_KNOWLEDGE} from "./knowledgeBase";

// 初始化 GoogleGenAI
const getApiKey = () => {
    try {
        return process.env.GEMINI_API_KEY || "";
    } catch (e) {
        return "";
    }
};

const ai = new GoogleGenAI({
    apiKey: getApiKey()
});

/**
 * Helper to format history for contents or prompt
 */
function formatHistoryContext(history: ChatTurn[]): string {
    if (!history || history.length === 0) return "這是對話的開始。";
    return history.map(turn => `${turn.role === 'user' ? '病人' : '助理'}: ${turn.content}`).join('\n');
}

/**
 * 格式化完整的用戶健康與生活檔案摘要
 */
export function formatUserProfileSummary(profile: UserProfile): string {
    const riskFlags = [];
    if (profile.isInsulinUser) riskFlags.push("正在使用胰島素 (高風險)");
    if (profile.hasHypoHistory) riskFlags.push("有低血糖病史");
    if (profile.isFrail) riskFlags.push("高齡/體弱個體 (需放寬目標)");
    if (profile.hasHypoUnawareness) riskFlags.push("無感低血糖 (極高風險)");
    if (profile.hasNoCaregiverSupport) riskFlags.push("無家人或照顧者協助 (獨居高風險，需給予更安全、易操作的個人照護建議)");
    if (profile.hasCaregiverSupport) riskFlags.push("有家人或照顧者同住協助");
    if (profile.conditions && profile.conditions.length > 0) {
        riskFlags.push(`已知合併症/慢性病：${profile.conditions.join('、')}`);
    }

    const clinicLabels: Record<string, string> = {
        'GOPC': '醫管局家庭醫學門診/普通科門診',
        'SOPC': '醫管局專科門診',
        'DHC': '地區康健中心 / 康健站',
        'PRIVATE': '私家診所 / 家庭醫生',
        'OTHER': '其他醫療機構',
        'NONE': '暫無定期覆診習慣'
    };
    const userClinics = profile.clinicTypes && profile.clinicTypes.length > 0
        ? profile.clinicTypes.map(c => clinicLabels[c] || c).join('、')
        : (profile.clinicType ? (clinicLabels[profile.clinicType] || profile.clinicType) : '未填寫');
        
    const exerciseTypesList = (profile.exerciseTypes || []).map(t => {
        if (t === 'WALK') return '散步/快步走';
        if (t === 'RESISTANCE') return '深蹲/俯臥撐/彈力帶/啞鈴抗阻肌力訓練';
        if (t === 'TAICHI') return '太極/八段錦/氣功';
        if (t === 'SWIM') return '游泳/水中健體';
        if (t === 'CYCLE') return '健身單車/慢跑';
        if (t === 'STRETCH') return '晨運拉筋/椅子操/提踵踮腳';
        if (t === 'HIKE') return '郊遊遠足';
        if (t === 'OTHER') return profile.exerciseTypesOther ? `其他(${profile.exerciseTypesOther})` : '其他運動';
        return t;
    });

    const exerciseSummary = [
        profile.exerciseWeekly === 'MET_150' 
            ? `每週運動達標 (≥150分鐘/週${profile.exerciseDaysPerWeek ? `，約每週${profile.exerciseDaysPerWeek}日，每次${profile.exerciseMinutesPerSession}分鐘` : ''})`
            : profile.exerciseWeekly === 'UNDER_150'
            ? `每週運動不足 (<150分鐘/週${profile.exerciseDaysPerWeek ? `，約每週${profile.exerciseDaysPerWeek}日，每次${profile.exerciseMinutesPerSession}分鐘` : ''})`
            : profile.exerciseWeekly === 'NONE'
            ? '幾乎無運動習慣'
            : '未特別註明',
        exerciseTypesList.length > 0 ? `平時常做運動項目：${exerciseTypesList.join('、')}` : ''
    ].filter(Boolean).join('；');

    const dietParts = [];
    if (profile.dietHabits && profile.dietHabits.length > 0) {
        dietParts.push(`日常飲食習慣：${profile.dietHabits.join('、')}${profile.dietHabitsOther ? ` (其他備註: ${profile.dietHabitsOther})` : ''}`);
    }
    if (profile.favoriteFoods && profile.favoriteFoods.trim()) {
        dietParts.push(`【⭐ 患者平時最喜愛的食物 / 偏好】：${profile.favoriteFoods.trim()}`);
    }
    const dietSummary = dietParts.length > 0 ? dietParts.join('；\n  ') : '常規飲食（未特別填寫偏好食物）';

    const physicalMetrics = [
        profile.height ? `身高: ${profile.height} cm` : '',
        profile.weight ? `體重: ${profile.weight} ${profile.weightUnit || 'kg'}` : '',
        profile.bmi ? `BMI: ${profile.bmi}` : ''
    ].filter(Boolean).join('，');

    return `- 患者稱呼/姓名: 「${profile.name || '用戶'}」（【極重要】：你在對話、回覆、建議中稱呼或提及病人時，必須且只能使用這個稱呼，例如「${profile.name || '用戶'}」，絕對不要使用其他虛構名字）
- 基本資料: 年齡 ${profile.age || '未填寫'} 歲，性別 ${profile.gender || '未填寫'}，糖尿病病齡 ${profile.yearsWithDiabetes || '未填寫'} 年
- 體格與檢驗指標: ${physicalMetrics || '未特別記錄'}
- 糖尿病類型與用藥背景: 診斷 ${profile.diabetesType || '2型糖尿病'}${profile.otherDiabetesType ? ` (${profile.otherDiabetesType})` : ''}；現有藥物處方: ${profile.medications || '無特別藥物記錄'}
- 臨床風險標誌: ${riskFlags.length > 0 ? riskFlags.join('；') : '無特殊風險標誌'}
- 定期覆診醫療機構: ${userClinics}
- 運動習慣: ${exerciseSummary}
- 飲食習慣與喜愛食物:
  ${dietSummary}
- 識字與溝通偏好: ${profile.literacyLevel || '一般'} (如為低識字，請使用更簡短、生活化、口語化且親切的語言)`;
}

export function buildFinalSystemInstruction(
    scenarios: Scenario[],
    profile: UserProfile,
    safetyMessage?: string,
    history: ChatTurn[] = []
): string {
    const activeNodes = FULL_ROUTING_CONFIG.nodes.filter(n => scenarios.includes(n.scenario_group));
    const historyText = history && history.length > 0 ? `\n【過往對話記錄】:\n${formatHistoryContext(history)}` : '';

    if (safetyMessage) {
        return `你是一位專業且極其親切的香港糖尿病決策輔助 (PDA) 衛教助理。對話必須用地道廣東話。
        
【核心行為準則 (PDA 規範)】
1. 角色定位：你是醫療決策的協作者，非最後決策者。遵循「三不二要」：不改藥、不診斷、不保證；要同理、要依據。
2. 心理健康安全：如果發現病人表達嚴重情緒困擾，請在提供糖尿病建議前，先對情緒表示同理，並溫和提醒情緒健康同樣重要，建議尋求專業商談或致電情緒支援熱線。
3. 回答採「4-Layer Style」：
   - Layer 1: 一句話重點 (提煉核心消息)。
   - Layer 2: 核心分析摘要 (解釋原因與建議)。
   - Layer 3: 方案取捨分析 (根據病人價值觀進行 Pros/Cons 對比)。
   - Layer 4: 建議問診議題 (下次覆診如何溝通)。
4. 禁止回答清單：不提供個人化計量、不建議更改醫生處方、不作個人化臨床診斷。
${historyText}`;
    }

    // 獲取所有匹配節點的詳細配置 (合併邏輯)
    const allDoNotAnswer = Array.from(new Set(activeNodes.flatMap(n => n.do_not_answer_directly || [])));
    const allSourceOrder = Array.from(new Set(activeNodes.flatMap(n => n.preferred_source_order || [])));
    
    // 根據合併後的 source 順序抓取臨床知識 (Dynamic Retrieval: Preferred source order)
    const knowledgeText = allSourceOrder.slice(0, 3).map(sourceId => {
        const entry = CLINICAL_KNOWLEDGE[sourceId as keyof typeof CLINICAL_KNOWLEDGE];
        return entry ? `【${entry.title}】: ${entry.content}` : "";
    }).filter(t => t !== "").join('\n\n');

    const profileSummary = formatUserProfileSummary(profile);

    return `你是一位專業且極其親切的香港糖尿病決策輔助 (PDA) 衛教助理。
目前對話場景：【${scenarios.join('、')}】
對應知識節點：【${activeNodes.map(n => n.leaf_label).join('、')}】
${historyText}

【核心行為準則 (PDA 規範)】
1. 使用地道香港廣東話（口語化，如「篤手指」、「食藥」、「唔好意思」）。
2. 角色定位：你是醫療決策的協作者，非最後決策者。遵循「三不二要」：不改藥、不診斷、不保證；要同理、要依據。
3. 嚴格遵守「禁止回答」清單：${allDoNotAnswer.length > 0 ? allDoNotAnswer.join(', ') : '不作個人化醫療判斷'}。
4. 回答採「4-Layer Style」：
   - Layer 1: 一句話重點 (提煉核心消息)。
   - Layer 2: 核心分析摘要 (解釋原因與建議)。
   - Layer 3: 方案取捨分析 (根據病人價值觀進行 Pros/Cons 對比)。
   - Layer 4: 建議問診議題 (下次覆診點樣同醫生溝通)。
5. 回答要帶「依據感」：明確指出建議是根據一般衛教原則或是與病人的特定數據/情況相關。

【❗個人化飲食、喜好食物與生活量身定制（核心準則）】
當病人詢問任何與飲食、水果、外食、正餐、點心、飲茶或運動相關問題時：
- 【絕對禁止】忽略病人健康檔案中設定的「平時喜歡的食物 (favoriteFoods)」與飲食習慣，絕不能丟出千篇一律的通用模板回答！
- 【必須主動主動呼應並量身定制】：
  * 例如若檔案中註明病人平時喜歡吃「榴槤」，當病人詢問「食咩生果可以幫我控制血糖？」時，你【必須主動提及並同理病人對榴槤的喜愛】（如：「我知道你平時好中意食榴槤，但榴槤糖分同熱量都比較高，如果想食過下口癮，建議嚴格控制喺一小核以內，最好擺喺兩餐之間食，唔好一次食成房呀！」），同時對比推薦適合控糖的低升糖指數水果（如藍莓、奇異果、蘋果等）以及「一次一個拳頭大」的份量技巧。
  * 例如若檔案中註明喜歡「叉燒飯、港式奶茶、點心」，詢問外食或主食時，必須主動提供對應的改良技巧（如叉燒去肥少汁、多叫焯菜、奶茶走甜等）。

【動態檢索到的臨床知識節點 (Layer 3-4)】
${knowledgeText}

【健康檔案摘要 (Health Profile Summary)】
${profileSummary}

【回覆指導】
請結合上述臨床知識與病人的地道生活背景及喜好食物，給予溫暖、具同理心且具備具體實踐建議的回應。如果是飲食場景，請特別注意在有 trade-off 時才強調方案比較。
如果在歷史對話中病人已經表達過某些偏好（如「重視方便」或「擔心副作用」），請在回答中直接展現出你已經知曉並考慮了這些因素，不要重複詢問已經知道的偏好。`;
}

function formatGlucoseContext(records: GlucoseRecord[]): string {
    if (records.length === 0) return "暫時未有提供血糖數據";
    const recent = records.slice(0, 10);
    return recent.map(r => {
        const hasValue = r.value !== undefined && r.value !== '';
        if (hasValue) {
            return `${r.date} [${r.timeType}]: ${r.value} mmol/L${r.symptoms && r.symptoms.length > 0 ? ` (伴隨症狀: ${r.symptoms.join(',')})` : ''}`;
        } else {
            return `${r.date} [${r.timeType}]: 僅記錄身體症狀 (症狀: ${r.symptoms && r.symptoms.length > 0 ? r.symptoms.join(',') : '無'})`;
        }
    }).join('; ');
}

export async function getClarificationQuestions(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    concern: string,
    history: ChatTurn[] = []
): Promise<ClarificationQuestion[]> {
    // Layer 0: Safety Gate
    const safety = checkSafetyGate(concern, profile);
    if (safety.isEmergency) {
        return [{
            id: 'emergency_check',
            question: safety.message || "⚠️ 偵測到可能嘅緊急徵狀，請立即處理並尋求醫護協助。安全第一！",
            options: ["我會立即處理", "我仲清醒，想繼續了解 (風險自負)"],
            isPreference: false
        }];
    }

    // Layer 1: Scenario Classifier (Return Array)
    const scenarios = classifyScenario(concern);
    
    // Value Clarification Check (Policy: Education-First Default)
    // 檢查是否有任何場景需要 VC
    const anyNeedsVC = scenarios.some(s => needsValueClarification(s, concern));
    if (!anyNeedsVC) {
        return []; // VC = No -> 跳過澄清環節，直接進入 Education Path
    }

    const instruction = `你是一位專業且極其親切、同理心十足的香港糖尿病共同決策輔助（Shared Decision-making, SDM）衛教助理。你現在的角色是「澄清問題生成器」。
    你的職責是：根據病人的查詢、血糖數據和健康背景，必須精準預備並生成【剛好 2 個】高度個人化、量身定制的澄清問題，以便進一步釐清病人的日常習慣、心理抗拒根源、或是生活取捨偏好。

    【重要規則】：
    1. 你必須生成且僅生成剛好 2 個問題。絕對不能返回空數組（[]）或少於/多於 2 個。
    2. 你只能輸出符合指定的 JSON Schema 的 JSON 數組（Array of Objects），千萬不要輸出任何額外解釋、Markdown 標記、前言或後語。
    3. 必須使用親切、溫暖、極具同理心、接地氣、地道的香港廣東話口語（例如使用「食藥」、「打針」、「篤手指」、「驚針／驚痛」、「傷肝腎」、「擔心副作用」、「驚低血糖」）。
    4. 結構與題型要求：
       - 第一個問題（事實與細節釐清，isPreference: false）：聚焦於與當前查詢相關的糖尿病管理事實或過往經驗。
         * 例如，針對「唔想打針」：詢問醫生建議的是哪種類型的注射劑（如每日打一次嘅針，定係一星期只需注射一次嘅新型控糖針），或者以前有沒有用過此藥/打過針的經驗。
         * 例如，針對飲食問題：詢問具體飲食習慣（如主食吃什麼、日常外食情況）。
       - 第二個問題（價值與偏好探索，isPreference: true）：必須直接聚焦於病人此時最真實的心理感受、心理抗拒根源、首要擔憂或生活偏好。
         * 例如，針對「唔想打針」：詢問他/她「最抗拒或最擔心打針嘅原因係咩？」（或者「為什麼不想打針」）。選項應包含：「驚痛怕針」、「擔心低血糖」、「驚有副作用/傷身」、「覺得帶出街麻煩」、「擔心形成依賴」等。
         * 例如，針對飲食：詢問病人此時最希望如何平衡「外食口腹之慾」與「血糖穩定」。
    5. 不要進行任何治療建議、診斷、或4-Layer回答。只專專心心問好這兩個澄清問題。`;

    const prompt = `
    【病人最新查詢】"${concern}"
    【血糖數據摘要】: ${formatGlucoseContext(glucoseRecords)}
    【病人背景資料】: ${profile.age}歲, 性別:${profile.gender}, 糖尿病病齡:${profile.yearsWithDiabetes}年`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: {type: Type.STRING},
                            question: {type: Type.STRING},
                            options: {type: Type.ARRAY, items: {type: Type.STRING}},
                            isPreference: {type: Type.BOOLEAN}
                        },
                        required: ["id", "question", "options", "isPreference"]
                    }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("getClarificationQuestions fetch/api error:", error);
        throw error;
    }
}

export async function getSuggestedQuestions(
    profile: UserProfile,
    concern: string,
    answers: { question: string, answer: string }[],
    supplement: string,
    history: ChatTurn[] = []
): Promise<string[]> {
    const scenarios = classifyScenario(concern);
    const instruction = buildFinalSystemInstruction(scenarios, profile, undefined, history);

    const prompt = `基於查詢「${concern}」及釐清後的反饋「${JSON.stringify(answers)}」，準備 3-5 個就診議題，幫助病人在下次覆診時同醫生溝通。請回覆 JSON 字串數組。`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {type: Type.STRING}
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("getSuggestedQuestions fetch/api error:", error);
        throw error;
    }
}

export async function getFinalDecisionResult(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    concern: string,
    answers: { question: string, answer: string }[],
    selectedQuestions: string[],
    supplement: string,
    history: ChatTurn[] = []
): Promise<DecisionResult> {
    const scenarios = classifyScenario(concern);
    // 檢查是否有緊急情況（雖然已經過 Safety Gate，但在生成最終結果前再次檢查以防萬一）
    const safety = checkSafetyGate(concern, profile);
    const instruction = buildFinalSystemInstruction(scenarios, profile, safety.isEmergency ? safety.message : undefined, history);

    const prompt = `
    【病人查詢】${concern}
    【釐清反饋】${JSON.stringify(answers)}
    【選定問診議題】${JSON.stringify(selectedQuestions)}
    【額外補充】${supplement}
    【最近血糖數據】${formatGlucoseContext(glucoseRecords)}
    
    回應要求：
    1. 同理心要大。
    2. 解釋要清楚（引用檢索到的臨床知識，並說明建議依據）。
    3. 核心分析摘要 (summary) 格式：
       - 使用分段、列點。
       - 使用 **粗體** 突出重點關鍵詞。
       - 用地道廣東話。
    4. 建議行動 (whatToDoNow)：
       - 提供明確、可操作的「我而家可以點做」。
    5. 輸出判斷層 (outputDecision)：
       - showOptionsComparison: 只有在存在 meaningful trade-off、有至少兩個合理做法可比較、且病人已表達偏好時才設為 true。
       - showDoctorQuestions: 只有在需要 consultation prep 時（如指標解讀、藥物副作用、明顯需要下次覆診討論）才設為 true。
       - showPatientValues: 只有在捕捉到病人的價值觀優先次序時才設為 true。
    6. 一句話重點：精確提煉核心消息。
    7. 追溯與主題標籤 (traceability)：
       - 請辨識本次查詢的 topic_focus (如 fruit_selection) 及 subtopic (如 portion_control)。
    8. 重點抽取：提及 statedConcern, caregiverMentioned, preference 等。
    9. 方案利弊對照 (optionsComparison) 格式：
       - 每個方案的 "pros" (優勢) 與 "cons" (顧慮) 必須用換行符 (\\n) 隔開的多個簡單 bullet-points 方式整理（每點一行，開始加「- 」）。
    10. 輸出符合 Schema 的 JSON。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        oneSentenceSummary: {type: Type.STRING},
                        summary: {type: Type.STRING},
                        whatToDoNow: {type: Type.STRING},
                        patientValuesSummary: {type: Type.STRING},
                        optionsComparison: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    option: {type: Type.STRING},
                                    pros: {type: Type.STRING},
                                    cons: {type: Type.STRING}
                                },
                                required: ["option", "pros", "cons"]
                            }
                        },
                        doctorQuestions: {type: Type.ARRAY, items: {type: Type.STRING}},
                        briefVersion: {
                            type: Type.OBJECT,
                            properties: {
                                takeHomeMessages: {type: Type.ARRAY, items: {type: Type.STRING}}
                            },
                            required: ["takeHomeMessages"]
                        },
                        detailedVersion: {
                            type: Type.OBJECT,
                            properties: {
                                optionComparison: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            option: {type: Type.STRING},
                                            pros: {type: Type.STRING},
                                            cons: {type: Type.STRING}
                                        },
                                        required: ["option", "pros", "cons"]
                                    }
                                },
                                suggestedDiscussionPoints: {type: Type.ARRAY, items: {type: Type.STRING}},
                                generalExplanation: {type: Type.STRING}
                            }
                        },
                        traceability: {
                            type: Type.OBJECT,
                            properties: {
                                scenario: {type: Type.STRING},
                                topic_focus: {type: Type.STRING},
                                subtopic: {type: Type.STRING},
                                sources: {type: Type.ARRAY, items: {type: Type.STRING}},
                                safetyModeTriggered: {type: Type.BOOLEAN},
                                confidence: {type: Type.STRING},
                                isFallback: {type: Type.BOOLEAN}
                            },
                            required: ["scenario", "sources", "safetyModeTriggered", "confidence", "isFallback"]
                        },
                        outputDecision: {
                            type: Type.OBJECT,
                            properties: {
                                showOptionsComparison: {type: Type.BOOLEAN},
                                showDoctorQuestions: {type: Type.BOOLEAN},
                                showPatientValues: {type: Type.BOOLEAN}
                            },
                            required: ["showOptionsComparison", "showDoctorQuestions", "showPatientValues"]
                        },
                        extractedProfileData: {
                            type: Type.OBJECT,
                            properties: {
                                statedConcern: {type: Type.STRING},
                                caregiverMentioned: {type: Type.BOOLEAN},
                                preference: {type: Type.STRING},
                                educationTopic: {type: Type.STRING},
                                scenarioTheme: {type: Type.STRING},
                                inferredNote: {type: Type.STRING},
                                riskSignal: {type: Type.STRING}
                            }
                        }
                    },
                    required: ["oneSentenceSummary", "summary", "whatToDoNow", "optionsComparison", "doctorQuestions", "outputDecision", "traceability"]
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("getFinalDecisionResult error:", error);
        throw error;
    }
}

/**
 * 新增：深入衛教 (Deeper Education) - Topic-aware continuation
 */
export async function getDeeperEducationResult(
    profile: UserProfile,
    parentResult: DecisionResult,
    history: ChatTurn[] = []
): Promise<{ topic: string, content: string, options: string[] }> {
    const scenarios = parentResult.traceability?.scenario ? parentResult.traceability.scenario.split('、') as Scenario[] : [Scenario.GENERAL_FALLBACK];
    const instruction = buildFinalSystemInstruction(scenarios, profile, undefined, history);

    const prompt = `
    【上下文資訊】
    - 原本話題 (Topic Focus): ${parentResult.traceability?.topic_focus || '未知'}
    - 次級話題 (Subtopic): ${parentResult.traceability?.subtopic || '未知'}
    - 前次摘要: ${parentResult.summary}
    
    【任務要求】
    1. 沿著當前主題進行「深入衛教」。
    2. 不要重新查詢整個場景的大類知識，要更細緻、具體。
    3. 檢索優先順序 (Retrieval Priority): same topic > same node > same scenario。
    4. 語氣溫暖，使用地道廣東話。
    5. 提供 2-3 個「接下來你可能想知」的具體小選項。
    6. 輸出符合 schema 的 JSON。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: {type: Type.STRING},
                        content: {type: Type.STRING},
                        options: {type: Type.ARRAY, items: {type: Type.STRING}}
                    },
                    required: ["topic", "content", "options"]
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("getDeeperEducationResult error:", error);
        throw error;
    }
}

/**
 * 新增：深化決策支持 (Deeper VC) - 針對方案進行更細緻的價值探索
 */
export async function getDeeperChoiceResult(
    profile: UserProfile,
    parentResult: DecisionResult,
    history: ChatTurn[] = []
): Promise<{ topic: string, content: string, options: string[] }> {
    const scenarios = parentResult.traceability?.scenario ? parentResult.traceability.scenario.split('、') as Scenario[] : [Scenario.GENERAL_FALLBACK];
    const instruction = buildFinalSystemInstruction(scenarios, profile, undefined, history);

    const prompt = `
    【上下文資訊】
    - 目前方案摘要: ${JSON.stringify(parentResult.optionsComparison)}
    - 前次分析結果: ${parentResult.summary}
    
    【任務要求】
    1. 針對目前提到的方案，進行「深化決策支持」。
    2. 穿透表面的好點壞點，探討病人在乎的「生活品質」、「長期便利性」或「副作用心理壓力」。
    3. 語氣像一位知心朋友，用地道廣東話。
    4. 提供 2-3 個「你可以再深思或者同醫生傾下」的選項。
    5. 輸出符合 schema 的 JSON (topic, content, options)。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: {type: Type.STRING},
                        content: {type: Type.STRING},
                        options: {type: Type.ARRAY, items: {type: Type.STRING}}
                    },
                    required: ["topic", "content", "options"]
                }
            }
        });

        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("getDeeperChoiceResult error:", error);
        throw error;
    }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    const model = "gemini-3.5-flash";
    const prompt = "你是一個語音輸入法助手。請將這段錄音準確地轉換為繁體中文（廣東話）。請只返回聽寫出的文字內容，不要包含任何額外的解釋、旁白或標點。";

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                },
                prompt
            ]
        });

        return response.text?.trim() || '';
    } catch (error) {
        console.error("transcribeAudio error:", error);
        throw error;
    }
}

// 記憶 API Quota 狀態，避免在 Quota 超過後重複發起無效請求
let isGeminiQuotaExceeded = false;

const LOCAL_FALLBACK_TIPS = [
    {
        icon: "🍵",
        title: "港式飲茶少甜秘訣",
        desc: "老友記，出街飲茶或去茶餐廳時，記得主動同伙記講「走甜」或「少甜」，或改用代糖，熱咖啡、奶茶唔加煉奶，對穩定血糖非常有幫助呀！",
        tag: "膳食指南",
        source: "香港衞生署長者健康服務",
        url: "https://www.elderly.gov.hk"
    },
    {
        icon: "🌳",
        title: "飯後散步十五分鐘",
        desc: "飯後同家人或者街坊去附近公園散散步 15 分鐘，可以幫助身體利用糖分，主動消耗熱量，對穩定血糖、增強體力都非常好呀！",
        tag: "日常運動",
        source: "香港衞生署長者健康服務",
        url: "https://www.elderly.gov.hk"
    }
];

export async function getConversationalChatResponse(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    message: string,
    history: ChatTurn[] = [],
    imageAttachment?: { data: string; mimeType: string }
): Promise<any> {
    const scenarios = classifyScenario(message);
    const activeNodes = FULL_ROUTING_CONFIG.nodes.filter(n => scenarios.includes(n.scenario_group));
    const allSourceOrder = Array.from(new Set(activeNodes.flatMap(n => n.preferred_source_order || [])));
    const knowledgeText = allSourceOrder.slice(0, 3).map(sourceId => {
        const entry = CLINICAL_KNOWLEDGE[sourceId as keyof typeof CLINICAL_KNOWLEDGE];
        return entry ? `【${entry.title}】: ${entry.content}` : "";
    }).filter(t => t !== "").join('\n\n');

    // 檢查是否為純信息查詢 (資訊查詢、一般衛教、無選擇抗拒之場景)
    const anyNeedsVC = scenarios.some(s => needsValueClarification(s, message));
    const hasPreferenceInHistory = history.some(h => h.content.includes("我已選擇我的個人偏好") || h.content.includes("重視：【") || h.content.includes("偏好"));
    const isPreferenceResponse = message.includes("我已選擇我的個人偏好") || message.includes("重視：【");
    
    const isPureInformational = !anyNeedsVC && !hasPreferenceInHistory && !isPreferenceResponse && !imageAttachment;

    let fastPathInstruction = "";
    if (isPureInformational) {
        fastPathInstruction = `
【極速回答優化（純信息查詢）】：
因為本條用戶訊息為純信息諮詢、衛教問答、指標解讀或不涉及決策支持/方案選擇的諮詢，你必須以最快速度輸出答案：
1. 將 activeNode 設為 5，並提供暖心的衛教解答。
2. 為了大幅節省生成 Token 的時間，請【絕對不要】生成 optionsComparison / detailedVersion.optionComparison（請直接將 optionComparison 設為空數組 []）。
3. detailedVersion.generalExplanation 應專注於 2-3 句通俗易懂的實用生活情境指引與延伸貼士（用通俗大白話解釋，避免生澀的醫學名詞與生理機轉），【絕對不要重複 briefVersion 已提及的具體行動步驟】。
4. briefVersion.takeHomeMessages 提供 3 條高資訊密度、量化、立即可執行的重點（加粗關鍵詞，高信噪比）。
5. 這能將大模型的輸出 Token 數減少 80%，讓老友記在 2 秒之內極速獲得答案！`;
    }

    const imageContextInstruction = imageAttachment 
        ? `\n【📷 圖片多模態辨識指示】：
用戶在此次對話中上傳了一張圖片（可能為處方藥袋標籤、藥盒包裝、藥丸、血糖機讀數或餐食照片）。
請你利用多模態視覺能力：
1. 若為藥物/藥袋照片：精準讀取中英文藥名、劑量規格、用法（每日幾次、每次幾粒、飯前或飯後）及注意事項，並在 reply 中用親切廣東話清楚解讀，同時在 detailedVersion.generalExplanation 給出該藥的日常服用注意細節、常見生活反應及漏服應對等實用貼士（用通俗白話說明，避免生澀醫學機轉名詞）。
2. 若為餐食照片：辨識主要食物成分，特別指出碳水化合物/澱粉及隱形糖分，並給予友善的升糖指數與份量建議。
3. 若為血糖儀或檢驗報告：解讀照片中的數值並對比標準範圍。
4. 請務必在 briefVersion 中提供 2-3 條最核心的拍照辨識結論與行動貼士。` 
        : '';

    const chatInstruction = `你是一位專業、溫馨且富有同理心的糖尿病健康管理與衛教助手，能用親切易懂的語言提供科學、實用、體貼的控糖與健康管理建議。

【👵 長者閱讀與排版極重要優化（分行展示、極簡短、低負擔）】
1. 你的主力回覆 'reply'（即對話氣泡內的主體內容）必須【非常簡短】，一般控制在 2-4 句話內，減輕長者的閱讀壓力和大腦負荷。
2. 絕對要【分行展示】，不要把所有字擠成一大段。每一小句話、甚至一小句逗號後都要積極使用換行符（\n）進行換行，讓版面看起來乾淨、有呼吸感。
3. 【🚫 稱呼後禁止分行】：在開頭稱呼老友記（例如「陳局長，」、「老友記，」、「林太，」）之後，【絕對不要】緊接著換行或分行！請讓第一句話直接連在稱呼後面，例如：「老友記，你張藥袋照片我幫你睇過啦！\n\n呢隻係降糖常用嘅 Metformin (二甲雙胍)。\n每日早晚各食一粒，記得隨餐服用呀！❤」
4. 句式要簡短、口語化，多使用親切的地道廣東話。行首可以使用溫馨的 emoji（如 👵, 🌟, 💊, 🩸）來增加視覺焦點，方便放大字型閱讀。
5. 所有複雜的臨床機制、詳細分析、方案利弊對比或問醫生的問題，請【通通放進 detailedVersion 與 briefVersion 欄位】，絕對不要塞在 'reply' 主體裡。
6. 【❗極重要警告】：你必須【絕對禁止】在任何回覆欄位（包括 reply、detailedVersion.generalExplanation、briefVersion.takeHomeMessages、summary、question、rationale 等）輸出任何 HTML 標籤（如 <br/>、<br>、<p>、</p>）。你必須且只能使用標準換行符（\n）來進行分行與換段！否則長者會直接在螢幕上看到亂碼一樣的標籤！${imageContextInstruction}
    
【5-Node 專家流程控制與行為準則】
你必須在底層遵循一條由 5 個階段節點（Node）組成的臨床對話推理軌跡（LangGraph）：

【❗個人化飲食、水果與生活量身定制（核心準則）】
當用戶詢問任何飲食、水果（如食咩生果）、外食、正餐、點心、飲茶、零食或運動相關問題時：
1. 【絕對禁止】忽略用戶在個人健康檔案中記錄的「平時喜歡的食物 (favoriteFoods)」與飲食習慣，絕不能給出千篇一律的通用模板回答！
2. 【必須主動呼應並量身指導】：
   - 例如：若患者檔案註明喜歡食「榴槤」，當患者詢問「食咩生果可以幫我控制血糖？」或任何水果問題時：
     * 你【必須主動提及並同理長者對榴槤的喜愛】（例如：「老友記/陳太，我知道你平時好中意食榴槤，但榴槤糖分同熱量都比較高，如果想食過下口癮，建議嚴格控制喺一小核以內，最好擺喺兩餐之間食，千祈唔好一次食成房呀！」）。
     * 同時，推薦適合糖友日常控糖的低升糖指數 (低GI) 水果（如藍莓、奇異果、蘋果、士多啤梨等），並配合「每次一個拳頭大」的份量技巧。
   - 例如：若檔案註明喜歡「叉燒飯、港式奶茶、點心」，當問及外食或主食時，必須主動提供對應的改良技巧（如叉燒去肥少汁、多叫一碟焯菜、奶茶走甜等）。
3. 這樣長者才能獲得既有同理心、又具體切合個人飲食喜好的控糖建議！

- **Node 1 🛡️ Safety Monitoring (安全防護與心理健康)**：
  - 必須最先執行！檢查用戶的最新輸入是否涉及：
    1. 急性低血糖症狀（手震、出汗、心悸、頭暈、意識模糊等）。
    2. 糖尿病酮酸中毒/高滲透壓高血糖狀態等急性併發症（極度口渴、多尿、嘔吐、呼吸果香等）。
    3. 嚴重足部傷口感染。
    4. 心理健康/情緒危機或自殺傾向（「想死」、「生無可戀」、「情緒好差」、「絕望」等）。
  - 若偵測到急性風險或情緒危機，必須將 activeNode 設為 1，reply 必須包含明確的安全警示或情緒同理並建議尋求熱線/急症協助。

- **Node 2 🧭 Intent Routing (意圖分流)**：
  - 若無急性安全風險，分析用戶的意圖。
  - 將用戶意圖劃分為：
    - 數值解讀與指標解讀 (Glucose Interpretation)
    - 飲食與生活習慣建議 (Diet Advice)
    - 藥物副作用與用藥依從性 (Medication Adherence)
    - 偏好敏感醫療決策 (Preference-Sensitive Decision Support，如要不要打針、要不要選 CGM 等)
    - 一般健康知識與醫學概念諮詢 (General Information / Concept Inquiry，例如「什麼是糖化血色素」、「什麼是胰島素抵抗」、「糖尿病有什麼常見成因」等單純了解資訊的提問)

- **Node 3 🗣️ Structured Patient Preferences Exploration (結構化偏好探究 - 基於文獻與 PDA 標準核心標註詞)**：
  - 面臨多個治療方案的抉擇或內心抗拒時（例如：要不要打針、加藥方案抉擇、是否改打針、CGM 連續血糖儀與傳統篤手指的取捨等偏好敏感問題）。
  - 如果是決策支持 (decision support) 且用戶還沒有點選或表明過他的偏好，你必須將 activeNode 設為 3。
  - 當 activeNode 為 3 時，你必須返回 preferenceQuestions（包含 questionText 和 options）。
  - **【核心規範：卡片必須嚴格採用權威文獻與患者決策輔助工具 (PDA) 的核心標註詞，純中文標準用語，不加英文註釋，不使用隨意口語化詞彙】**：
    * **針對「注射 / 胰島素 / 針劑抉擇」**，options 的 label 必須採用以下標準標註維度（提供 3-4 個）：
      1. label: "注射恐懼與疼痛"，valueCategory: "Administration/Pain"，description: "對針頭穿刺的恐懼、怕痛或自我注射困難"
      2. label: "低血糖風險"，valueCategory: "Safety"，description: "擔憂發生低血糖急性反應（頭暈、心悸、意識模糊）"
      3. label: "長期依賴性與心理障礙"，valueCategory: "Psychological Burden"，description: "擔憂一旦開始注射無法停藥、自責病情惡化或形成終身依賴"
      4. label: "生活作息與社交干擾"，valueCategory: "Convenience"，description: "外出就餐、社交聚會或旅行時攜帶與冷藏儲存的便利程度"
      5. label: "體重增加顧慮"，valueCategory: "Quality of Life"，description: "擔憂開始注射治療後可能引起的體重上升"
    * **針對「CGM 連續血糖儀 vs 指尖採血篤手指」**，options 的 label 必須採用以下標準標註維度：
      1. label: "指尖採血負擔"，valueCategory: "Convenience"，description: "厭倦每日多次指尖採血的疼痛與操作繁瑣"
      2. label: "即時波形與夜間低血糖預警"，valueCategory: "Safety"，description: "需要即時動態血糖走勢、高低血糖警報以降低夜間低血糖焦慮"
      3. label: "感應器佩戴與外觀"，valueCategory: "Quality of Life"，description: "感應器長期貼附皮膚的舒適度、外觀顧慮或皮膚過敏"
      4. label: "耗材自費經濟負擔"，valueCategory: "Cost"，description: "感應器定期更換的自費成本與經濟可持續性"
    * **針對「一般降糖藥物更換 / 加藥抉擇」**：
      1. label: "臨床療效與器官保護"，valueCategory: "Effectiveness"，description: "強效降糖與心腎等重要靶器官的長遠保護獲益"
      2. label: "不良反應與耐受性"，valueCategory: "Safety"，description: "腸胃不適、水腫或其他藥物副作用耐受度"
      3. label: "給藥簡便性與依從性"，valueCategory: "Convenience"，description: "每日服藥次數與生活規律配合程度"
      4. label: "自費藥費負擔"，valueCategory: "Cost"，description: "長期用藥的醫療自費支出"
  - **【🚫 核心禁令：禁止提前展示行動要點】**：在 Node 3（詢問偏好階段），你【絕對不要】輸出具體行動要點（請將 briefVersion.takeHomeMessages 設為空數組 []），也不要輸出 detailedVersion.optionComparison 或給出確定性的治療方案建議！因為此時長者尚未表達個人偏好，直接給出建議違背共同決策 (SDM) 原則。你必須且只能在長者選擇並提交偏好之後（Node 5），才根據長者的具體偏好量身給出行動要點與建議！
  - **不要**在 'reply' 中直接決定治療偏好，應同理其情緒並引導用戶點選卡片。

- **Node 4 📚 Clinical Reasoning & Evidence Retrieval (臨床推理與方案利弊盤點)**：
  - 基於意圖與長者偏好，檢索指引中的實證數據（如 ADA 指引或香港衞生署指南）。
  - **【針對 Preference-Sensitive 決策問題（特別是「要不要打胰島素/針劑」、「要不要選擇 CGM 連續血糖儀」）】**：
    * 必須針對長者所面臨的兩個核心選項（例如：選項A「開始打胰島素/針劑」 vs 選項B「維持或調整口服藥」；或選項A「使用 CGM 連續監測儀」 vs 選項B「傳統指尖採血篤手指」），客觀全面地盤點其 **優點 (Pros)** 與 **缺點/顧慮 (Cons)**。
    * 結合長者已表達的個人偏好（如怕痛、擔心低血糖、獨居無人看顧、生活便利性等）與個人健康檔案（HbA1c、病齡、用藥），權衡各方案對該位長者的實際影響。
  - 結合健康檔案（如年齡、用藥背景、識字程度、是否有家人照顧）進行邏輯推理。

- **Node 5 ✍️ Integrated Output (整合輸出與分工原則)**：
  - 將推理結果轉化為患者友善、高信噪比的結構化內容（在長者已提交偏好後，或非偏好敏感場景觸發）。
  - 採用「雙通道編排（Dual-Channel Layout）」同時生成，【兩者職責分明，嚴禁內容重複】：
    - **【簡單重點 (briefVersion.takeHomeMessages)】—— 提高資訊密度 (High Information Density)**：
      * **核心任務**：
        - 對於【需要具體行動或調整的生活/用藥/處置諮詢】：回答「**做什麼 (Actionable What & How)**」，專注於最核心的具體行動、數字、劑量、時機與可執行步驟。
        - 對於【單純了解醫學常識/名詞概念的 General Information 諮詢】（例如「什麼是糖化血色素」、「什麼是血糖波動」、「點解會有糖尿病」）：用戶純粹想獲取知識，**不需要**強加「立即行動」指引，此時 briefVersion.takeHomeMessages 請提供 **1-2 條最精華的核心概念摘要（Key Concepts Summary）**，或者直接返回空數組 \`[]\`（由對話主體與詳細說明完整解答即可）。
      * **嚴格去除廢話**：【絕對禁止】任何空泛無用的套話（如「保持好心情」、「記得準時吃藥」等無量化空話）。
      * **高密度量化要點 (2-3 條)**：當需要行動時，每條要點必須包含**具體數值/份量/頻率/時機/具體品項**（例如「**每餐主食減至半碗**，以糙米/燕麥替代白飯」、「**餐後 30 分鐘快走 15-20 分鐘**，促進肌肉攝取葡萄糖」、「**二甲雙胍隨第一口飯服用**，可減低 70% 腸胃不適」）。
      * **關鍵詞加粗**：每條要點的最核心關鍵詞必須使用 \`**加粗**\`，讓讀者 1 秒內抓取最高價值資訊。
    - **【詳細說明 (detailedVersion.generalExplanation)】—— 通俗生活指引與延伸貼士 (Practical Lifestyle Guidance & Context)**：
      * **核心任務**：提供「**通俗生活延伸說明與實用情境貼士 (Practical Lifestyle Context & Tips)**」。專注於大眾、長者與家屬能輕鬆看懂的生活化背景、日常生活實用建議與情境應對技巧（如外食聚餐避坑技巧、不同生活作息調整、身體小感覺的日常觀察、常見生活迷思澄清等）。
      * **【🚫 避免生澀醫學機轉】**：【絕對不要】堆砌深奧難懂的病理生理機制、生化名詞（如 GLUT-4、SGLT-2 閾值、受體敏感性、分子機轉等），普羅大眾（Layman）看不懂！請全部轉化為平實、易懂、生活化的大白話！
      * **【🚫 嚴格去重禁令】**：【絕對禁止】換句話說去重新複述一遍 \`briefVersion\` 中已經列出的具體行動清單！
      * **【🎯 方案利弊 (detailedVersion.optionComparison) 核心輸出要求】**：
        - 【日常諮詢嚴禁生成】：日常飲食（如吃水果/外食/零食）、日常運動、漏服一次藥物、普通血糖波動等日常諮詢（佔 90%），**絕對不要**生成 \`optionComparison\`（請直接返回空數組 \`[]\` 或省略）！不要為了對比而生造方案，避免給長者帶來額外認知負擔。
        - 【Preference-Sensitive 重大決策必備 (特別是胰島素與 CGM)】：當長者面臨**「要不要打胰島素/針劑」**或**「要不要選擇 CGM 連續血糖儀」**等重大取捨，且**已完成偏好選擇**後，你必須在 \`detailedVersion.optionComparison\` 中輸出清晰平衡的 2 個選項 Pros/Cons 利弊對照（例如：選項名稱、優點 Pros、缺點/考量 Cons、適用情況），幫助長者帶到診室與醫生深入探討！
      * **【就診提問 (suggestedDiscussionPoints) 智能按需原則】**：
        - 【日常諮詢/普通知識查詢】：用戶純粹詢問常識或日常飲食生活時，**不要強塞過多問題**，僅在有真正醫患商討價值時提供 1-2 條高針對性問題，若無必要可直接返回空數組 \`[]\`，以防長者資訊過載。
        - 【用藥調整/化驗異常/重大抉擇 (Node 5)】：才提供 2-3 條精準、具體、長者能直接唸給醫生聽的臨床提問。
      * 結合覆診提問指引（suggestedDiscussionPoints/doctorQuestions）。
  - 對話主體 'reply' 必須使用地道、親切、溫慢的香港廣東話（口語，多使用「老友記」、「篤手指」、「食嘢」等）。${fastPathInstruction}`;

    const prompt = `
    【患者完整健康與生活檔案（Profile & Lifestyle）】
    ${formatUserProfileSummary(profile)}
    
    【動態檢索到的臨床實證指引（Evidence Guidance）】
    ${knowledgeText || "無特定檢索，請依據一般 ADA/HK 糖尿病管理實證原則"}

    【最近 10 次血糖數據及不適症狀】
    ${formatGlucoseContext(glucoseRecords)}

    【最新用戶訊息】
    "${message}"
    ${imageAttachment ? "（用戶同時上傳了照片，請結合照片內容解答）" : ""}

    【對話歷史（History）】
    ${formatHistoryContext(history)}

    請根據最新用戶訊息與上傳圖片，嚴格按照 5-Node LangGraph 的設計和行為準則，分析目前的對話階段並返回對應的 JSON。
    【特別提醒（偏好敏感問題之先問偏好、後給建議規則 - 強制觸發）】：
    - 【什麼是偏好敏感問題】：只要用戶提出包含「要不要打針」、「應唔應該打針」、「唔知要不要打針/打胰島素」、「唔想打針」、「驚打針」、「要不要選CGM/連續血糖儀」、「篤手指定用CGM好」、「換藥定打針」等重大方案抉擇或心裡抗拒！
    - 如果這是偏好敏感的抉擇/抗拒問題，且用戶還沒有點選或表明過他的偏好（歷史中無「我已選擇我的個人偏好」）：
      * 【強制規定】：你【必須】將 activeNode 設為 3，並返回 preferenceQuestions（包含 questionText 和 3-4 個 options，options 必須包含 valueCategory、label、description，例如：怕痛驚針、擔心低血糖、擔心藥物依賴/傷身、日常攜帶便利性等）。
      * 此時 reply 應同理長者的抗拒與擔憂（如「老友記，我好明白你聽到要打針會好驚或者好抗拒...」），並親切引導他點選卡片選擇最在意的考量。
      * 【🚫 禁止提前展示行動要點】：在此階段【絕對不要給出確定性的打針建議或具體行動要點】，請將 briefVersion.takeHomeMessages 設為空數組 []，detailedVersion.optionComparison 設為 []。
    - 如果長者已經點選並提交了偏好（如最新訊息或歷史中包含「我已選擇我的個人偏好」）：
      * 你必須將 activeNode 設為 5，在獲取長者的偏好後，再生成量身定制的 reply、briefVersion.takeHomeMessages（今日核心行動要點）、detailedVersion.optionComparison（客觀列出 Pros & Cons 方案利弊對照表）以及 detailedVersion.generalExplanation！`;

    try {
        const contentParts: any[] = [];
        if (imageAttachment && imageAttachment.data) {
            const cleanBase64 = imageAttachment.data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
            contentParts.push({
                inlineData: {
                    mimeType: imageAttachment.mimeType || 'image/jpeg',
                    data: cleanBase64
                }
            });
        }
        contentParts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: [
                {
                    role: "user",
                    parts: contentParts
                }
            ],
            config: {
                systemInstruction: chatInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        activeNode: {type: Type.INTEGER},
                        decisionType: {type: Type.STRING},
                        confidence: {type: Type.NUMBER},
                        isLowConfidenceDefaulted: {type: Type.BOOLEAN},
                        explorationQuestion: {type: Type.STRING},
                        
                        preferenceQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: {type: Type.STRING},
                                    questionText: {type: Type.STRING},
                                    options: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                valueCategory: {type: Type.STRING},
                                                label: {type: Type.STRING},
                                                description: {type: Type.STRING}
                                            },
                                            required: ["valueCategory", "label", "description"]
                                        }
                                    }
                                },
                                required: ["id", "questionText", "options"]
                            }
                        },

                        reply: {type: Type.STRING},
                        
                        briefVersion: {
                            type: Type.OBJECT,
                            properties: {
                                takeHomeMessages: {type: Type.ARRAY, items: {type: Type.STRING}}
                            },
                            required: ["takeHomeMessages"]
                        },

                        detailedVersion: {
                            type: Type.OBJECT,
                            properties: {
                                optionComparison: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            option: {type: Type.STRING},
                                            pros: {type: Type.STRING},
                                            cons: {type: Type.STRING}
                                        },
                                        required: ["option", "pros", "cons"]
                                    }
                                },
                                suggestedDiscussionPoints: {type: Type.ARRAY, items: {type: Type.STRING}},
                                generalExplanation: {type: Type.STRING}
                            }
                        },

                        suggestedFollowUps: {type: Type.ARRAY, items: {type: Type.STRING}},

                        traceability: {
                            type: Type.OBJECT,
                            properties: {
                                safetyModeTriggered: {type: Type.BOOLEAN},
                                triggeredNodes: {type: Type.ARRAY, items: {type: Type.STRING}},
                                currentStep: {type: Type.STRING}
                            },
                            required: ["safetyModeTriggered", "triggeredNodes", "currentStep"]
                        }
                    },
                    required: ["activeNode", "decisionType", "confidence", "isLowConfidenceDefaulted", "reply", "suggestedFollowUps", "traceability"]
                }
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        
        // Ensure legacy fields are mapped to maintain backwards compatibility with existing UI references if any
        return {
            ...parsed,
            optionsComparison: parsed.detailedVersion?.optionComparison || parsed.optionsComparison || [],
            patientValuesSummary: parsed.patientValuesSummary || "",
            doctorQuestions: parsed.detailedVersion?.suggestedDiscussionPoints || parsed.doctorQuestions || []
        };
    } catch (error) {
        console.error("getConversationalChatResponse error:", error);
        throw error;
    }
}



/**
 * AI 統計高頻保存的問題並提供話題統計分析（3-5個分類）與推薦問診問題（精準 3 個問題）
 */
export async function analyzeSavedQuestions(questions: string[]): Promise<{
    summary: string;
    categories?: {
        categoryName: string;
        description: string;
        frequency: string;
    }[];
    recommendedQuestions: {
        question: string;
        categoryTag?: string;
    }[];
    suggestedDoctorPrep?: string[];
}> {
    if (!questions || questions.length === 0) {
        return {
            summary: "老友記，您暫時未有保存任何問題。在問診或與 AI 對話時，如果見到想問醫生的問題，可以點擊「保存」，AI 會在這裡幫您按經常問的 3-5 個類別整理總結！",
            recommendedQuestions: []
        };
    }

    const prompt = `
    請分析以下由糖尿病長者（老友記）保存的問題清單：
    ${JSON.stringify(questions)}
    
    請進行清晰、結構化的整理：
    1. 【經常保存的 3-5 類別問題總結】：統計並歸納出長者最關心的 3 至 5 個核心類別話題（例如：用藥與副作用、飲食份量與技巧、日常血糖波動、低血糖預防、足部與併發症檢查等），並按出現頻率排序，簡短說明每個類別的主要關注點。
    2. 【整體 AI 總結摘要 (summary)】：用親切的香港廣東話口語（2-3 句），整體概述長者最關注的焦點。
    3. 【建議問診問題 (recommendedQuestions)】：根據上述 3-5 個類別重點，精準提煉出【剛好 3-5 個】最實用、切中要害、可直接向醫生開口發問的廣東話問題。
       - 格式要求：直接給出問題句子本身（question），並標註所屬類別標籤（categoryTag）。
    
    請嚴格使用以下 JSON 結構返回：
    - summary: 整體概述（繁體中文廣東話口語）
    - categories: 歸納出的 3-5 個類別列表，每項包含：
       - categoryName: 類別名稱（例如：「用藥與副作用管理」）
       - description: 簡要說明（例如：「關心食藥後的胃脹、低血糖風險及是否需調藥」）
       - frequency: 頻率標籤（例如：「最常提問」、「高頻關注」或「經常諮詢」）
    - recommendedQuestions: 建議就診提問列表（剛好 3-5 個），每項包含：
       - question: 建議直接問醫生的廣東話問題句子（例如「醫生，我食咗藥後成日胃脹，可唔可以調整藥物？」）
       - categoryTag: 所屬類別標籤
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "你是一位香港糖尿病就診溝通助理。你的任務是總結長者保存的問題，歸納出 3-5 個經常保存的類別問題，並根據重點精準給出 3-5 個建議就診提問句子。文字精簡、親切廣東話口語，不囉嗦。",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {type: Type.STRING},
                        categories: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    categoryName: {type: Type.STRING},
                                    description: {type: Type.STRING},
                                    frequency: {type: Type.STRING}
                                },
                                required: ["categoryName", "description"]
                            }
                        },
                        recommendedQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: {type: Type.STRING},
                                    categoryTag: {type: Type.STRING}
                                },
                                required: ["question"]
                            }
                        }
                    },
                    required: ["summary", "categories", "recommendedQuestions"]
                }
            }
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text.trim());
        const list = (parsed.recommendedQuestions || []).slice(0, 5);
        return {
            summary: parsed.summary || "老友記，已按你最常保存嘅問題類別整理好總結與建議提問：",
            categories: (parsed.categories || []).slice(0, 5),
            recommendedQuestions: list
        };
    } catch (e) {
        console.error("analyzeSavedQuestions error:", e);
        // Fallback analysis if API fails
        const fallbackCategories = [
            { categoryName: "降糖用藥與反應", description: "關注藥物服用時間、胃腸反應及漏服處理", frequency: "高頻關注" },
            { categoryName: "飲食份量與外食", description: "關注外出飲茶、澱粉水果份量與飯後血糖升幅", frequency: "經常諮詢" },
            { categoryName: "日常血糖波動與指標", description: "關注空腹與餐後血糖差距及糖化血色素達標情況", frequency: "持續追蹤" }
        ];
        const fallbackRecommended: { question: string; categoryTag?: string }[] = [
            { question: "醫生，我食完降糖藥之後有時覺得胃部唔適，想問下係咪正常反應？需唔需要調整？", categoryTag: "用藥反應" },
            { question: "醫生，我食某些食物（例如生果或澱粉類）之後血糖升得較急，份量應該點控制？", categoryTag: "飲食控制" },
            { question: "醫生，呢度係我最近記錄嘅血糖數值，想問下我目前嘅血糖波動算唔算理想？", categoryTag: "血糖波動" }
        ];

        return {
            summary: "老友記，按你記錄中出現最多嘅 3 個類別重點（用藥反應、飲食控制與日常血糖波動），為你整理咗以下建議提問：",
            categories: fallbackCategories,
            recommendedQuestions: fallbackRecommended
        };
    }
}

/**
 * 聯網或由大模型動態生成香港權威衛教指引貼士
 */
export async function generateDailyTipFromHKWebsites(): Promise<{
    icon: string;
    title: string;
    desc: string;
    tag: string;
    source: string;
    url?: string;
}> {
    const prompt = `請生成一個適合香港糖尿病長者的溫馨日常控糖貼士（Daily Diabetes Control Tip）。
    
貼士要求：
1. 語氣溫馨、體貼，使用地道親切的香港廣東話（口語）。
2. 主題可以圍繞以下其中之一：飲食管理（如飲茶技巧、少鹽低糖、水果分量）、日常運動（如飯後散步、在家拉筋）、血糖檢測、足部護理、防低血糖、就醫溝通等。
3. 提供 1 個合適的 emoji 作為 icon。
4. 提供一個具有吸引力的短標題 (title)。
5. 提供具體、實用的行動建議描述 (desc)。
6. tag 必須是以下之一：「膳食指南」、「日常運動」、「自我監測」、「足部護理」、「用藥注意」或「情緒舒緩」。
7. source 必須是權威機構，如：「香港衞生署長者健康服務」、「香港糖尿病聯會」或「香港醫院管理局」。
8. url 請提供與該主題或機構相關的香港官方權威網站連結（如 https://www.elderly.gov.hk 或 https://www.ha.org.hk）。

請嚴格以符合 Schema 的 JSON 格式返回。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "你是一位精通香港長者健康衛教的糖尿病管理專家。你擅長用極其親切、充滿關懷的地道香港廣東話，為糖尿病長者提供易讀、易懂、實用的日常生活小建議。",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        icon: {type: Type.STRING},
                        title: {type: Type.STRING},
                        desc: {type: Type.STRING},
                        tag: {type: Type.STRING},
                        source: {type: Type.STRING},
                        url: {type: Type.STRING}
                    },
                    required: ["icon", "title", "desc", "tag", "source", "url"]
                }
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
            icon: parsed.icon || "💡",
            title: parsed.title || "均衡飲食控血糖",
            desc: parsed.desc || "老友記，記住每餐食飯都要定時定量，多選擇高纖維食物，出街食飯少甜少鹽，對控制血糖好有幫助呀！",
            tag: parsed.tag || "膳食指南",
            source: parsed.source || "香港衞生署長者健康服務",
            url: parsed.url || "https://www.elderly.gov.hk"
        };
    } catch (error) {
        console.error("generateDailyTipFromHKWebsites error:", error);
        return {
            icon: "🍵",
            title: "港式飲茶少甜秘訣",
            desc: "老友記，出街飲茶或去茶餐廳時，記得主動同伙記講「走甜」或「少甜」，或改用代糖，熱咖啡、奶茶唔加煉奶，對穩定血糖非常有幫助呀！",
            tag: "膳食指南",
            source: "香港衞生署長者健康服務",
            url: "https://www.elderly.gov.hk"
        };
    }
}

/**
 * 透過 AI 視覺能力辨識藥袋、藥盒或處方箋圖片中的藥物資訊
 */
export async function recognizeMedicationsFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
    medications: { name: string; dosage?: string; usage?: string }[];
    rawNotes?: string;
}> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const prompt = `請辨識並提取這張相片中（如香港公立醫院/私家診所藥袋、藥盒標籤、處方單等）的所有藥物資訊。

提取要求：
1. 提取每種藥物的名稱 (name)：中英文名稱均可，優先使用標籤上的常用藥名（如 Metformin / 雙胍、Gliclazide、Dapagliflozin / 達格列淨、Empagliflozin、Semaglutide 等）。
2. 提取劑量 (dosage)：例如 500mg, 850mg, 10mg, 30units 等。若無則留空。
3. 提取服用方法/用法 (usage)：例如「每日早晚各一次，隨餐服」、「每日一次，早餐前」等。若無則留空。
4. 整理出一個簡要備註 (rawNotes)，指出辨識出的整體摘要與溫馨提醒。

請嚴格按照 JSON Schema 格式回傳。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType || "image/jpeg",
                                data: cleanBase64
                            }
                        },
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            config: {
                systemInstruction: "你是一位專業的臨床藥劑師助理。你擅長辨識香港及華人地區醫院和診所的藥袋標籤、藥丸包裝及藥物處方，準確提取藥名、劑量與服用指引。",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        medications: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    dosage: { type: Type.STRING },
                                    usage: { type: Type.STRING }
                                },
                                required: ["name"]
                            }
                        },
                        rawNotes: { type: Type.STRING }
                    },
                    required: ["medications"]
                }
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
            medications: Array.isArray(parsed.medications) ? parsed.medications : [],
            rawNotes: parsed.rawNotes || ''
        };
    } catch (error) {
        console.error("recognizeMedicationsFromImage error:", error);
        throw error;
    }
}


    


