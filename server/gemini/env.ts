import { GoogleGenAI } from "@google/genai";

function cleanEnvValue(raw?: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    const commentIdx = trimmed.indexOf(" #");
    return (commentIdx >= 0 ? trimmed.slice(0, commentIdx) : trimmed).trim();
}

export function getTextModel(): string {
    return cleanEnvValue(process.env.GEMINI_MODEL) || "gemini-4-hydrogen";
}

export function getFastModel(): string {
    return cleanEnvValue(process.env.GEMINI_FAST_MODEL) || "gemini-3.1-flash-lite";
}

export function getVisionModel(): string {
    return cleanEnvValue(process.env.GEMINI_VISION_MODEL) || getTextModel();
}

export function getTranscribeModel(): string {
    return cleanEnvValue(process.env.GEMINI_TRANSCRIBE_MODEL) || "gemini-3.5-transcribe";
}

function getBaseUrl(): string {
    return cleanEnvValue(process.env.GEMINI_BASE_URL);
}

export function getGeminiRuntimeInfo() {
    return {
        configured: Boolean(cleanEnvValue(process.env.GEMINI_API_KEY)),
        model: getTextModel(),
        fastModel: getFastModel(),
        visionModel: getVisionModel(),
        transcribeModel: getTranscribeModel(),
        hasCustomBaseUrl: Boolean(getBaseUrl()),
    };
}

let cachedAi: GoogleGenAI | null = null;
let cachedConfigKey: string | undefined;

export function getAiClient(): GoogleGenAI {
    const apiKey = cleanEnvValue(process.env.GEMINI_API_KEY);
    if (!apiKey) {
        throw new Error("伺服器未配置 GEMINI_API_KEY，請檢查環境變數設定。");
    }
    const baseUrl = getBaseUrl();
    const configKey = `${apiKey}|${baseUrl}`;
    if (!cachedAi || cachedConfigKey !== configKey) {
        cachedAi = new GoogleGenAI({
            apiKey,
            httpOptions: {
                ...(baseUrl ? { baseUrl } : {}),
                headers: {
                    "User-Agent": "aistudio-build",
                },
            },
        });
        cachedConfigKey = configKey;
    }
    return cachedAi;
}
