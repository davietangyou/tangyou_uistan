/**
 * Phase 1 Taxonomy & Control Layer (Aligned with Flowchart v5)
 */
import { UserProfile } from "../utils/types";

export enum Scenario {
    GLUCOSE_INTERPRETATION = 'hba1c_interpretation',
    HYPOGLYCEMIA = 'hypoglycemia',
    DIET_ADVICE = 'diet_management_questions',
    MEDICATION_ADHERENCE = 'medication_side_effect_adherence',
    DECISION_SUPPORT_PREFERENCE = 'decision_support_preference',
    GENERAL_FALLBACK = 'general_fallback',
    EMERGENCY_DKA_HHS_FOOT = 'dka_hhs_foot_escalation'
}

export const FULL_ROUTING_CONFIG = {
    nodes: [
        {
            node_id: "DM-PREF-1",
            leaf_label: "重大治療方案抉擇與偏好（打針/CGM/換藥）",
            scenario_group: Scenario.DECISION_SUPPORT_PREFERENCE,
            risk_level: "Moderate",
            safety_trigger_keywords: ["要不要打針", "應唔應該打針", "唔想打針", "驚打針", "打胰島素", "cgm", "連續血糖儀", "篤手指", "換藥", "加藥"],
            do_not_answer_directly: ["不強行替患者做決定", "不擅自更改處方"],
            preferred_source_order: ["INSULIN-HK", "MONITOR-PRO", "ADA-13", "HK-HB"]
        },
        {
            node_id: "DM-1-3-4",
            leaf_label: "糖化血紅素（HbA1c）",
            scenario_group: Scenario.GLUCOSE_INTERPRETATION,
            risk_level: "Low",
            safety_trigger_keywords: [],
            do_not_answer_directly: ["不作個人化治療判斷", "不直接建議改藥"],
            preferred_source_order: ["ADA-6", "HK-HB"]
        },
        {
            node_id: "DM-4-1-3",
            leaf_label: "數值解讀與意義理解",
            scenario_group: Scenario.GLUCOSE_INTERPRETATION,
            risk_level: "Low",
            safety_trigger_keywords: ["差咁遠", "跳來跳去", "唔穩定", "朝早高"],
            do_not_answer_directly: ["不作個人化目標判定"],
            preferred_source_order: ["FLUCTUATE-HK", "HK-HB", "ADA-6"]
        },
        {
            node_id: "DM-6-2-3-4",
            leaf_label: "檢驗指標解讀",
            scenario_group: Scenario.GLUCOSE_INTERPRETATION,
            risk_level: "Low",
            safety_trigger_keywords: [],
            do_not_answer_directly: ["不作個人化醫療建議"],
            preferred_source_order: ["HK-HB", "ADA-6"]
        },
        {
            node_id: "DM-3-1-1",
            leaf_label: "低血糖",
            scenario_group: Scenario.HYPOGLYCEMIA,
            risk_level: "High",
            safety_trigger_keywords: ["手震", "出汗", "心悸", "頭暈", "意識不清", "昏", "冒冷汗"],
            do_not_answer_directly: ["個人化急救判斷", "藥量調整", "自行停藥"],
            preferred_source_order: ["ADA-6", "HA-DIET", "HK-HB"]
        },
        {
            node_id: "DM-4-3-1",
            leaf_label: "食物選擇困惑",
            scenario_group: Scenario.DIET_ADVICE,
            risk_level: "Low",
            safety_trigger_keywords: [],
            do_not_answer_directly: ["不提供個人化餐單", "不提供精準熱量處方"],
            preferred_source_order: ["HA-DIET", "ADA-5", "HK-HB"]
        },
        {
            node_id: "DM-4-3-3",
            leaf_label: "出外用膳挑戰",
            scenario_group: Scenario.DIET_ADVICE,
            risk_level: "Low",
            safety_trigger_keywords: [],
            do_not_answer_directly: ["不提供個人化餐單", "不對特殊共病作精細營養處方"],
            preferred_source_order: ["OUTSIDE-HK", "HA-DIET", "ADA-5"]
        },
        {
            node_id: "DM-2-2-4",
            leaf_label: "藥物副作用",
            scenario_group: Scenario.MEDICATION_ADHERENCE,
            risk_level: "Moderate",
            safety_trigger_keywords: ["停藥", "傷身", "好多副作用", "好唔舒服", "胃痛", "唔舒服"],
            do_not_answer_directly: ["改藥", "停藥", "換藥", "劑量調整", "判定某副作用一定由某藥造成"],
            preferred_source_order: ["ADA-13", "ADA-5", "HK-HB"]
        },
        {
            node_id: "DM-2-2-8",
            leaf_label: "食藥依從性",
            scenario_group: Scenario.MEDICATION_ADHERENCE,
            risk_level: "Moderate",
            safety_trigger_keywords: ["打針", "胰島素", "中藥", "中醫"],
            do_not_answer_directly: ["停藥建議", "自行加減藥", "責備式語言"],
            preferred_source_order: ["INSULIN-HK", "TCM-HK", "ADA-13", "HK-HB"]
        },
        {
            node_id: "DM-5-1-1",
            leaf_label: "日常監測心理",
            scenario_group: Scenario.GENERAL_FALLBACK,
            risk_level: "Low",
            safety_trigger_keywords: ["麻煩", "日日量", "排斥", "驚"],
            do_not_answer_directly: ["不建議完全停止監測"],
            preferred_source_order: ["MONITOR-PRO", "ADA-6"]
        }
    ]
};

/**
 * Layer 0 Safety Gate
 * Checks keywords and profile flags for high-risk situations.
 */
export function checkSafetyGate(query: string, profile: UserProfile): { 
    isEmergency: boolean; 
    type?: 'acute_hypoglycemia' | 'dka_hhs' | 'foot_wound';
    message?: string;
} {
    const text = query.toLowerCase();
    
    // 1. Acute Hypoglycemia
    const hypoKeywords = ["手震", "出汗", "心悸", "頭暈", "昏", "意識不清", "冒冷汗"];
    if (hypoKeywords.some(k => text.includes(k))) {
        return { 
            isEmergency: true, 
            type: 'acute_hypoglycemia',
            message: "⚠️ 偵測到可能嘅緊急低血糖徵狀！請立即食用 15 克糖分（如 3 粒方糖或半罐汽水），15 分鐘後再量血糖。如果徵狀無改善或意識模糊，請立即致電 999 尋求協助。安全第一，暫時唔好依賴 AI 回覆。"
        };
    }

    // 2. DKA / HHS
    const dkaKeywords = ["口渴難忍", "多尿", "嘔吐", "呼吸有果味", "意識模糊", "極度疲倦", "肚痛"];
    if (dkaKeywords.some(k => text.includes(k))) {
        return {
            isEmergency: true,
            type: 'dka_hhs',
            message: "⚠️ 偵測到嚴重高血糖危象（如 DKA 或 HHS）嘅徵象！請立即前往急症室或致電 999 尋求緊急醫療協助。呢種情況需要即時醫院處理，唔好嘗試自行解決。安全第一！"
        };
    }

    // 3. Foot Wound
    const footKeywords = ["傷口不癒合", "紅腫發熱", "潰瘍", "腳痛", "腳趾變黑", "腳部感染"];
    if (footKeywords.some(k => text.includes(k))) {
        return {
            isEmergency: true,
            type: 'foot_wound',
            message: "⚠️ 偵測到可能嘅足部感染或潰瘍！由於糖尿病病友足部問題惡化得好快，請於 24 小時內儘快前往診所或尋求專業醫護處理。暫時請保持傷口清潔，避免再次受壓，但一定要搵專業醫護處理。"
        };
    }

    // 4. Mental Health Crisis
    const mentalHealthKeywords = ["自殺", "想死", "唔想做人", "死咗去", "傷害自己", "抑鬱", "崩潰", "絕望", "無出口", "情緒好差", "生無可戀", "厭世"];
    if (mentalHealthKeywords.some(k => text.includes(k))) {
        return {
            isEmergency: true,
            message: "⚠️ 偵測到你嘅情緒可能正處於極大壓力或困擾之中。你並不孤單，有人願意陪伴你。請考慮立即致電以下熱線尋求專業支援：\n\n1. 香港撒瑪利亞防止自殺會：2389 2222\n2. 生命熱線：2382 0000\n3. 醫管局精神科 24小時電話諮詢：2466 7350\n4. 社會福利署熱線：2343 2255\n\n如果你感到即時生命危險，請立即致電 999。我哋非常關心你嘅安全，請優先尋求專業協助。"
        };
    }

    // 5. Profile Risk Flags Check (Combined with vague discomfort)
    const hasHighRiskProfile = profile.isInsulinUser || profile.hasHypoUnawareness || profile.hasHypoHistory;
    if (hasHighRiskProfile && (text.includes('好唔舒服') || text.includes('好暈') || text.includes('想嘔'))) {
        return {
            isEmergency: true,
            message: "⚠️ 由於你有相關風險背景且感到明顯不適，建議你暫停使用 AI，儘快聯繫你的家屬或尋求醫療協助。安全第一！"
        };
    }
    
    return { isEmergency: false };
}

/**
 * Layer 1 Scenario Classifier (Top-2 candidates allowed)
 */
export function classifyScenario(concern: string): Scenario[] {
    const text = concern.toLowerCase();
    const scores: { scenario: Scenario, score: number }[] = [];

    const configs = [
        { 
            scenario: Scenario.DECISION_SUPPORT_PREFERENCE, 
            keywords: [
                '要不要打針', '應唔應該打針', '唔知要唔要打針', '唔知要不要打針', '唔想打針', '驚打針', '怕打針', '怕痛', '打唔打針', 
                '要不要打胰島素', '應唔應該打胰島素', '打胰島素', 'insulin', '控糖針', '排糖針', '轉針', '換針',
                'cgm', '連續血糖儀', '動態血糖', '無痛血糖', '要唔要買cgm', '要不要選cgm', '篤手指定cgm', '感應器',
                '要不要換藥', '應唔應該換藥', '加藥定打針', '換藥定打針', '點揀好', '點選擇', '點決定', '好矛盾', '唔知點揀'
            ] 
        },
        { scenario: Scenario.GLUCOSE_INTERPRETATION, keywords: ['糖化', 'hba1c', '指標', '報告', '數值', 'a1c', '血糖值', '空腹血糖', '餐後血糖', '量血糖'] },
        { scenario: Scenario.HYPOGLYCEMIA, keywords: ['低血糖', '血糖太低', '頭暈', '冒汗', '手震', '心悸', '出汗'] },
        { scenario: Scenario.DIET_ADVICE, keywords: ['水果', '生果', '果汁', '份量', '主食', '飲茶', '茶樓', '出街食飯', '餐廳', '外賣', '食乜', '飯', '粥', '麵', '麵包', '戒口', '戒甜', '零食'] },
        { scenario: Scenario.MEDICATION_ADHERENCE, keywords: ['藥', '丸', '針', '打針', '注射', '食藥', '停藥', '減藥', '加藥', '忘記食藥', '副作用', '傷身', '忘記', '唔記得', '麻煩', '依從性', '二甲雙胍', '美福明', 'metformin', '胰島素', 'insulin', '格列', '淨', '糖', '控糖', '利拉魯肽', '司美格魯肽', '安達唐', '達格列淨', '恩格列淨', '捷諾維'] }
    ];

    configs.forEach(c => {
        let score = 0;
        c.keywords.forEach(k => { if (text.includes(k)) score += 1; });
        if (score > 0) scores.push({ scenario: c.scenario, score });
    });

    if (scores.length === 0) return [Scenario.GENERAL_FALLBACK];

    // Sort by score and take top 2
    return scores.sort((a, b) => b.score - a.score)
                 .slice(0, 2)
                 .map(s => s.scenario);
}

/**
 * Value Clarification Check (Policy: Education-First Default)
 */
export function needsValueClarification(scenario: Scenario, query: string): boolean {
    // 偏好敏感決策 (Preference-Sensitive Decision Support): VC = Yes (Always trigger)
    if (scenario === Scenario.DECISION_SUPPORT_PREFERENCE) {
        return true;
    }

    // 檢查查詢文字是否包含強烈決策/偏好敏感特徵詞
    const preferenceSignals = [
        "要唔要打針", "要不要打針", "應唔應該打針", "唔知打唔打", "唔想打針", "驚打針", "怕痛", 
        "要不要打胰島素", "應唔應該打胰島素", "cgm", "連續血糖儀", "篤手指定", "換藥定打針", "點揀好", "應唔應該換"
    ];
    if (preferenceSignals.some(sig => query.toLowerCase().includes(sig))) {
        return true;
    }

    // HbA1c / 低血糖: VC = No (Education Path only)
    if (scenario === Scenario.GLUCOSE_INTERPRETATION || scenario === Scenario.HYPOGLYCEMIA) {
        return false;
    }
    
    // 飲食管理: Conditional (detect trade-off / preference signal words first)
    if (scenario === Scenario.DIET_ADVICE) {
        const tradeOffKeywords = ["但係", "好難", "唔想", "點算", "又想又怕", "唔想掃興", "煩", "想食", "矛盾", "戒唔到", "控制唔到", "好難揀", "唔好意思", "朋友", "家人", "飲茶", "方便", "平衡", "點揀", "邊個好", "驚血糖高", "又想", "又唔想", "取捨"];
        return tradeOffKeywords.some(k => query.includes(k));
    }
    
    // 藥物場景: VC = Yes (Always trigger)
    if (scenario === Scenario.MEDICATION_ADHERENCE) {
        return true;
    }
    
    return false;
}

