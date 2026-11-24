import fs from 'fs';
import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
    analyzeSavedQuestionsServer,
    generateDailyTipFromHKWebsitesServer,
    getConversationalChatResponseServer,
    recognizeMedicationsFromImageServer,
    transcribeAudioServer,
    getGeminiRuntimeInfo,
} from "./server/gemini.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load local env files without overwriting already-present process.env values
 * (so AI Studio Secrets and CLI env vars always take highest precedence).
 */
function loadLocalEnvFiles() {
    const candidates = ['.env.server.local', '.env.local', '.env'];
    for (const filename of candidates) {
        const filePath = path.resolve(__dirname, filename);
        if (!fs.existsSync(filePath)) continue;
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            for (const rawLine of content.split(/\r?\n/)) {
                const trimmed = rawLine.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const line = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
                const eqIdx = line.indexOf('=');
                if (eqIdx <= 0) continue;
                const key = line.slice(0, eqIdx).trim();
                if (!key || (process.env[key] !== undefined && process.env[key] !== '')) continue;

                let val = line.slice(eqIdx + 1).trim();
                if (
                    (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
                    (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
                ) {
                    val = val.slice(1, -1);
                } else {
                    const hashIdx = val.indexOf(' #');
                    if (hashIdx >= 0) {
                        val = val.slice(0, hashIdx).trim();
                    }
                }
                process.env[key] = val;
            }
        } catch (err) {
            console.warn(`[env] Could not read ${filename}:`, err);
        }
    }
}

loadLocalEnvFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

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
        const distDir = path.resolve(__dirname, "dist");
        app.use(express.static(distDir));
        app.use((req, res, next) => {
            if (req.method === "GET" && !req.path.startsWith("/api/")) {
                res.sendFile(path.join(distDir, "index.html"));
                return;
            }
            next();
        });
    }

    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});