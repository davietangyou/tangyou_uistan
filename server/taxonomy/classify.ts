/**
 * Keyword-based scenario classification and value-clarification checks.
 */
import { Scenario, type ScenarioValue } from './types.ts';

export function classifyScenario(concern: string): ScenarioValue[] {
    const text = concern.toLowerCase();
    const scores: { scenario: ScenarioValue; score: number }[] = [];

    const configs: { scenario: ScenarioValue; keywords: string[] }[] = [
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

    return scores.sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(s => s.scenario);
}

export function needsValueClarification(scenario: ScenarioValue, query: string): boolean {
    if (scenario === Scenario.DECISION_SUPPORT_PREFERENCE) {
        return true;
    }

    const preferenceSignals = [
        "要唔要打針", "要不要打針", "應唔應該打針", "唔知打唔打", "唔想打針", "驚打針", "怕痛",
        "要不要打胰島素", "應唔應該打胰島素", "cgm", "連續血糖儀", "篤手指定", "換藥定打針", "點揀好", "應唔應該換"
    ];
    if (preferenceSignals.some(sig => query.toLowerCase().includes(sig))) {
        return true;
    }

    if (scenario === Scenario.GLUCOSE_INTERPRETATION || scenario === Scenario.HYPOGLYCEMIA) {
        return false;
    }

    if (scenario === Scenario.DIET_ADVICE) {
        const tradeOffKeywords = ["但係", "好難", "唔想", "點算", "又想又怕", "唔想掃興", "煩", "想食", "矛盾", "戒唔到", "控制唔到", "好難揀", "唔好意思", "朋友", "家人", "飲茶", "方便", "平衡", "點揀", "邊個好", "驚血糖高", "又想", "又唔想", "取捨"];
        return tradeOffKeywords.some(k => query.includes(k));
    }

    if (scenario === Scenario.MEDICATION_ADHERENCE) {
        return true;
    }

    return false;
}