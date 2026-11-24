import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { ChatTurn, GlucoseRecord, HbA1cRecord, UserProfile } from "../utils/types.ts";
import { CLINICAL_KNOWLEDGE } from "../services/knowledgeBase.ts";
import { conditionsList } from "../utils/constants.ts";
import {
    FULL_ROUTING_CONFIG,
    Scenario,
    checkSafetyGate,
    classifyScenario,
    type SafetyAssessment,
    type ScenarioValue
} from "./taxonomy.ts";

const CONDITION_LABEL_MAP: Record<string, string> = {
    NONE: '無其他已知長期疾病',
    ...Object.fromEntries(conditionsList.map(c => [c.id, c.label]))
};

const DIET_HABIT_LABEL_MAP: Record<string, string> = {
    OUTSIDE_EATING: '經常出街食飯（外食為主）',
    REFINED_CARB: '主食偏好精製澱粉（如白飯、麵包、河粉、粥）',
    SUGARY_DRINK: '習慣飲含糖飲品（如奶茶、凍檸茶、汽水）',
    MIDNIGHT_SNACK: '有食宵夜或睡前點心習慣',
    HOME_COOK: '飲食定時定量，家中自煮為主'
};

const EXERCISE_INTENSITY_LABEL_MAP: Record<string, string> = {
    LIGHT: '輕度活動（輕鬆無明顯出汗）',
    MODERATE: '中等強度（微出汗、可說話但不能唱歌）',
    VIGOROUS: '劇烈強度（明顯氣喘）'
};

function buildProfileConstraints(profile?: Partial<UserProfile>): string[] {
    const safeProfile = profile || {};
    const constraints: string[] = [];
    const conditions = safeProfile.conditions || [];
    const dietHabits = safeProfile.dietHabits || [];

    if (conditions.includes('OA')) {
        constraints.push(
            '【運動安全約束（退化性關節炎）】：患者患有退化性關節炎。提供任何運動建議時，必須優先推薦低衝擊、保護關節的運動（如平地慢步、水中健體、坐姿椅子操、太極或溫和伸展），並明確提醒避開深蹲、跑跳、頻繁爬樓梯或陡坡行山等增加膝／髖關節負荷的動作。'
        );
    }
    if (conditions.includes('HD') || conditions.includes('ST') || safeProfile.isFrail) {
        constraints.push(
            '【運動安全約束（心腦血管／體弱風險）】：患者有心臟病、中風病史或屬高齡體弱情況。建議運動須循序漸進、以輕至中等負荷為主，並提醒若出現胸悶、氣喘或頭暈應立即停止休息。'
        );
    }
    if (conditions.includes('RD')) {
        constraints.push(
            '【運動安全約束（呼吸系統疾病）】：患者有呼吸系統疾病，建議運動時須注意調節呼吸節奏、避免過於劇烈或引發喘促的活動。'
        );
    }
    if (conditions.includes('CT')) {
        constraints.push(
            '【日常安全提示（白內障）】：患者有白內障，戶外運動或查看藥物標籤／血糖機數值時需提醒注意光線充足與防跌倒。'
        );
    }

    if (dietHabits.includes('OUTSIDE_EATING')) {
        constraints.push(
            '【飲食情境約束（外食為主）】：患者日常以外食為主。提供控糖飲食建議時，不可只建議「自己在家煮」，必須優先提供香港常見外食場景（茶餐廳、燒味飯、兩餸飯、粉麵店、飲茶點心）的具體點餐與改良技巧（如少飯／半碗飯、燒味去皮去肥、走汁或醬汁另上、加點灼菜走油、飲品走甜）。'
        );
    }
    if (dietHabits.includes('REFINED_CARB')) {
        constraints.push(
            '【飲食情境約束（偏好精製澱粉）】：患者主食偏好白飯、麵包、河粉或粥，建議時須提供易於執行的份量控制與替換技巧（如先菜肉後吃飯、白粥減量並配瘦肉蔬菜、半碗飯配高纖蔬菜）。'
        );
    }
    if (dietHabits.includes('SUGARY_DRINK')) {
        constraints.push(
            '【飲食情境約束（含糖飲品習慣）】：患者習慣飲用含糖飲品（如奶茶、凍檸茶、汽水），飲食建議須針對性提醒「走甜／少甜／轉無糖熱茶或檸檬水」等實際替代方案。'
        );
    }
    if (dietHabits.includes('MIDNIGHT_SNACK')) {
        constraints.push(
            '【飲食情境約束（宵夜習慣）】：患者有宵夜或睡前點心習慣，須針對性提醒減少高糖高澱粉宵夜，如因肚餓或防夜間低血糖需加餐，應建議低負擔選擇（如無糖豆漿、少量全麥梳打餅）並配合睡前血糖監測。'
        );
    }

    return constraints;
}

let cachedAi: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("伺服器未配置 GEMINI_API_KEY，請檢查環境變數設定。");
    }
    if (!cachedAi) {
        cachedAi = new GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: {
                    "User-Agent": "aistudio-build",
                },
            },
        });
    }
    return cachedAi;
}

const DEEP_TEXT_MODEL = "gemini-4-hydrogen";
const FAST_TEXT_MODEL = "gemini-3.1-flash-lite";
const TEXT_MODEL = DEEP_TEXT_MODEL;
const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";
const PRIMARY_COOLDOWN_MS = 60_000;
let primaryCooldownUntil = 0;

const MAJOR_DECISION_PATTERNS = [
    '打針', '打胰島素', '胰島素', 'insulin', '控糖針', '排糖針', '轉針', '換針', '注射',
    'cgm', '連續血糖儀', '動態血糖', '無痛血糖', '感應器',
    '換藥', '加藥', '停藥', '減藥', '調整劑量', '加劑量', '減劑量',
    '要不要打', '應唔應該打', '要唔要打', '唔想打針', '驚打針',
    '利弊', '方案比較', '點揀好', '點決定', '加藥定打針', '換藥定打針', '篤手指定cgm'
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
    hasImage: boolean;
    trimmedHistory: ChatTurn[];
}): ChatModelRoute {
    const { message, scenarios, isPreferenceResponse, hasImage, trimmedHistory } = params;
    const text = (message || '').toLowerCase();

    if (hasImage) {
        return {
            model: DEEP_TEXT_MODEL,
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'multimodal_image',
        };
    }

    if (isPreferenceResponse) {
        return {
            model: DEEP_TEXT_MODEL,
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
            model: DEEP_TEXT_MODEL,
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
            model: DEEP_TEXT_MODEL,
            thinkingLevel: ThinkingLevel.LOW,
            tier: 'deep',
            reason: 'major_decision_followup',
        };
    }

    return {
        model: FAST_TEXT_MODEL,
        thinkingLevel: ThinkingLevel.MINIMAL,
        tier: 'fast',
        reason: 'everyday_education_fast_path',
    };
}

function isTransientGeminiError(error: unknown): boolean {
    const errObj = error as { status?: number; message?: string };
    const status = errObj?.status;
    const msg = (errObj?.message || "").toLowerCase();
    return (
        status === 503 ||
        status === 429 ||
        status === 500 ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("resource_exhausted") ||
        msg.includes("fetch failed") ||
        msg.includes("econnreset") ||
        msg.includes("etimedout")
    );
}

function isServiceUnavailableError(error: unknown): boolean {
    const errObj = error as { status?: number; message?: string };
    const status = errObj?.status;
    const msg = (errObj?.message || "").toLowerCase();
    return (
        status === 503 ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded")
    );
}

async function generateContentWithRetry(
    params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
    const ai = getAiClient();
    const useFastFallbackOnly =
        params.model === DEEP_TEXT_MODEL && Date.now() < primaryCooldownUntil;
    const modelsToTry =
        params.model === DEEP_TEXT_MODEL
            ? (useFastFallbackOnly ? [FAST_TEXT_MODEL] : [DEEP_TEXT_MODEL, FAST_TEXT_MODEL])
            : params.model === FAST_TEXT_MODEL
                ? [FAST_TEXT_MODEL, DEEP_TEXT_MODEL]
                : [params.model];

    let lastError: unknown;
    for (let idx = 0; idx < modelsToTry.length; idx++) {
        const modelName = modelsToTry[idx];
        const isLastModel = idx === modelsToTry.length - 1;
        // Primary model fails over immediately on transient errors; fallback gets up to 2 attempts
        const maxAttempts = isLastModel ? 2 : 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                let nextConfig = params.config;
                if (modelName === DEEP_TEXT_MODEL) {
                    const requestedLevel = params.config?.thinkingConfig?.thinkingLevel;
                    const safeDeepLevel =
                        !requestedLevel || requestedLevel === ThinkingLevel.MINIMAL
                            ? ThinkingLevel.LOW
                            : requestedLevel;
                    nextConfig = {
                        ...params.config,
                        thinkingConfig: {
                            ...params.config?.thinkingConfig,
                            thinkingLevel: safeDeepLevel,
                        },
                    };
                } else if (modelName === FAST_TEXT_MODEL) {
                    nextConfig = {
                        ...params.config,
                        thinkingConfig: params.config?.thinkingConfig ?? {
                            thinkingLevel: ThinkingLevel.MINIMAL,
                        },
                    };
                }

                return await ai.models.generateContent({
                    ...params,
                    model: modelName,
                    config: nextConfig,
                });
            } catch (error) {
                lastError = error;
                if (!isTransientGeminiError(error)) {
                    throw error;
                }
                if (modelName === DEEP_TEXT_MODEL && isServiceUnavailableError(error)) {
                    primaryCooldownUntil = Date.now() + PRIMARY_COOLDOWN_MS;
                }
                console.warn(
                    `[Gemini] Transient error on model=${modelName} (attempt ${attempt}/${maxAttempts}):`,
                    (error as { message?: string })?.message || error
                );
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 350));
                }
            }
        }
        if (!isLastModel) {
            console.warn(`[Gemini] Falling back from ${modelName} to ${modelsToTry[idx + 1]}.`);
        }
    }
    throw lastError;
}

export const MAX_HISTORY_ROUNDS = 8; // 保留最近 8 輪有效對話（最多 16 條訊息）
const MAX_HISTORY_TURN_CHARS = 600;

const ERROR_REPLY_PREFIXES = [
    "⚠️ 唔好意思，系統暫時未能完成回覆",
    "唔好意思，系統暫時未能完成回覆",
];

function isValidHistoryTurn(turn: ChatTurn | null | undefined): turn is ChatTurn {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) return false;
    if (typeof turn.content !== 'string') return false;
    const text = turn.content.trim();
    if (!text) return false;
    if (turn.role === 'assistant') {
        if (ERROR_REPLY_PREFIXES.some(prefix => text.startsWith(prefix))) return false;
        if (text === "關於糖尿病管理，\n您目前最關心什麼？") return false;
    }
    return true;
}

export interface TrimmedHistoryResult {
    turns: ChatTurn[];
    keptRounds: number;
    omittedMessages: number;
    totalValidMessages: number;
}

export function trimConversationHistory(
    history: ChatTurn[] = [],
    maxRounds: number = MAX_HISTORY_ROUNDS
): TrimmedHistoryResult {
    const safeMaxRounds = Math.max(1, Math.floor(maxRounds));
    const maxMessages = safeMaxRounds * 2;

    const validTurns: ChatTurn[] = [];
    for (const rawTurn of Array.isArray(history) ? history : []) {
        if (!isValidHistoryTurn(rawTurn)) continue;
        const cleanedContent = rawTurn.content.trim();
        const prev = validTurns[validTurns.length - 1];
        if (prev && prev.role === 'user' && rawTurn.role === 'user' && prev.content === cleanedContent) {
            continue;
        }
        validTurns.push({
            role: rawTurn.role,
            content: cleanedContent.length > MAX_HISTORY_TURN_CHARS
                ? `${cleanedContent.slice(0, MAX_HISTORY_TURN_CHARS)}…（早期內容已精簡）`
                : cleanedContent,
        });
    }

    if (validTurns.length === 0) {
        return { turns: [], keptRounds: 0, omittedMessages: 0, totalValidMessages: 0 };
    }

    const selectedReversed: ChatTurn[] = [];
    let userRoundCount = 0;

    for (let i = validTurns.length - 1; i >= 0; i--) {
        const turn = validTurns[i];
        if (selectedReversed.length >= maxMessages) break;

        if (turn.role === 'user') {
            if (userRoundCount >= safeMaxRounds) break;
            userRoundCount++;
            selectedReversed.push(turn);
        } else {
            selectedReversed.push(turn);
        }
    }

    const windowTurns = selectedReversed.reverse();
    while (windowTurns.length > 0 && windowTurns[0].role === 'assistant') {
        windowTurns.shift();
    }

    const keptRounds = windowTurns.filter(t => t.role === 'user').length;
    const omittedMessages = Math.max(0, validTurns.length - windowTurns.length);

    return {
        turns: windowTurns,
        keptRounds,
        omittedMessages,
        totalValidMessages: validTurns.length,
    };
}

export function formatHistoryContext(trimmed: TrimmedHistoryResult): string {
    if (!trimmed.turns || trimmed.turns.length === 0) return "這是對話的開始。";

    const lines = trimmed.turns.map(
        turn => `${turn.role === 'user' ? '病人' : '助理'}: ${turn.content}`
    );

    if (trimmed.omittedMessages > 0) {
        return `（系統僅保留最近 ${trimmed.keptRounds} 輪有效對話，更早的歷史對話已省略；請聚焦最新用戶訊息與近期脈絡，勿受早期無關話題干擾）\n${lines.join('\n')}`;
    }

    return lines.join('\n');
}

export function formatUserProfileSummary(profileInput?: Partial<UserProfile>): string {
    const profile = (profileInput || {}) as UserProfile;
    const riskFlags: string[] = [];
    if (profile.isInsulinUser) riskFlags.push("正在使用胰島素 (高風險)");
    if (profile.hasHypoHistory) riskFlags.push("有低血糖病史");
    if (profile.isFrail) riskFlags.push("高齡/體弱個體 (需放寬目標)");
    if (profile.hasHypoUnawareness) riskFlags.push("無感低血糖 (極高風險)");
    if (profile.hasNoCaregiverSupport) riskFlags.push("無家人或照顧者協助 (獨居高風險，需給予更安全、易操作的個人照護建議)");
    if (profile.hasCaregiverSupport) riskFlags.push("有家人或照顧者同住協助");
    const readableConditions = (profile.conditions || []).map(condId => {
        if (condId === 'OT') {
            const customName = (profile.otherConditions || profile.conditionDetails?.OT?.specificName || '').trim();
            const years = profile.conditionDetails?.OT?.years;
            const base = customName ? `其他（${customName}）` : '其他長期疾病';
            return years ? `${base}（${years}年）` : base;
        }
        const label = CONDITION_LABEL_MAP[condId] || condId;
        const years = condId === 'HT'
            ? (profile.hypertensionYears || profile.conditionDetails?.HT?.years)
            : (condId === 'DM' ? (profile.yearsWithDiabetes || profile.conditionDetails?.DM?.years) : profile.conditionDetails?.[condId]?.years);
        return years ? `${label}（${years}年）` : label;
    });
    if (readableConditions.length > 0) {
        riskFlags.push(`已知合併症/慢性病：${readableConditions.join('、')}`);
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
        profile.exerciseIntensity ? `運動強度：${EXERCISE_INTENSITY_LABEL_MAP[profile.exerciseIntensity] || profile.exerciseIntensity}` : '',
        exerciseTypesList.length > 0 ? `平時常做運動項目：${exerciseTypesList.join('、')}` : ''
    ].filter(Boolean).join('；');

    const dietParts: string[] = [];
    if (profile.dietHabits && profile.dietHabits.length > 0) {
        const readableDietHabits = profile.dietHabits.map(id => DIET_HABIT_LABEL_MAP[id] || id);
        dietParts.push(`日常飲食習慣：${readableDietHabits.join('、')}${profile.dietHabitsOther ? ` (其他備註: ${profile.dietHabitsOther})` : ''}`);
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

    const profileConstraints = buildProfileConstraints(profile);
    const constraintsBlock = profileConstraints.length > 0
        ? `\n- 【❗個人檔案觸發之臨床與生活約束（回覆飲食與運動時必須嚴格遵守）】:\n  ${profileConstraints.join('\n  ')}`
        : '';

    return `- 患者稱呼/姓名: 「${profile.name || '用戶'}」（【極重要】：你在對話、回覆、建議中稱呼或提及病人時，必須且只能使用這個稱呼，例如「${profile.name || '用戶'}」，絕對不要使用其他虛構名字）
- 基本資料: 年齡 ${profile.age || '未填寫'} 歲，性別 ${profile.gender || '未填寫'}，糖尿病病齡 ${profile.yearsWithDiabetes || '未填寫'} 年
- 體格與檢驗指標: ${physicalMetrics || '未特別記錄'}
- 糖尿病類型與用藥背景: 診斷 ${profile.diabetesType || '2型糖尿病'}${profile.otherDiabetesType ? ` (${profile.otherDiabetesType})` : ''}；現有藥物處方: ${profile.medications || '無特別藥物記錄'}
- 臨床風險標誌與共病: ${riskFlags.length > 0 ? riskFlags.join('；') : '無特殊風險標誌'}
- 定期覆診醫療機構: ${userClinics}
- 運動習慣: ${exerciseSummary}
- 飲食習慣與喜愛食物:
  ${dietSummary}
- 識字與溝通偏好: ${profile.literacyLevel || '一般'} (如為低識字，請使用更簡短、生活化、口語化且親切的語言)${constraintsBlock}`;
}


function parseRecordTimestamp(record: { timestamp?: number; date?: string }): number {
    if (typeof record.timestamp === "number" && !isNaN(record.timestamp) && record.timestamp > 0) {
        return record.timestamp;
    }
    if (record.date) {
        const normalized = record.date.replace(/\//g, "-");
        const parsed = Date.parse(normalized);
        if (!isNaN(parsed)) return parsed;
    }
    return 0;
}

function summarizeGlucoseBucket(label: string, values: number[]): string | null {
    if (values.length === 0) return null;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = (sum / values.length).toFixed(1);
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    return values.length === 1
        ? `${label}（1次）：${avg} mmol/L`
        : `${label}（${values.length}次）：均值 ${avg} mmol/L（範圍 ${min}–${max}）`;
}

function formatSingleGlucoseDetail(r: GlucoseRecord, numValue: number | null): string {
    const timeLabel = r.mealTag ? `${r.timeType}·${r.mealTag}` : r.timeType;
    const head = numValue !== null
        ? `${r.date} [${timeLabel}]: ${numValue.toFixed(1)} mmol/L`
        : `${r.date} [${timeLabel}]: 僅症狀／備註紀錄`;

    const extras: string[] = [];
    if (r.symptoms && r.symptoms.length > 0) extras.push(`症狀:${r.symptoms.join('、')}`);
    if (r.dietNote?.trim()) extras.push(`飲食:${r.dietNote.trim()}`);
    if (r.exerciseNote?.trim()) extras.push(`運動:${r.exerciseNote.trim()}`);
    if (r.medicationNote?.trim()) extras.push(`用藥:${r.medicationNote.trim()}`);
    if (r.illnessNote?.trim()) extras.push(`身體狀況:${r.illnessNote.trim()}`);
    if (r.bpSystolic?.trim() && r.bpDiastolic?.trim()) {
        const pulsePart = r.pulse?.trim() ? `/脈搏${r.pulse.trim()}` : '';
        extras.push(`血壓:${r.bpSystolic.trim()}/${r.bpDiastolic.trim()}mmHg${pulsePart}`);
    }
    if (r.weight?.trim()) extras.push(`體重:${r.weight.trim()}`);
    if (r.mood?.trim()) extras.push(`心情:${r.mood.trim()}`);

    return extras.length > 0 ? `${head}（${extras.join('；')}）` : head;
}

export function formatGlucoseContext(records?: GlucoseRecord[], nowMs: number = Date.now()): string {
    if (!records || records.length === 0) {
        return "【資料充分性】：無紀錄（NONE）— 暫時未有任何指尖血糖或症狀紀錄。\n⚠️ 約束：不可猜測或推斷患者日常血糖是否達標；如問題需要血糖依據，請溫和提醒患者在「血糖紀錄」補充數次空腹與餐後讀數。";
    }

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffMs = nowMs - THIRTY_DAYS_MS;

    const normalized = records
        .map(r => {
            const rawVal = String(r?.value ?? "").trim();
            const parsedNum = rawVal !== "" ? parseFloat(rawVal) : NaN;
            const numValue = !isNaN(parsedNum) && parsedNum >= 0.5 && parsedNum <= 45 ? parsedNum : null;
            const ts = parseRecordTimestamp(r || {});
            return { record: r, numValue, ts };
        })
        .sort((a, b) => b.ts - a.ts);

    const recent30 = normalized.filter(item => item.ts === 0 || item.ts >= cutoffMs);

    if (recent30.length === 0) {
        const latestOld = normalized.find(item => item.numValue !== null);
        const oldNumericCount = normalized.filter(item => item.numValue !== null).length;
        const latestDesc = latestOld
            ? `最近一次紀錄為 ${latestOld.record.date} [${latestOld.record.timeType}]：${latestOld.numValue!.toFixed(1)} mmol/L`
            : `共 ${normalized.length} 筆舊紀錄`;
        return `【資料充分性】：近 30 天無新紀錄（STALE）— 歷史共有 ${oldNumericCount} 筆血糖數值，但均已超過 30 天（${latestDesc}）。\n⚠️ 約束：舊數據已過時，不可當作目前最新控糖狀態下結論，請溫和提醒患者近期補測數次血糖。`;
    }

    const numeric30 = recent30.filter((item): item is { record: GlucoseRecord; numValue: number; ts: number } => item.numValue !== null);

    if (numeric30.length === 0) {
        const recentDetails = recent30
            .slice(0, 5)
            .map(item => `  - ${formatSingleGlucoseDetail(item.record, null)}`)
            .join('\n');
        return `【資料充分性】：近 30 天僅有症狀／生活備註、無血糖數值（SYMPTOMS_ONLY，共 ${recent30.length} 筆）。\n⚠️ 約束：缺少實際指尖血糖數值，不可推斷血糖高低或是否達標。\n【近 30 天症狀與備註紀錄】：\n${recentDetails}`;
    }

    // Distinct calendar days covered in 30d
    const dayKeys = new Set<string>();
    numeric30.forEach(item => {
        if (item.ts > 0) {
            dayKeys.add(new Date(item.ts).toISOString().slice(0, 10));
        } else if (item.record.date) {
            dayKeys.add(item.record.date.split(' ')[0]);
        }
    });
    const distinctDays = Math.max(1, dayKeys.size);

    // Group by timeType
    const fastingVals = numeric30.filter(i => i.record.timeType === '空腹').map(i => i.numValue);
    const preMealVals = numeric30.filter(i => i.record.timeType === '餐前').map(i => i.numValue);
    const postMealVals = numeric30.filter(i => i.record.timeType === '餐後2小時').map(i => i.numValue);
    const bedtimeVals = numeric30.filter(i => i.record.timeType === '睡前').map(i => i.numValue);
    const otherVals = numeric30
        .filter(i => !['空腹', '餐前', '餐後2小時', '睡前'].includes(i.record.timeType))
        .map(i => i.numValue);

    const allVals = numeric30.map(i => i.numValue);
    const overallAvg = (allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(1);
    const overallMin = Math.min(...allVals).toFixed(1);
    const overallMax = Math.max(...allVals).toFixed(1);

    // Event counts
    const lowItems = numeric30.filter(i => i.numValue < 3.9);
    const severeLowCount = numeric30.filter(i => i.numValue < 3.0).length;
    const highItems = numeric30.filter(i => i.numValue > 10.0);
    const veryHighCount = numeric30.filter(i => i.numValue >= 13.9).length;
    const highFastingCount = fastingVals.filter(v => v > 7.0).length;

    // Data sufficiency assessment
    const hasPreOrFasting = fastingVals.length > 0 || preMealVals.length > 0;
    const hasPostMeal = postMealVals.length > 0;
    let sufficiencyLine: string;

    if (numeric30.length < 3) {
        sufficiencyLine = `【資料充分性】：極少／不足（INSUFFICIENT — 近 30 天僅有 ${numeric30.length} 筆有效讀數、涵蓋 ${distinctDays} 天）。\n⚠️ 嚴格約束：樣本數極少，【絕對不可】據此斷言整體控糖「穩定」或「失控」；只能針對這 ${numeric30.length} 次單點讀數作初步解讀，並主動提醒患者多測幾天（特別是空腹與餐後 2 小時配對）再作整體評估。`;
    } else if (numeric30.length < 7 || distinctDays < 3 || (!hasPreOrFasting || !hasPostMeal)) {
        const missingParts: string[] = [];
        if (!hasPreOrFasting) missingParts.push("空腹／餐前讀數");
        if (!hasPostMeal) missingParts.push("餐後 2 小時讀數");
        if (distinctDays < 3) missingParts.push("多日追蹤天數");
        const missingNote = missingParts.length > 0 ? `，缺少${missingParts.join('與')}` : "";
        sufficiencyLine = `【資料充分性】：局部有限（LIMITED — 近 30 天共 ${numeric30.length} 筆有效讀數、涵蓋 ${distinctDays} 天${missingNote}）。\n⚠️ 約束：可指出現有時段的初步觀察，但必須誠實說明紀錄尚不完整，切勿對全天或長期控糖成效過度下結論。`;
    } else {
        sufficiencyLine = `【資料充分性】：充足（ADEQUATE — 近 30 天共 ${numeric30.length} 筆有效讀數，涵蓋 ${distinctDays} 天，包含空腹／餐前與餐後對照）。`;
    }

    // Time-bucket summary lines
    const bucketLines = [
        summarizeGlucoseBucket('空腹', fastingVals),
        summarizeGlucoseBucket('餐前', preMealVals),
        summarizeGlucoseBucket('餐後2小時', postMealVals),
        summarizeGlucoseBucket('睡前', bedtimeVals),
        summarizeGlucoseBucket('其他時段', otherVals),
    ].filter((s): s is string => Boolean(s));

    // Risk event lines
    const riskParts: string[] = [
        `低血糖（<3.9 mmol/L）：${lowItems.length} 次${severeLowCount > 0 ? `（其中嚴重低血糖 <3.0 達 ${severeLowCount} 次）` : ''}`,
        `高血糖（>10.0 mmol/L）：${highItems.length} 次${veryHighCount > 0 ? `（其中明顯偏高 ≥13.9 達 ${veryHighCount} 次）` : ''}`,
    ];
    if (fastingVals.length > 0) {
        riskParts.push(`空腹偏高（>7.0 mmol/L）：${highFastingCount}/${fastingVals.length} 次`);
    }

    // Symptom frequency across 30 days
    const symptomCounts = new Map<string, number>();
    recent30.forEach(item => {
        (item.record.symptoms || []).forEach(sym => {
            const key = sym.trim();
            if (key) symptomCounts.set(key, (symptomCounts.get(key) || 0) + 1);
        });
    });
    const symptomSummary = symptomCounts.size > 0
        ? Array.from(symptomCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([sym, cnt]) => `${sym}(${cnt}次)`)
            .join('、')
        : '';

    // Blood pressure summary across 30 days
    const bpEntries = recent30
        .map(item => {
            const sys = parseFloat(item.record.bpSystolic || '');
            const dia = parseFloat(item.record.bpDiastolic || '');
            if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null;
            return { sys, dia, date: item.record.date, pulse: item.record.pulse?.trim() };
        })
        .filter((x): x is { sys: number; dia: number; date: string; pulse: string | undefined } => Boolean(x));

    let bpSummary = '';
    if (bpEntries.length > 0) {
        const latestBp = bpEntries[0];
        const elevatedBpCount = bpEntries.filter(b => b.sys >= 140 || b.dia >= 90).length;
        bpSummary = `近 30 天血壓紀錄 ${bpEntries.length} 次，最新 ${latestBp.sys}/${latestBp.dia} mmHg（${latestBp.date}${latestBp.pulse ? `，脈搏 ${latestBp.pulse}` : ''}）${elevatedBpCount > 0 ? `，其中偏高（≥140/90）${elevatedBpCount} 次` : ''}`;
    }

    // Recent detailed entries (up to 6 most recent records within 30 days, retaining diet/exercise/mealTag/BP notes)
    const recentDetails = recent30
        .slice(0, 6)
        .map(item => `  - ${formatSingleGlucoseDetail(item.record, item.numValue)}`)
        .join('\n');

    const sections = [
        sufficiencyLine,
        `【近 30 天指尖血糖統計】：整體均值 ${overallAvg} mmol/L（範圍 ${overallMin}–${overallMax}）；${bucketLines.join('；')}`,
        `【異常波動次數】：${riskParts.join('；')}`,
    ];
    if (symptomSummary) {
        sections.push(`【近 30 天伴隨症狀統計】：${symptomSummary}`);
    }
    if (bpSummary) {
        sections.push(`【近 30 天血壓紀錄】：${bpSummary}`);
    }
    sections.push(`【近期明細與生活備註（最新最多 6 筆）】：\n${recentDetails}`);

    return sections.join('\n');
}

export function formatHbA1cContext(records?: HbA1cRecord[]): string {
    if (!records || records.length === 0) {
        return "暫時未有記錄糖化血色素（HbA1c）數據（注意：不可猜測或推斷患者 HbA1c 數值，若決策或評估需要，請提醒向醫生確認最近一次抽血結果）。";
    }

    const valid = records
        .map(r => {
            const num = parseFloat(String(r?.value ?? ""));
            const ts = typeof r?.timestamp === "number" && !isNaN(r.timestamp)
                ? r.timestamp
                : (Date.parse(r?.date || "") || 0);
            return {
                valueNum: num,
                date: r?.date || "日期未填",
                ts,
            };
        })
        .filter(r => !isNaN(r.valueNum) && r.valueNum > 0 && r.valueNum < 30)
        .sort((a, b) => b.ts - a.ts);

    if (valid.length === 0) {
        return "暫時未有有效糖化血色素（HbA1c）數值記錄（不可推斷數值）。";
    }

    const latest = valid[0];
    const latestLine = `最新 HbA1c：${latest.valueNum.toFixed(1)}%（記錄日期：${latest.date}）`;

    if (valid.length === 1) {
        return `${latestLine}；共 1 次有效記錄（注意：僅有單次記錄，暫無法判斷長期 HbA1c 變化趨勢）。`;
    }

    const prev = valid[1];
    const diff = Number((latest.valueNum - prev.valueNum).toFixed(1));
    let trendDesc = `與前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）相若（變化 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%）`;
    if (diff >= 0.3) {
        trendDesc = `較前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）上升 ${diff.toFixed(1)}%`;
    } else if (diff <= -0.3) {
        trendDesc = `較前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）下降 ${Math.abs(diff).toFixed(1)}%`;
    }

    const timeline = valid
        .slice(0, 5)
        .map(r => `${r.date}: ${r.valueNum.toFixed(1)}%`)
        .join(" ← ");

    return `${latestLine}；趨勢：${trendDesc}；共 ${valid.length} 次有效記錄（近期紀錄由新到舊：${timeline}）。`;
}

export async function transcribeAudioServer(base64Audio: string, mimeType: string): Promise<string> {
    const prompt = "你是一個語音輸入法助手。請將這段錄音準確地轉換為繁體中文（廣東話）。請只返回聽寫出的文字內容，不要包含任何額外的解釋、旁白或標點。";
    const response = await generateContentWithRetry({
        model: TRANSCRIBE_MODEL,
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType || "audio/webm",
                        data: base64Audio
                    }
                },
                { text: prompt }
            ]
        }
    });

    return response.text?.trim() || '';
}

const CORE_CHAT_INSTRUCTION = `你是專業、溫暖、有同理心的香港長者糖尿病健康管理助手，以親切地道的香港廣東話口語（「老友記」、「篤手指」、「食嘢」）提供科學、實用、易明的控糖建議。

【長者閱讀與格式鐵律】
1. 主回覆 reply 必須簡短（2-4 句），善用換行符（\n）分段，行首可加適量溫馨 emoji（如 🌟、💊、🩸），減輕閱讀負擔。
2. 開頭稱呼（如「陳伯，」、「老友記，」）後【禁止緊接換行】，第一句須直接接在稱呼後面。
3. 嚴禁在任何欄位輸出任何 HTML 標籤（如 <br/>、<p>），只可用標準換行符（\n）。
4. 切勿把長篇解釋或覆診清單塞進 reply，請妥善分工放入 briefVersion 與 detailedVersion。

【安全底線與數據誠實原則】
1. 若用戶描述當下正發生急性低血糖（手震、冷汗、心悸、頭暈、意識模糊）、酮酸中毒／嚴重高血糖危象（極度口渴、嘔吐、果味呼吸）、嚴重足部感染或情緒／自傷危機，必須將 activeNode 設為 1、safetyModeTriggered 設為 true，並提醒立即求醫或尋求家人／熱線協助。
2. 嚴格遵守患者檔案中的共病安全約束、日常飲食習慣與喜好食物，不可給出與其病況或生活脫節的通用模板。
3. 涉及整體控糖成效或 HbA1c 時須準確引用實際紀錄與趨勢；若無紀錄或僅單次紀錄須誠實說明，不可猜測。涉及指尖血糖時須參考近 30 天時段統計與情境備註；若資料不足／過時，須誠實告知不可過度推論。

【雙通道輸出分工（嚴禁重複）】
- briefVersion.takeHomeMessages：需要具體行動時提供 2-3 條量化、立即可執行的重點（含具體份量／數值／時機，並用 **關鍵詞** 加粗）；若屬純名詞概念科普，給 1-2 條核心概念摘要或 []，絕不寫空泛套話。
- detailedVersion.generalExplanation：用 2-3 句長者聽得明的大白話解釋原因與生活實戰貼士；禁用生澀醫學機轉術語，且嚴禁重複 briefVersion 內容。
- detailedVersion.suggestedDiscussionPoints：日常問答僅在確有醫患討論價值時給 1-2 條（否則 []）；用藥調整、化驗異常或重大決策給 2-3 條可直接唸給醫生聽的提問。`;

const LIFESTYLE_PERSONALIZATION_BLOCK = `
【個人化飲食與運動指引】
- 退化性關節炎：優先推薦椅子操、水中健體、平地慢步、太極等低衝擊運動，提醒避開深蹲、爬樓梯或陡坡行山。
- 經常外食（OUTSIDE_EATING）：優先提供香港茶餐廳、燒味店、兩餸飯、酒樓點心實戰技巧（少飯／半碗飯、走汁／汁另上、燒味去皮去肥、加灼菜走油、飲品走甜）。
- 檔案記有喜好食物（如榴槤、叉燒飯、奶茶、點心）：先同理喜好，再給具體份量或改良食法，並推薦低升糖日常替代品。`;

const EVERYDAY_FAST_BLOCK = `
【日常諮詢極速模式】
本條屬於日常衛教、飲食、運動或指標解讀（非重大治療抉擇）：
1. 直接將 activeNode 設為 5。
2. preferenceQuestions 必須為 []，detailedVersion.optionComparison 必須為 []（切勿生造方案對比）。
3. 保持簡明精準，快速完成回覆。`;

const KNOWLEDGE_COMPARISON_BLOCK = `
【主動對比查詢模式（Node 5 結構化對比輸出）】
用戶明確要求對比／比較不同藥物、工具或控糖做法（屬客觀知識整理，非個人重大方案抉擇）：
1. 直接將 activeNode 設為 5，preferenceQuestions 必須為 []。
2. reply 用 1-2 句親切廣東話作簡短總起（概括類別並提醒實際選藥由醫生按腎功能及體質決定）。
3. 【核心輸出】必須在 detailedVersion.optionComparison 輸出 3-5 個清晰、結構化的對比項目（每個項目填寫 option 類別名稱、pros 主要優勢與特點、cons 常見注意事項或限制；可用換行分隔重點），直接回應使用者的對比需求。
4. briefVersion.takeHomeMessages 只放 2-3 條最實用的「睇完對比後的行動／問診重點」，切勿重複整張對比表；detailedVersion.generalExplanation 只補 1-2 句實用補充或留空。`;

const IMAGE_MULTIMODAL_BLOCK = `
【📷 圖片多模態辨識指示】
結合上傳相片作視覺判讀：
1. 藥物／藥袋標籤：讀取中英文藥名、劑量、每日次數與飯前／飯後用法，在 reply 用廣東話清楚解讀，於 detailedVersion 補充日常服藥細節與漏服應對。
2. 餐食照片：辨識主要碳水化合物與隱形糖分，給出升糖影響與份量建議。
3. 血糖機／報告：核對數值並對照標準範圍。
4. briefVersion 提供 2-3 條最核心的圖片判讀結論與行動貼士。`;

const PDA_INSULIN_OPTIONS = `  * 「注射／胰島素／針劑抉擇」標準選項（提供 3-4 個）：
    1. label: "注射恐懼與疼痛" | valueCategory: "Administration/Pain" | description: "對針頭穿刺的恐懼、怕痛或自我注射困難"
    2. label: "低血糖風險" | valueCategory: "Safety" | description: "擔憂發生低血糖急性反應（頭暈、心悸、意識模糊）"
    3. label: "長期依賴性與心理障礙" | valueCategory: "Psychological Burden" | description: "擔憂一旦開始注射無法停藥、自責病情惡化或形成終身依賴"
    4. label: "生活作息與社交干擾" | valueCategory: "Convenience" | description: "外出就餐、社交聚會或旅行時攜帶與冷藏儲存的便利程度"
    5. label: "體重增加顧慮" | valueCategory: "Quality of Life" | description: "擔憂開始注射治療後可能引起的體重上升"`;

const PDA_CGM_OPTIONS = `  * 「CGM 連續血糖儀 vs 指尖採血篤手指」標準選項：
    1. label: "指尖採血負擔" | valueCategory: "Convenience" | description: "厭倦每日多次指尖採血的疼痛與操作繁瑣"
    2. label: "即時波形與夜間低血糖預警" | valueCategory: "Safety" | description: "需要即時動態血糖走勢、高低血糖警報以降低夜間低血糖焦慮"
    3. label: "感應器佩戴與外觀" | valueCategory: "Quality of Life" | description: "感應器長期貼附皮膚的舒適度、外觀顧慮或皮膚過敏"
    4. label: "耗材自費經濟負擔" | valueCategory: "Cost" | description: "感應器定期更換的自費成本與經濟可持續性"`;

const PDA_ORAL_MED_OPTIONS = `  * 「降糖藥物更換／加藥抉擇」標準選項：
    1. label: "臨床療效與器官保護" | valueCategory: "Effectiveness" | description: "強效降糖與心腎等重要靶器官的長遠保護獲益"
    2. label: "不良反應與耐受性" | valueCategory: "Safety" | description: "腸胃不適、水腫或其他藥物副作用耐受度"
    3. label: "給藥簡便性與依從性" | valueCategory: "Convenience" | description: "每日服藥次數與生活規律配合程度"
    4. label: "自費藥費負擔" | valueCategory: "Cost" | description: "長期用藥的醫療自費支出"`;

function buildDecisionSdmBlock(message: string, trimmedHistory: TrimmedHistoryResult, isPreferenceResponse: boolean): string {
    const recentContext = `${message} ${trimmedHistory.turns.slice(-2).map(t => t.content).join(' ')}`.toLowerCase();
    const isCgm = /(cgm|連續血糖|動態血糖|感應器|無痛血糖)/.test(recentContext);
    const isInsulin = /(打針|胰島素|insulin|控糖針|排糖針|轉針|換針|注射)/.test(recentContext);

    const pdaTable = isCgm && !isInsulin
        ? PDA_CGM_OPTIONS
        : isInsulin && !isCgm
            ? PDA_INSULIN_OPTIONS
            : `${PDA_INSULIN_OPTIONS}\n${PDA_CGM_OPTIONS}\n${PDA_ORAL_MED_OPTIONS}`;

    if (isPreferenceResponse) {
        return `
【共同決策 (SDM) — Node 4/5 偏好整合與方案利弊階段】
用戶已點選並提交個人偏好，請執行以下規則：
1. 將 activeNode 設為 5，preferenceQuestions 設為 []。
2. 結合用戶所選偏好、HbA1c 趨勢、近 30 天血糖統計與個人檔案，在 detailedVersion.optionComparison 輸出 2 個核心方案的客觀平衡優缺點對照（option、pros、cons），供長者與醫生商討。
3. 在 briefVersion.takeHomeMessages 給出 2-3 條針對其偏好的量化行動重點，在 detailedVersion.suggestedDiscussionPoints 提供 2-3 條覆診提問。`;
    }

    return `
【共同決策 (SDM) — Node 3 偏好探索與 Node 4/5 利弊對照規則】
1. 若用戶尚未表明個人偏好（近期歷史中無「我已選擇我的個人偏好」）：
   - 必須將 activeNode 設為 3，同理長者的擔憂，引導他點選偏好卡片，切勿替他做決定。
   - 必須返回 preferenceQuestions（含 questionText 與 options），label 必須嚴格使用以下 PDA 純中文標準詞彙（不加英文註釋）：
${pdaTable}
   - 【嚴禁提前給建議】：Node 3 階段必須將 briefVersion.takeHomeMessages 設為 []，detailedVersion.optionComparison 設為 []。
2. 若近期歷史中用戶已提交過個人偏好，則將 activeNode 設為 5，於 detailedVersion.optionComparison 提供 2 個核心選項的平衡 Pros/Cons 對照，並量身輸出 briefVersion 與覆診提問。`;
}

export interface BuildChatPromptsParams {
    profile: UserProfile;
    knowledgeText: string;
    hba1cRecords: HbA1cRecord[];
    glucoseRecords: GlucoseRecord[];
    message: string;
    trimmedHistory: TrimmedHistoryResult;
    safety: SafetyAssessment;
    hasImage: boolean;
    isDecisionSensitive: boolean;
    isComparisonRequest?: boolean;
    isPreferenceResponse: boolean;
    scenarios: ScenarioValue[];
}

export function buildChatPrompts(params: BuildChatPromptsParams): {
    systemInstruction: string;
    userPrompt: string;
} {
    const {
        profile,
        knowledgeText,
        hba1cRecords,
        glucoseRecords,
        message,
        trimmedHistory,
        safety,
        hasImage,
        isDecisionSensitive,
        isComparisonRequest = false,
        isPreferenceResponse,
        scenarios,
    } = params;

    const needsLifestyleBlock =
        scenarios.includes(Scenario.DIET_ADVICE) ||
        scenarios.includes(Scenario.GENERAL_FALLBACK) ||
        Boolean(profile?.favoriteFoods?.trim()) ||
        Boolean(profile?.dietHabits?.length) ||
        Boolean(profile?.conditions?.includes('OA'));

    const instructionParts: string[] = [CORE_CHAT_INSTRUCTION];
    if (needsLifestyleBlock) {
        instructionParts.push(LIFESTYLE_PERSONALIZATION_BLOCK);
    }
    if (hasImage) {
        instructionParts.push(IMAGE_MULTIMODAL_BLOCK);
    }
    if (isDecisionSensitive) {
        instructionParts.push(buildDecisionSdmBlock(message, trimmedHistory, isPreferenceResponse));
    } else if (isComparisonRequest) {
        instructionParts.push(KNOWLEDGE_COMPARISON_BLOCK);
    } else {
        instructionParts.push(EVERYDAY_FAST_BLOCK);
    }

    const safetyCautionNote = safety.triggered && !safety.blockLLM
        ? `\n【安全分級備註】：本條屬假設性／衛教提問（非當下發作），介面已自動附上安全速查卡。請將 activeNode 設為 5、safetyModeTriggered 設為 false，以溫暖廣東話完整科普緊急處理原則與日常預防方法。`
        : '';

    const taskReminder = isDecisionSensitive
        ? (isPreferenceResponse
            ? '請依據長者剛提交的個人偏好與臨床檔案，直接進入 Node 5 輸出量身建議與 2 個方案的 Pros/Cons 對照 JSON。'
            : '請按共同決策規則判斷：若未確認偏好則停駐 Node 3 返回標準 preferenceQuestions（且 briefVersion.takeHomeMessages 與 optionComparison 必須為 []）；若已有偏好則進入 Node 5 輸出利弊對照與建議 JSON。')
        : isComparisonRequest
            ? '用戶明確要求作對比整理，請直接以 Node 5 輸出 JSON：preferenceQuestions 設為 []，並務必在 detailedVersion.optionComparison 輸出 3-5 項清晰易明的客觀對比。'
            : '請依據上述檔案、數據與指引，直接以 Node 5 返回簡明親切的 JSON（preferenceQuestions 與 optionComparison 設為 []）。';

    const userPrompt = `【患者健康與生活檔案】
${formatUserProfileSummary(profile)}

【臨床實證指引】
${knowledgeText || "依據一般 ADA / 香港糖尿病管理實證原則"}

【糖化血色素（HbA1c）歷史與趨勢】
${formatHbA1cContext(hba1cRecords)}

【近 30 天指尖血糖統計、情境備註與資料充分性】
${formatGlucoseContext(glucoseRecords)}

【對話歷史（僅含最近有效對話）】
${formatHistoryContext(trimmedHistory)}

【最新用戶訊息】
"${message}"${hasImage ? "（附有相片，請結合相片內容解答）" : ""}${safetyCautionNote}

${taskReminder}`;

    return {
        systemInstruction: instructionParts.join('\n'),
        userPrompt,
    };
}

export async function getConversationalChatResponseServer(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    message: string,
    history: ChatTurn[] = [],
    imageAttachment?: { data: string; mimeType: string },
    hba1cRecords: HbA1cRecord[] = []
): Promise<any> {
    // Node 1: Deterministic Safety Gate runs BEFORE any LLM call
    const safety = checkSafetyGate(message, profile);
    if (safety.triggered && safety.blockLLM) {
        return {
            activeNode: 1,
            decisionType: 'Safety Escalation',
            confidence: 1,
            isLowConfidenceDefaulted: false,
            reply: safety.replyMessage || safety.message || "偵測到可能危及安全的情況，請立即優先尋求醫護或家人協助。",
            safety,
            briefVersion: { takeHomeMessages: [] },
            detailedVersion: {
                optionComparison: [],
                suggestedDiscussionPoints: [],
                generalExplanation: ""
            },
            optionsComparison: [],
            patientValuesSummary: "",
            doctorQuestions: [],
            suggestedFollowUps: [],
            traceability: {
                safetyModeTriggered: true,
                triggeredNodes: ['Node 1 🛡️ 安全監控（確定性規則攔截）'],
                currentStep: 'Node 1',
                sources: []
            }
        };
    }

    const scenarios = classifyScenario(message);
    const activeNodes = FULL_ROUTING_CONFIG.nodes.filter(n => scenarios.includes(n.scenario_group));
    const allSourceOrder = Array.from(new Set(activeNodes.flatMap(n => n.preferred_source_order || [])));
    const knowledgeText = allSourceOrder.slice(0, 3).map(sourceId => {
        const entry = CLINICAL_KNOWLEDGE[sourceId as keyof typeof CLINICAL_KNOWLEDGE];
        return entry ? `【${entry.title}】: ${entry.content}` : "";
    }).filter(t => t !== "").join('\n\n');

    const trimmedHistory = trimConversationHistory(history, MAX_HISTORY_ROUNDS);
    const isPreferenceResponse = message.includes("我已選擇我的個人偏好") || message.includes("重視：【");
    const hasImage = Boolean(imageAttachment && imageAttachment.data);
    const modelRoute = selectChatModelRoute({
        message,
        scenarios,
        isPreferenceResponse,
        hasImage,
        trimmedHistory: trimmedHistory.turns,
    });
    const isDecisionSensitive =
        modelRoute.reason === 'major_decision_support' ||
        modelRoute.reason === 'preference_decision_synthesis' ||
        modelRoute.reason === 'major_decision_followup' ||
        (hasImage && (
            scenarios.includes(Scenario.DECISION_SUPPORT_PREFERENCE) ||
            isPreferenceResponse ||
            MAJOR_DECISION_PATTERNS.some(kw => (message || '').toLowerCase().includes(kw))
        ));

    const isComparisonRequest = !isDecisionSensitive && isExplicitComparisonQuery(message);

    const { systemInstruction: chatInstruction, userPrompt: prompt } = buildChatPrompts({
        profile,
        knowledgeText,
        hba1cRecords,
        glucoseRecords,
        message,
        trimmedHistory,
        safety,
        hasImage,
        isDecisionSensitive,
        isComparisonRequest,
        isPreferenceResponse,
        scenarios,
    });

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

    const response = await generateContentWithRetry({
        model: modelRoute.model,
        contents: [
            {
                role: "user",
                parts: contentParts
            }
        ],
        config: {
            systemInstruction: chatInstruction,
            thinkingConfig: {
                thinkingLevel: modelRoute.thinkingLevel,
            },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    activeNode: { type: Type.INTEGER },
                    decisionType: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    isLowConfidenceDefaulted: { type: Type.BOOLEAN },
                    explorationQuestion: { type: Type.STRING },
                    preferenceQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                questionText: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            valueCategory: { type: Type.STRING },
                                            label: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ["valueCategory", "label", "description"]
                                    }
                                }
                            },
                            required: ["id", "questionText", "options"]
                        }
                    },
                    reply: { type: Type.STRING },
                    briefVersion: {
                        type: Type.OBJECT,
                        properties: {
                            takeHomeMessages: { type: Type.ARRAY, items: { type: Type.STRING } }
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
                                        option: { type: Type.STRING },
                                        pros: { type: Type.STRING },
                                        cons: { type: Type.STRING }
                                    },
                                    required: ["option", "pros", "cons"]
                                }
                            },
                            suggestedDiscussionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                            generalExplanation: { type: Type.STRING }
                        }
                    },
                    suggestedFollowUps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    traceability: {
                        type: Type.OBJECT,
                        properties: {
                            safetyModeTriggered: { type: Type.BOOLEAN },
                            triggeredNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            currentStep: { type: Type.STRING }
                        },
                        required: ["safetyModeTriggered", "triggeredNodes", "currentStep"]
                    }
                },
                required: ["activeNode", "decisionType", "confidence", "isLowConfidenceDefaulted", "reply", "suggestedFollowUps", "traceability"]
            }
        }
    });

    const parsed = JSON.parse(response.text || '{}');
    const isDeterministicCaution = Boolean(safety.triggered && !safety.blockLLM);
    const llmTriggeredSafety = !isDeterministicCaution && Boolean(parsed.activeNode === 1 || parsed.traceability?.safetyModeTriggered);
    const resolvedActiveNode = isDeterministicCaution && parsed.activeNode === 1 ? 5 : parsed.activeNode;
    const isStoppedAtSafetyOrPref = llmTriggeredSafety || resolvedActiveNode === 3;
    const matchedSources = isStoppedAtSafetyOrPref ? [] : allSourceOrder.slice(0, 3);
    const existingTraceability = parsed.traceability || {};

    let finalSafety: SafetyAssessment = safety;
    if (llmTriggeredSafety) {
        finalSafety = {
            isEmergency: true,
            triggered: true,
            blockLLM: true,
            severity: 'URGENT',
            category: 'high_risk_unwell',
            title: '安全提醒：請優先尋求醫護協助',
            message: '系統留意到您的情況可能需要即時醫護評估，請勿單靠 AI 回覆，安全第一。',
            actionSteps: [
                '先停下活動並通知身邊家人或照顧者留意您的身體狀況。',
                '如感到明顯不適或徵狀加重，請儘快前往門診／急症室求醫，或自行致電 999。'
            ],
            contacts: [
                { label: '香港緊急救護服務', number: '999', note: '如情況危急請立即請家人協助或自行致電' }
            ]
        };
    }

    const hardSafetyActive = Boolean(finalSafety.blockLLM || llmTriggeredSafety);

    return {
        ...parsed,
        activeNode: hardSafetyActive ? 1 : resolvedActiveNode,
        safety: finalSafety,
        traceability: {
            ...existingTraceability,
            safetyModeTriggered: hardSafetyActive,
            sources: Array.isArray(existingTraceability.sources) && existingTraceability.sources.length > 0
                ? existingTraceability.sources
                : matchedSources
        },
        briefVersion: hardSafetyActive ? { takeHomeMessages: [] } : parsed.briefVersion,
        detailedVersion: hardSafetyActive
            ? { optionComparison: [], suggestedDiscussionPoints: [], generalExplanation: "" }
            : parsed.detailedVersion,
        optionsComparison: hardSafetyActive ? [] : (parsed.detailedVersion?.optionComparison || parsed.optionsComparison || []),
        comparisonKind: isDecisionSensitive ? 'decision' : 'knowledge',
        patientValuesSummary: hardSafetyActive ? "" : (parsed.patientValuesSummary || ""),
        doctorQuestions: hardSafetyActive ? [] : (parsed.detailedVersion?.suggestedDiscussionPoints || parsed.doctorQuestions || []),
        suggestedFollowUps: hardSafetyActive ? [] : (parsed.suggestedFollowUps || [])
    };
}

export async function analyzeSavedQuestionsServer(questions: string[]): Promise<{
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

    const response = await generateContentWithRetry({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            systemInstruction: "你是一位香港糖尿病就診溝通助理。你的任務是總結長者保存的問題，歸納出 3-5 個經常保存的類別問題，並根據重點精準給出 3-5 個建議就診提問句子。文字精簡、親切廣東話口語，不囉嗦。",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    categories: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                categoryName: { type: Type.STRING },
                                description: { type: Type.STRING },
                                frequency: { type: Type.STRING }
                            },
                            required: ["categoryName", "description"]
                        }
                    },
                    recommendedQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                categoryTag: { type: Type.STRING }
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
}

export async function generateDailyTipFromHKWebsitesServer(): Promise<{
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

    const response = await generateContentWithRetry({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            systemInstruction: "你是一位精通香港長者健康衛教的糖尿病管理專家。你擅長用極其親切、充滿關懷的地道香港廣東話，為糖尿病長者提供易讀、易懂、實用的日常生活小建議。",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    icon: { type: Type.STRING },
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    tag: { type: Type.STRING },
                    source: { type: Type.STRING },
                    url: { type: Type.STRING }
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
}

export async function recognizeMedicationsFromImageServer(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<{
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

    const response = await generateContentWithRetry({
        model: TEXT_MODEL,
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
}
