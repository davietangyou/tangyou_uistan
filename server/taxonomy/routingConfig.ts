/**
 * Static taxonomy routing table used when assembling chat prompts.
 */
import { Scenario } from './types.ts';

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
