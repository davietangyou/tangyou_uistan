export enum View {
    Onboarding = 'ONBOARDING',
    Home = 'HOME',
    Glucose = 'GLUCOSE',
    Consult = 'CONSULT',
    Me = 'ME',
    Result = 'RESULT', // 未接線：無任何 setView(View.Result) 或對應頁面分支，請勿刪除
    Detail = 'DETAIL', // 無頁面：DetailView 已於階段十一刪除；枚舉值屬邏輯合同，請勿刪除
    SavedQuestions = 'SAVED_QUESTIONS'
}

// 新增：統一管理問診流程的步驟狀態，確保 Hook 與 View 的狀態一致性
// 變更：增加了 SUPPLEMENT (補充分享) 和 SELECT_QUESTIONS (選擇問題) 步驟
export type ConsultStep = 'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT';

export type DiabetesType = 'TYPE_1' | 'TYPE_2' | 'GESTATIONAL' | 'PRE_DIABETES' | 'UNKNOWN' | 'OTHER';

export interface UserProfile {
    name?: string;
    avatar?: string;
    age: string;
    gender: string;
    bmi?: string;
    height?: string;
    weight?: string;
    weightUnit?: 'kg' | 'lb';
    lifestyle: string;
    diabetesType: DiabetesType; // 從 string 改為 enum 類型
    otherDiabetesType?: string;
    yearsWithDiabetes: string;
    hypertensionYears: string;
    livingSituation: string;
    medications: string;
    medicationDetails?: Array<{
        name: string;
        dosage: string;
        usage: string;
    }>;
    otherConditions: string;
    conditions: string[];
    conditionDetails?: Record<string, { years?: string; specificName?: string }>;
    // === 新增：生活與治療背景問答 ===
    hypoExperience?: string;
    glucoseMonitoring?: string;
    dietHabits?: string[];
    dietHabitsOther?: string;
    favoriteFoods?: string; // 平時喜歡的食物 (自定義輸入)
    exerciseWeekly?: string; // 'NONE' | 'UNDER_150' | 'MET_150'
    exerciseDaysPerWeek?: string; // '0' | '1-2' | '3-4' | '5+'
    exerciseMinutesPerSession?: string; // '15' | '30' | '45' | '60+'
    exerciseIntensity?: 'LIGHT' | 'MODERATE' | 'VIGOROUS'; // 'LIGHT': 輕鬆無出汗, 'MODERATE': 呼吸稍急/微出汗(能說話不能唱歌), 'VIGOROUS': 劇烈氣喘
    exerciseTypes?: string[]; // e.g. ['WALK', 'TAICHI', 'SWIM', 'STRETCH', 'CYCLE']
    exerciseTypesOther?: string; // 其他自定義運動項目
    sleepQuality?: string;
    stressMood?: string;
    clinicType?: 'GOPC' | 'SOPC' | 'DHC' | 'PRIVATE' | 'NONE' | 'OTHER';
    clinicTypes?: string[]; // 支援定期就診機構多選 (如 GOPC + SOPC + DHC)
    clinicTypeOther?: string;
    // === 新增：風險與偏好標誌 (對應流程圖 Phase A) ===
    isInsulinUser: boolean; // 改為 non-optional
    hasCaregiverSupport: boolean; // 改為 non-optional
    hasNoCaregiverSupport?: boolean;
    hasHypoHistory?: boolean;
    isFrail?: boolean;           // 衰弱/高齡
    hasHypoUnawareness?: boolean; // 無感低血糖
    healthLiteracy?: 'HIGH' | 'MEDIUM' | 'LOW';
    // 新增：自動寫回與記錄欄位
    expressedConcerns?: string[];
    preferenceSignals?: string[];
    educationTopicsViewed?: string[];
    recentQuestionThemes?: string[];
    literacyLevel?: string;
    savedDoctorQuestions?: string[];
    // === 新增：下次問診清單與問診日期提醒 ===
    nextClinicDate?: string; // e.g. "2026-08-30" or "2026-08-30 09:30"
    nextClinicQuestions?: string[]; // 下次問診清單問題
    nextClinicTime?: string; // 下次覆診時間 "HH:MM"（24 小時制，選填；舊資料無此欄位）
    nextClinicLocation?: string; // 下次覆診地點（自由文字，選填；舊資料無此欄位）
    // === 新增：待核實的推論與風險 (對應 Selective Memory) ===
    inferredNotes?: string[]; // AI 推論但不應直接進入 Context Injector 的內容
    riskSignals?: string[];   // AI 偵測到的潛在心理或社會風險
}

export interface HbA1cRecord {
    id: string;
    value: string; // e.g. "6.5"
    date: string;  // e.g. "2024-04-23"
    timestamp: number;
}

export interface MedicationReminder {
    id: string;
    name: string;
    time: string;
}

export interface GlucoseRecord {
    id: string;
    timeType: '空腹' | '餐前' | '餐後2小時' | '睡前' | '日常其他時間';
    value: string; // empty string if only recording symptoms
    date: string; // Display string
    timestamp: number; // For sorting and charting
    symptoms?: string[]; // list of symptoms
    mealTag?: '早餐' | '午餐' | '晚餐' | '其他'; // 配對測試用
    dietNote?: string;    // 飲食內容 (吃了什麼)
    exerciseNote?: string; // 運動內容 (做了什麼運動)
    illnessNote?: string;  // 生病/身體狀況 (症狀/備註)
    medicationNote?: string; // 用藥情況
    bpSystolic?: string;   // 收縮壓
    bpDiastolic?: string;  // 舒張壓
    pulse?: string;        // 脈搏
    weight?: string;       // 體重
    mood?: string;         // 心情
}

export interface ClarificationQuestion {
    id: string;
    question: string;
    options?: string[];
    isPreference?: boolean;
}

export interface DecisionResult {
    oneSentenceSummary: string; // 一句話重點
    summary: string;           // 核心分析 (解釋原因與建議)
    whatToDoNow: string;       // 新增：我而家可以點做 (建議行動)
    patientValuesSummary?: string;
    optionsComparison: {
        option: string;
        pros: string;
        cons: string;
    }[];
    doctorQuestions: string[];
    briefVersion?: {
        takeHomeMessages: string[];
    };
    detailedVersion?: {
        optionComparison?: {
            option: string;
            pros: string;
            cons: string;
        }[];
        suggestedDiscussionPoints?: string[];
        generalExplanation?: string;
    };
    traceability?: {
        scenario: string;
        topic_focus?: string; // 新增：細分主題
        subtopic?: string;    // 新增：次級主題
        sources: string[];
        safetyModeTriggered: boolean;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        isFallback: boolean;
    };
    deeperResponses?: { // 新增：用於存儲「想學多啲」產生的內容
        topic: string;
        content: string;
        options?: string[];
    }[];
    outputDecision: { // 新增：輸出判斷層
        showOptionsComparison: boolean;
        showDoctorQuestions: boolean;
        showPatientValues: boolean;
    };
    extractedProfileData?: {
        statedConcern?: string;
        caregiverMentioned?: boolean;
        preference?: string;
        educationTopic?: string;
        scenarioTheme?: string;
        inferredNote?: string;  // AI 推理出的備註 (如：懷疑憂鬱、居家支持可能不足)
        riskSignal?: string;    // AI 偵測到的風險信號
    };
}

export interface AudioLog {
    id: string;
    timestamp: number;
    blob: Blob;
    transcript: string;
}

export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

/** One option on a consult preference (value-clarification) card. */
export interface PreferenceOption {
    valueCategory: string;
    label: string;
    description: string;
}

export interface PreferenceQuestion {
    id: string;
    questionText: string;
    options: PreferenceOption[];
}

export interface PreferenceSelection {
    questionText: string;
    label: string;
    valueCategory: string;
    rating?: number;
}

export interface ChatSafetyContact {
    label: string;
    number: string;
    note?: string;
}

/** Client copy of the safety-gate assessment carried on a consult reply. */
export interface ChatSafety {
    isEmergency: boolean;
    triggered: boolean;
    blockLLM: boolean;
    severity: 'NONE' | 'CAUTION' | 'URGENT' | 'EMERGENCY';
    category?: 'acute_hypoglycemia' | 'dka_hhs' | 'foot_wound' | 'mental_health' | 'high_risk_unwell';
    title?: string;
    message?: string;
    replyMessage?: string;
    actionSteps?: string[];
    contacts?: ChatSafetyContact[];
    matchedSignal?: string;
}

export interface ChatOptionComparison {
    option: string;
    pros: string;
    cons: string;
}

export interface ChatImageAttachment {
    base64: string;
    mimeType: string;
    previewUrl?: string;
    name?: string;
}

/**
 * Consult chat bubble persisted in dia_chat_messages.
 * Distinct from ChatTurn, which is the {role, content} history sent to /api/gemini/chat.
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isWelcome?: boolean;
    isError?: boolean;
    imageAttachment?: ChatImageAttachment;
    optionsComparison?: ChatOptionComparison[];
    comparisonKind?: 'decision' | 'knowledge' | string;
    patientValuesSummary?: string;
    doctorQuestions?: string[];
    suggestedFollowUps?: string[];
    traceability?: {
        scenario?: string;
        topic_focus?: string;
        subtopic?: string;
        sources?: string[];
        safetyModeTriggered?: boolean;
        confidence?: string;
        isFallback?: boolean;
        triggeredNodes?: string[];
        currentStep?: string;
    };
    activeNode?: number;
    safety?: ChatSafety;
    preferenceQuestions?: PreferenceQuestion[];
    briefVersion?: { takeHomeMessages?: string[] };
    detailedVersion?: {
        optionComparison?: ChatOptionComparison[];
        suggestedDiscussionPoints?: string[];
        generalExplanation?: string;
    };
}

/** JSON body returned by POST /api/gemini/chat. */
export interface ChatApiResponse {
    reply: string;
    activeNode?: number;
    safety?: ChatSafety;
    traceability?: ChatMessage['traceability'];
    briefVersion?: ChatMessage['briefVersion'];
    detailedVersion?: ChatMessage['detailedVersion'];
    optionsComparison?: ChatOptionComparison[];
    comparisonKind?: 'decision' | 'knowledge' | string;
    patientValuesSummary?: string;
    doctorQuestions?: string[];
    suggestedFollowUps?: string[];
    preferenceQuestions?: PreferenceQuestion[];
    decisionType?: string;
    confidence?: number;
    isLowConfidenceDefaulted?: boolean;
    explorationQuestion?: string;
}
