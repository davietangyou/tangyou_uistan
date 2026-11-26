import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getAiClient, getFastModel, getTextModel, getVisionModel } from "./env.ts";

const PRIMARY_COOLDOWN_MS = 60_000;
let primaryCooldownUntil = 0;

function isTransientGeminiError(error: unknown): boolean {
    const errObj = error as { status?: number; message?: string };
    const status = errObj?.status;
    const msg = (errObj?.message || "").toLowerCase();
    return (
        status === 503 ||
        status === 429 ||
        status === 500 ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("resource_exhausted") ||
        msg.includes("fetch failed") ||
        msg.includes("econnreset") ||
        msg.includes("etimedout")
    );
}

function isServiceUnavailableError(error: unknown): boolean {
    const errObj = error as { status?: number; message?: string };
    const status = errObj?.status;
    const msg = (errObj?.message || "").toLowerCase();
    return (
        status === 503 ||
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded")
    );
}

export async function generateContentWithRetry(
    params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
    options?: { allowFallback?: boolean }
) {
    const ai = getAiClient();
    const deepModel = getTextModel();
    const fastModel = getFastModel();
    const visionModel = getVisionModel();
    const requestedModel = params.model;
    const allowFallback = options?.allowFallback ?? true;

    const useFastFallbackOnly =
        requestedModel === deepModel && Date.now() < primaryCooldownUntil;

    let modelsToTry: string[];
    if (!allowFallback) {
        modelsToTry = [requestedModel];
    } else if (requestedModel === deepModel) {
        modelsToTry = useFastFallbackOnly ? [fastModel] : [deepModel, fastModel];
    } else if (requestedModel === fastModel) {
        modelsToTry = [fastModel, deepModel];
    } else if (requestedModel === visionModel && visionModel !== deepModel && visionModel !== fastModel) {
        modelsToTry = [visionModel, deepModel];
    } else if (requestedModel === visionModel) {
        modelsToTry = [requestedModel];
    } else {
        modelsToTry = [requestedModel];
    }
    modelsToTry = Array.from(new Set(modelsToTry));

    let lastError: unknown;
    for (let idx = 0; idx < modelsToTry.length; idx++) {
        const modelName = modelsToTry[idx];
        const isLastModel = idx === modelsToTry.length - 1;
        const maxAttempts = isLastModel ? 2 : 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                let nextConfig = params.config;
                if (modelName === deepModel) {
                    const requestedLevel = params.config?.thinkingConfig?.thinkingLevel;
                    const safeDeepLevel =
                        !requestedLevel || requestedLevel === ThinkingLevel.MINIMAL
                            ? ThinkingLevel.LOW
                            : requestedLevel;
                    nextConfig = {
                        ...params.config,
                        thinkingConfig: {
                            ...params.config?.thinkingConfig,
                            thinkingLevel: safeDeepLevel,
                        },
                    };
                } else if (modelName === fastModel) {
                    nextConfig = {
                        ...params.config,
                        thinkingConfig: params.config?.thinkingConfig ?? {
                            thinkingLevel: ThinkingLevel.MINIMAL,
                        },
                    };
                }

                return await ai.models.generateContent({
                    ...params,
                    model: modelName,
                    config: nextConfig,
                });
            } catch (error) {
                lastError = error;
                if (!isTransientGeminiError(error)) {
                    throw error;
                }
                if (modelName === deepModel && isServiceUnavailableError(error)) {
                    primaryCooldownUntil = Date.now() + PRIMARY_COOLDOWN_MS;
                }
                console.warn(
                    `[Gemini] Transient error on model=${modelName} (attempt ${attempt}/${maxAttempts}):`,
                    (error as { message?: string })?.message || error
                );
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 350));
                }
            }
        }
        if (!isLastModel) {
            console.warn(`[Gemini] Falling back from ${modelName} to ${modelsToTry[idx + 1]}.`);
        }
    }
    throw lastError;
}
