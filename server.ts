import "dotenv/config";
import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
    analyzeSavedQuestionsServer,
    generateDailyTipFromHKWebsitesServer,
    getConversationalChatResponseServer,
    recognizeMedicationsFromImageServer,
    transcribeAudioServer,
} from "./server/gemini.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));

app.use("/api", (_req: Request, res: Response, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

function handleGeminiError(res: Response, error: unknown, context: string) {
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

app.post("/api/gemini/transcribe", async (req: Request, res: Response) => {
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
        const { profile, glucoseRecords, hba1cRecords, message, history, imageAttachment } = req.body ?? {};
        const result = await getConversationalChatResponseServer(
            profile,
            glucoseRecords || [],
            message || "",
            history || [],
            imageAttachment,
            hba1cRecords || []
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

async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(__dirname, "dist");
        app.use(express.static(distPath));
        app.use((_req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
