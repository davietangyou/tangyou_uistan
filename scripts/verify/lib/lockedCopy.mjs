/**
 * Locked-tier copy and the source locations it must be extracted from.
 * Changing any of these strings is a product decision, not a restyle.
 *
 * Stage 5 moved the AI-bound texts (welcome, shortcuts, preference submit)
 * verbatim into views/ConsultView/consultText.ts. Patterns are unchanged;
 * only `file` points at the new module.
 */
export const LOCKED_COPY_SOURCES = [
    {
        id: 'welcome_message',
        file: 'views/ConsultView/consultText.ts',
        pattern: /content:\s*"關於糖尿病管理，\\n您目前最關心什麼？"/,
        value: '關於糖尿病管理，\n您目前最關心什麼？',
    },
    {
        id: 'shortcut_data',
        file: 'views/ConsultView/consultText.ts',
        pattern: /text: '📊 我的血糖數據合格嗎？幫我分析指標與健康檔案的關係'/,
        value: '📊 我的血糖數據合格嗎？幫我分析指標與健康檔案的關係',
    },
    {
        id: 'shortcut_emergency',
        file: 'views/ConsultView/consultText.ts',
        pattern: /text: '⚠️ 出現手震、心慌、冒冷汗等症狀，我該如何緊急處理？'/,
        value: '⚠️ 出現手震、心慌、冒冷汗等症狀，我該如何緊急處理？',
    },
    {
        id: 'shortcut_diet',
        file: 'views/ConsultView/consultText.ts',
        pattern: /text: '🥗 糖尿病患者一日三餐或外出用餐有什麼飲食控糖建議？'/,
        value: '🥗 糖尿病患者一日三餐或外出用餐有什麼飲食控糖建議？',
    },
    {
        id: 'shortcut_meds',
        file: 'views/ConsultView/consultText.ts',
        pattern: /text: '💊 二甲雙胍\(Metformin\)等控糖藥物會有什麼常見副作用？'/,
        value: '💊 二甲雙胍(Metformin)等控糖藥物會有什麼常見副作用？',
    },
    {
        id: 'shortcut_complications',
        file: 'views/ConsultView/consultText.ts',
        pattern: /text: '👁️ 糖尿病會引致哪些常見併發症（如眼底或腎病變）？該如何預防？'/,
        value: '👁️ 糖尿病會引致哪些常見併發症（如眼底或腎病變）？該如何預防？',
    },
    {
        id: 'preference_submit_header',
        file: 'views/ConsultView/consultText.ts',
        pattern: /"我已選擇我的個人偏好（決策考量維度）："/,
        value: '我已選擇我的個人偏好（決策考量維度）：',
    },
    {
        id: 'preference_submit_option_template',
        file: 'views/ConsultView/consultText.ts',
        pattern: /我最看重：【\$\{sel\.label\}】（價值維度：\$\{sel\.valueCategory\}）/,
        value: '- 針對「${sel.questionText}」，我最看重：【${sel.label}】（價值維度：${sel.valueCategory}）',
    },
    {
        id: 'preference_submit_other_template',
        file: 'views/ConsultView/consultText.ts',
        pattern: /我有其他考量：【\$\{customTxt\}】（價值維度：其他）/,
        value: '- 針對「${pq.questionText}」，我有其他考量：【${customTxt}】（價值維度：其他）',
    },
    {
        id: 'disclaimer_global',
        file: 'components/Layout.tsx',
        pattern: /AI 輔助衛教工具 · 數據加密守護 · 非醫療診斷/,
        value: 'AI 輔助衛教工具 · 數據加密守護 · 非醫療診斷',
    },
    {
        id: 'disclaimer_consult',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準。所有對話僅供共同決策 \(SDM\) 及覆診前備忘，不作直接個體化臨床診斷。/,
        value: '專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準。所有對話僅供共同決策 (SDM) 及覆診前備忘，不作直接個體化臨床診斷。',
    },
    {
        id: 'safety_no_misdial',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /為避免誤觸撥號，以上號碼僅作清晰展示；如情況危急，請立即請身邊家人協助或自行使用電話致電。/,
        value: 'ℹ️ 為避免誤觸撥號，以上號碼僅作清晰展示；如情況危急，請立即請身邊家人協助或自行使用電話致電。',
    },
    {
        id: 'focus_toast',
        file: 'components/FocusToast.tsx',
        pattern: /請先點擊一下您想要輸入的空格/,
        value: '請先點擊一下您想要輸入的空格',
    },
    {
        id: 'comparison_decision_title',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /治療方案利弊考量（供覆診與醫生商討）/,
        value: '治療方案利弊考量（供覆診與醫生商討）',
    },
    {
        id: 'comparison_knowledge_title',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /重點對比一覽/,
        value: '重點對比一覽',
    },
    {
        id: 'comparison_decision_pros',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /優勢效益 \(Pros\)/,
        value: '👍 優勢效益 (Pros)',
    },
    {
        id: 'comparison_decision_cons',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /顧慮隱憂 \(Cons\)/,
        value: '⚠️ 顧慮隱憂 (Cons)',
    },
    {
        id: 'comparison_knowledge_pros',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /主要優勢／特點/,
        value: '👍 主要優勢／特點',
    },
    {
        id: 'comparison_knowledge_cons',
        file: 'views/ConsultView/ChatPanel.tsx',
        pattern: /注意事項／限制/,
        value: '⚠️ 注意事項／限制',
    },
    {
        id: 'greeting_fallback_name',
        file: 'domain/greeting.ts',
        pattern: /name \|\| "老友記"/,
        value: '老友記',
    },
    {
        id: 'greeting_morning',
        file: 'domain/greeting.ts',
        pattern: /timeGreeting = "早安"/,
        value: '早安',
    },
    {
        id: 'greeting_afternoon',
        file: 'domain/greeting.ts',
        pattern: /timeGreeting = "午安"/,
        value: '午安',
    },
    {
        id: 'greeting_evening',
        file: 'domain/greeting.ts',
        pattern: /timeGreeting = "晚安"/,
        value: '晚安',
    },
    {
        id: 'greeting_template',
        file: 'domain/greeting.ts',
        pattern: /return `\$\{userName\}，\$\{timeOfDayGreeting\(hour\)\}`/,
        value: '${userName}，${timeOfDayGreeting(hour)}',
    },
];

export const SHORTCUT_TEXTS = LOCKED_COPY_SOURCES.filter((s) => s.id.startsWith('shortcut_')).map((s) => s.value);

export function classifyVisibleLine(line, lockedValues) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const onlyEmojiOrPunct = /^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\p{P}\p{S}]+$/u.test(trimmed);
    if (onlyEmojiOrPunct) return 'decorative';
    for (const value of lockedValues) {
        if (!value) continue;
        if (trimmed === value || value.includes(trimmed) || trimmed.includes(value.replace(/\n/g, ''))) {
            return 'locked';
        }
    }
    return 'polishable';
}
