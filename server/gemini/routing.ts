import { ThinkingLevel } from "@google/genai";
import type { ChatTurn } from "../../utils/types.ts";
import { Scenario, type ScenarioValue } from "../taxonomy.ts";
import { getFastModel, getTextModel, getVisionModel } from "./env.ts";

export const MAJOR_DECISION_PATTERNS = [
    '打針', '打胰島素', '胰島素', 'insulin', '控糖針', '排糖針', '轉針', '換針', '注射',
    'cgm', '連續血糖儀', '動態血糖', '無痛血糖', '感應器',
    '換藥', '加藥', '停藥', '減藥', '調整劑量', '加劑量', '減劑量',
    '要不要打', '應唔應該打', '要唔要打', '唔想打針', '驚打針',
    '利弊', '方案比較', '點揀好', '點決定', '加藥定打針', '換藥定打針', '篤手指定cgm'
];

export const PREFERENCE_CONTINUATION_PATTERNS = [
    '點揀', '點選', '點算', '點做好', '點決定', '應該點', '咁我', '即係', '下一步'
];

const EXPLICIT_COMPARISON_PATTERNS = [
    '對比', '对比', '比較', '比较', '區別', '区别', '分別', '分别', '不同之處', '不同之处',
    '優缺點', '优缺点', '有邊幾種', '有哪幾種', '有哪几种', '各類', '各类', '常見藥物', '常见药物', '常用糖尿病藥', '常用糖尿病药'
];

export function isExplicitComparisonQuery(message: string): boolean {
    const text = (message || '').toLowerCase();
    return EXPLICIT_COMPARISON_PATTERNS.some(kw => text.includes(kw));
}

export interface ChatModelRoute {
    model: string;
    thinkingLevel: ThinkingLevel;
    tier: 'fast' | 'deep';
    reason: string;
}

export function selectChatModelRoute(params: {
    message: string;
    scenarios: ScenarioValue[];
    isPreferenceResponse: boolean;
    preferenceContinuation?: boolean;
    hasImage: boolean;
    trimmedHistory: ChatTurn[];
}): ChatModelRoute {
    const { message, scenarios, isPreferenceResponse, preferenceContinuation, hasImage, trimmedHistory } = params;
    const text = (message || '').toLowerCase();

    if (hasImage) {
        return {
            model: getVisionModel(),
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'multimodal_image',
        };
    }

    if (preferenceContinuation) {
        return {
            model: getTextModel(),
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'preference_continuation',
        };
    }

    if (isPreferenceResponse) {
        return {
            model: getTextModel(),
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'preference_decision_synthesis',
        };
    }

    if (
        scenarios.includes(Scenario.DECISION_SUPPORT_PREFERENCE) ||
        MAJOR_DECISION_PATTERNS.some(kw => text.includes(kw))
    ) {
        return {
            model: getTextModel(),
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'major_decision_support',
        };
    }

    const lastTurn = trimmedHistory[trimmedHistory.length - 1];
    if (
        lastTurn &&
        (lastTurn.content.includes('我已選擇我的個人偏好') ||
            MAJOR_DECISION_PATTERNS.some(kw => lastTurn.content.toLowerCase().includes(kw)))
    ) {
        return {
            model: getTextModel(),
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'major_decision_followup',
        };
    }

    return {
        model: getFastModel(),
        thinkingLevel: ThinkingLevel.MINIMAL,
        tier: 'fast',
        reason: 'everyday_education_fast_path',
    };
}

