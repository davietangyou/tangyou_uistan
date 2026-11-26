/**
 * Texts that are sent to /api/gemini/chat, or that the server matches by
 * exact text. Moved here verbatim from ChatPanel.tsx and
 * useConsultViewModel.tsx (Stage 5, step 1) so the Consult restyle cannot
 * touch them by accident.
 *
 * Do not edit any string in this file as part of a UI change. Each one is
 * either a locked-copy contract (scripts/verify/lib/lockedCopy.mjs), part
 * of a captured request body (fixtures/golden/requests.normalized.json),
 * or matched by server/gemini/{history,chat,routing}.ts.
 */
import type {ChatMessage, PreferenceQuestion, PreferenceSelection} from '../../utils/types';

/**
 * Welcome bubble. The server drops an assistant turn equal to this content
 * (server/gemini/history.ts); the client drops it by `isWelcome`.
 * A fresh array and object on every call, as the inline literal was.
 */
export function createDefaultChatMessages(): ChatMessage[] {
    return [
        {
            id: 'welcome',
            role: 'assistant',
            content: "關於糖尿病管理，\n您目前最關心什麼？",
            isWelcome: true
        }
    ];
}

/** Shortcut chips: `text` is sent as the chat message; `label` is only shown. */
export const SHORTCUT_QUESTIONS: ReadonlyArray<{ readonly text: string; readonly label: string }> = [
    { text: '📊 我的血糖數據合格嗎？幫我分析指標與健康檔案的關係', label: '📊 數據解讀' },
    { text: '⚠️ 出現手震、心慌、冒冷汗等症狀，我該如何緊急處理？', label: '⚠️ 突發情況' },
    { text: '🥗 糖尿病患者一日三餐或外出用餐有什麼飲食控糖建議？', label: '🥗 飲食建議' },
    { text: '💊 二甲雙胍(Metformin)等控糖藥物會有什麼常見副作用？', label: '💊 用藥副作用' },
    { text: '👁️ 糖尿病會引致哪些常見併發症（如眼底或腎病變）？該如何預防？', label: '👁️ 常見併發症' }
];

/**
 * Marker the client and the server both look for to know a preference
 * answer was submitted (useConsultViewModel, ChatPanel, server history /
 * chat / routing).
 */
export const PREFERENCE_SUBMITTED_MARKER = "我已選擇我的個人偏好";

/** Message sent when a photo is attached with no typed text. */
export const IMAGE_ONLY_DEFAULT_MESSAGE = "請幫我分析這張藥物相片或處方標籤，說明藥物名稱、用法、注意事項及覆診問醫生的問題。";

/** Local error bubble. The client and server both drop it from history by this prefix. */
export const CHAT_ERROR_REPLY = "⚠️ 唔好意思，系統暫時未能完成回覆，請稍等幾秒再試一次。";
export const CHAT_ERROR_REPLY_PREFIX = '⚠️ 唔好意思，系統暫時未能完成回覆';

type MsgSelections = Record<string, Record<string, PreferenceSelection>>;
type MsgOthers = Record<string, boolean>;
type MsgTexts = Record<string, string>;

/**
 * Count of answers that would be submitted (standard options plus filled
 * "other" texts). Same rule the submit button used for `disabled`.
 */
export function countPreferenceAnswers(
    preferenceQuestions: PreferenceQuestion[],
    msgSelections: MsgSelections,
    msgOthers: MsgOthers,
    msgTexts: MsgTexts
): number {
    let validCount = 0;
    preferenceQuestions.forEach((pq: PreferenceQuestion) => {
        const pqSelections = msgSelections[pq.id] || {};
        const isOther = msgOthers[pq.id];
        const customTxt = (msgTexts[pq.id] || "").trim();
        validCount += Object.keys(pqSelections).length;
        if (isOther && customTxt.length > 0) {
            validCount++;
        }
    });
    return validCount;
}

/**
 * The preference-submit chat message, or null when nothing is selected
 * (the button then did nothing). Header, line templates, order, and the
 * "\n" join are unchanged from ChatPanel.tsx.
 */
export function buildPreferenceSubmitMessage(
    preferenceQuestions: PreferenceQuestion[],
    msgSelections: MsgSelections,
    msgOthers: MsgOthers,
    msgTexts: MsgTexts
): string | null {
    const parts = ["我已選擇我的個人偏好（決策考量維度）："];
    let submittedCount = 0;

    preferenceQuestions.forEach((pq: PreferenceQuestion) => {
        const pqSelections = msgSelections[pq.id] || {};
        const isOther = msgOthers[pq.id];
        const customTxt = (msgTexts[pq.id] || "").trim();

        // Add selected standard options
        Object.values(pqSelections).forEach((sel: PreferenceSelection) => {
            parts.push(`- 針對「${sel.questionText}」，我最看重：【${sel.label}】（價值維度：${sel.valueCategory}）`);
            submittedCount++;
        });

        // Add custom "other" option
        if (isOther && customTxt.length > 0) {
            parts.push(`- 針對「${pq.questionText}」，我有其他考量：【${customTxt}】（價值維度：其他）`);
            submittedCount++;
        }
    });

    if (submittedCount === 0) return null;

    return parts.join("\n");
}

/** Follow-up chips send the suggested question exactly as received. */
export function followUpMessage(question: string): string {
    return question;
}
