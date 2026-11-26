import type { Response } from "express";

export function handleGeminiError(res: Response, error: unknown, context: string) {
    console.error(`[${context}] Gemini API error:`, error);
    const errObj = error as { status?: number; message?: string };
    let status =
        typeof errObj?.status === "number" && errObj.status >= 400 && errObj.status < 600
            ? errObj.status
            : 500;
    const rawMsg = errObj?.message || "";
    let friendlyMessage = rawMsg || "AI 服務暫時無法處理請求，請稍後再試。";

    if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE") || rawMsg.toLowerCase().includes("high demand")) {
        status = 503;
        friendlyMessage = "AI 模型目前使用人數較多，出現短暫擠塞，請稍等幾秒再試一次。";
    } else if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
        status = 429;
        friendlyMessage = "請求次數較頻密，請稍候片刻再試一次。";
    } else if (rawMsg.includes("PERMISSION_DENIED") || rawMsg.includes("API_KEY_INVALID")) {
        friendlyMessage = "AI 服務金鑰驗證未通過，請檢查設定。";
    } else if (rawMsg.startsWith("{")) {
        try {
            const parsed = JSON.parse(rawMsg);
            if (parsed?.error?.code && typeof parsed.error.code === "number") {
                status = parsed.error.code;
            }
            if (parsed?.error?.message) {
                friendlyMessage = parsed.error.message;
            }
        } catch {
            // keep rawMsg
        }
    }

    res.status(status).json({ error: friendlyMessage });
}
