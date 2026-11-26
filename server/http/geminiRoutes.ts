/**
 * /api/health and /api/gemini/* route registrations. Paths and JSON shapes must stay stable.
 */
import type { Express, Request, Response } from "express";
import {
    analyzeSavedQuestionsServer,
    generateDailyTipFromHKWebsitesServer,
    getConversationalChatResponseServer,
    recognizeMedicationsFromImageServer,
    transcribeAudioServer,
    getGeminiRuntimeInfo,
} from "../gemini.ts";
import { handleGeminiError } from "./geminiError.ts";

export function registerGeminiRoutes(app: Express) {
    app.get("/api/health", (_req: Request, res: Response) => {
        const info = getGeminiRuntimeInfo();
        res.json({
            ok: true,
            configured: info.configured,
            model: info.model,
            fastModel: info.fastModel,
            visionModel: info.visionModel,
            transcribeModel: info.transcribeModel,
            customBaseUrl: info.hasCustomBaseUrl,
        });
    });

    app.post("/api/gemini/transcribe-audio", async (req: Request, res: Response) => {
        try {
            const { base64Audio, mimeType } = req.body ?? {};
            if (!base64Audio) {
                res.status(400).json({ error: "Missing base64Audio" });
                return;
            }
            const text = await transcribeAudioServer(base64Audio, mimeType || "audio/webm");
            res.json({ text });
        } catch (error) {
            handleGeminiError(res, error, "transcribe");
        }
    });

    app.post("/api/gemini/chat", async (req: Request, res: Response) => {
        try {
            const {
                profile,
                glucoseRecords,
                hba1cRecords,
                message,
                history,
                imageAttachment,
                preferenceAlreadySubmitted
            } = req.body ?? {};
            const result = await getConversationalChatResponseServer(
                profile,
                glucoseRecords || [],
                message || "",
                history || [],
                imageAttachment,
                hba1cRecords || [],
                Boolean(preferenceAlreadySubmitted)
            );
            res.json(result);
        } catch (error) {
            handleGeminiError(res, error, "chat");
        }
    });

    app.post("/api/gemini/analyze-saved-questions", async (req: Request, res: Response) => {
        try {
            const { questions } = req.body ?? {};
            const result = await analyzeSavedQuestionsServer(questions || []);
            res.json(result);
        } catch (error) {
            handleGeminiError(res, error, "analyze-saved-questions");
        }
    });

    // 未接線於 UI：路由與後端實作已存在，客戶端 generateDailyTipFromHKWebsites 尚無畫面呼叫。請勿刪除。
    app.post("/api/gemini/daily-tip", async (_req: Request, res: Response) => {
        try {
            const result = await generateDailyTipFromHKWebsitesServer();
            res.json(result);
        } catch (error) {
            handleGeminiError(res, error, "daily-tip");
        }
    });

    app.post("/api/gemini/recognize-medications", async (req: Request, res: Response) => {
        try {
            const { imageBase64, mimeType } = req.body ?? {};
            if (!imageBase64) {
                res.status(400).json({ error: "Missing imageBase64" });
                return;
            }
            const result = await recognizeMedicationsFromImageServer(
                imageBase64,
                mimeType || "image/jpeg"
            );
            res.json(result);
        } catch (error) {
            handleGeminiError(res, error, "recognize-medications");
        }
    });

    app.use("/api", (_req: Request, res: Response) => {
        res.status(404).json({ error: "找不到對應的 API 端點。" });
    });
}
