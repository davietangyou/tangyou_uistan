/**
 * Mock ChatMessage trees seeded into dia_chat_messages to exercise
 * ConsultView rendering without calling Gemini.
 */
const welcome = {
    id: 'welcome',
    role: 'assistant',
    content: '關於糖尿病管理，\n您目前最關心什麼？',
    isWelcome: true,
};

function safetyContacts() {
    return [
        { label: '夾具急救熱線', number: '999', note: '緊急' },
        { label: '夾具情緒支援', number: '2382 0000', note: '24小時' },
    ];
}

export const SHAPE_CASES = [
    {
        id: 'safety-mental',
        expectPresent: ['【夾具】情緒支援標題', '【夾具】情緒支援說明', '夾具急救熱線', '999', '為避免誤觸撥號'],
        expectAbsent: ['【夾具】不應出現的追問-mental'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 's-mental',
                role: 'assistant',
                content: '【夾具】情緒支援回覆正文。',
                activeNode: 1,
                safety: {
                    isEmergency: false,
                    triggered: true,
                    blockLLM: false,
                    severity: 'CAUTION',
                    category: 'mental_health',
                    title: '【夾具】情緒支援標題',
                    message: '【夾具】情緒支援說明',
                    actionSteps: ['【夾具】情緒支援步驟一'],
                    contacts: safetyContacts(),
                },
                suggestedFollowUps: ['【夾具】不應出現的追問-mental'],
            },
        ],
    },
    {
        id: 'safety-emergency',
        expectPresent: ['【夾具】緊急安全警示', '【夾具】緊急說明', '夾具急救熱線', '為避免誤觸撥號'],
        expectAbsent: ['【夾具】不應出現的追問-emergency'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 's-emg',
                role: 'assistant',
                content: '【夾具】緊急回覆正文。',
                activeNode: 1,
                safety: {
                    isEmergency: true,
                    triggered: true,
                    blockLLM: true,
                    severity: 'EMERGENCY',
                    category: 'acute_hypoglycemia',
                    title: '【夾具】緊急安全警示',
                    message: '【夾具】緊急說明',
                    replyMessage: '【夾具】緊急回覆正文。',
                    actionSteps: ['【夾具】緊急步驟一'],
                    contacts: safetyContacts(),
                },
                suggestedFollowUps: ['【夾具】不應出現的追問-emergency'],
            },
        ],
    },
    {
        id: 'safety-urgent',
        expectPresent: ['【夾具】儘快求醫提醒', '【夾具】求醫說明', '為避免誤觸撥號'],
        expectAbsent: ['【夾具】不應出現的追問-urgent'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 's-urgent',
                role: 'assistant',
                content: '【夾具】儘快求醫回覆正文。',
                activeNode: 1,
                safety: {
                    isEmergency: false,
                    triggered: true,
                    blockLLM: false,
                    severity: 'URGENT',
                    category: 'dka_hhs',
                    title: '【夾具】儘快求醫提醒',
                    message: '【夾具】求醫說明',
                    actionSteps: ['【夾具】求醫步驟一'],
                    contacts: safetyContacts(),
                },
                suggestedFollowUps: ['【夾具】不應出現的追問-urgent'],
            },
        ],
    },
    {
        id: 'safety-caution',
        expectPresent: ['【夾具】安全處理速查', '【夾具】速查說明', '為避免誤觸撥號'],
        expectAbsent: ['【夾具】不應出現的追問-caution'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 's-caution',
                role: 'assistant',
                content: '【夾具】速查回覆正文。',
                activeNode: 1,
                safety: {
                    isEmergency: false,
                    triggered: true,
                    blockLLM: false,
                    severity: 'CAUTION',
                    category: 'foot_wound',
                    title: '【夾具】安全處理速查',
                    message: '【夾具】速查說明',
                    actionSteps: ['【夾具】速查步驟一'],
                    contacts: safetyContacts(),
                },
                suggestedFollowUps: ['【夾具】不應出現的追問-caution'],
            },
        ],
    },
    {
        id: 'preference',
        expectPresent: ['【夾具】偏好問題：打針時你最在意什麼？', '【夾具】怕痛', '其他個人考量'],
        expectAbsent: ['【夾具】不應出現的追問-pref'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 'pref-1',
                role: 'assistant',
                content: '【夾具】請先選擇你的偏好。',
                activeNode: 3,
                preferenceQuestions: [
                    {
                        id: 'pq-pain',
                        questionText: '【夾具】偏好問題：打針時你最在意什麼？',
                        options: [
                            { valueCategory: 'pain', label: '【夾具】怕痛', description: '【夾具】怕痛說明' },
                            { valueCategory: 'convenience', label: '【夾具】圖方便', description: '【夾具】方便說明' },
                        ],
                    },
                ],
                suggestedFollowUps: ['【夾具】不應出現的追問-pref'],
            },
        ],
    },
    {
        id: 'comparison-decision',
        expectPresent: [
            '治療方案利弊考量（供覆診與醫生商討）',
            '優勢效益 (Pros)',
            '顧慮隱憂 (Cons)',
            '【夾具】方案甲',
            '【夾具】方案甲優點一行',
            '重點速覽',
            '【夾具】重點速覽一',
            '【夾具】可見追問-decision',
        ],
        expectAbsent: [],
        hideFollowUps: false,
        messages: [
            welcome,
            {
                id: 'cmp-dec',
                role: 'assistant',
                content: '【夾具】決策對比主體回覆。',
                activeNode: 5,
                comparisonKind: 'decision',
                optionsComparison: [
                    {
                        option: '【夾具】方案甲',
                        pros: '- 【夾具】方案甲優點一行',
                        cons: '- 【夾具】方案甲顧慮一行',
                    },
                ],
                briefVersion: { takeHomeMessages: ['【夾具】重點速覽一'] },
                detailedVersion: {
                    generalExplanation: '【夾具】詳細說明正文',
                    suggestedDiscussionPoints: ['【夾具】就診提問一'],
                    optionComparison: [
                        {
                            option: '【夾具】方案甲',
                            pros: '- 【夾具】方案甲優點一行',
                            cons: '- 【夾具】方案甲顧慮一行',
                        },
                    ],
                },
                suggestedFollowUps: ['【夾具】可見追問-decision'],
            },
        ],
    },
    {
        id: 'comparison-knowledge',
        expectPresent: [
            '重點對比一覽',
            '主要優勢／特點',
            '注意事項／限制',
            '【夾具】知識選項甲',
            '【夾具】可見追問-knowledge',
        ],
        expectAbsent: ['治療方案利弊考量（供覆診與醫生商討）'],
        hideFollowUps: false,
        messages: [
            welcome,
            {
                id: 'cmp-know',
                role: 'assistant',
                content: '【夾具】知識對比主體回覆。',
                activeNode: 5,
                comparisonKind: 'knowledge',
                optionsComparison: [
                    {
                        option: '【夾具】知識選項甲',
                        pros: '- 【夾具】知識優點一行',
                        cons: '- 【夾具】知識限制一行',
                    },
                ],
                suggestedFollowUps: ['【夾具】可見追問-knowledge'],
            },
        ],
    },
    {
        id: 'followups-hidden-blockllm',
        expectPresent: ['【夾具】攔截回覆'],
        expectAbsent: ['【夾具】不應出現的追問-block'],
        hideFollowUps: true,
        messages: [
            welcome,
            {
                id: 'block-1',
                role: 'assistant',
                content: '【夾具】攔截回覆',
                activeNode: 5,
                safety: {
                    isEmergency: true,
                    triggered: true,
                    blockLLM: true,
                    severity: 'EMERGENCY',
                    category: 'acute_hypoglycemia',
                    title: '【夾具】攔截卡',
                    message: '【夾具】攔截說明',
                    contacts: safetyContacts(),
                },
                suggestedFollowUps: ['【夾具】不應出現的追問-block'],
            },
        ],
    },
];
