/**
 * Public entry for server-side Gemini helpers.
 * Implementation lives in ./gemini/*.ts; this barrel re-exports the previous
 * public API so existing imports of ./server/gemini.ts stay unchanged.
 */
export { getGeminiRuntimeInfo } from "./gemini/env.ts";
export {
    isExplicitComparisonQuery,
    selectChatModelRoute,
    type ChatModelRoute,
} from "./gemini/routing.ts";
export {
    MAX_HISTORY_ROUNDS,
    trimConversationHistory,
    formatHistoryContext,
    type TrimmedHistoryResult,
} from "./gemini/history.ts";
export { formatUserProfileSummary } from "./gemini/profileContext.ts";
export { formatGlucoseContext } from "./gemini/glucoseContext.ts";
export { formatHbA1cContext } from "./gemini/hba1cContext.ts";
export { transcribeAudioServer } from "./gemini/transcribe.ts";
export { buildChatPrompts, type BuildChatPromptsParams } from "./gemini/prompts.ts";
export { getConversationalChatResponseServer } from "./gemini/chat.ts";
export { analyzeSavedQuestionsServer } from "./gemini/savedQuestions.ts";
export { generateDailyTipFromHKWebsitesServer } from "./gemini/dailyTip.ts";
export { recognizeMedicationsFromImageServer } from "./gemini/recognizeMeds.ts";
