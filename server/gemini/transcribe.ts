import { generateContentWithRetry } from "./errors.ts";
import { getTranscribeModel } from "./env.ts";

export async function transcribeAudioServer(base64Audio: string, mimeType: string): Promise<string> {
    const prompt = "你是一個語音輸入法助手。請將這段錄音準確地轉換為繁體中文（廣東話）。請只返回聽寫出的文字內容，不要包含任何額外的解釋、旁白或標點。";
    const response = await generateContentWithRetry({
        model: getTranscribeModel(),
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType || "audio/webm",
                        data: base64Audio
                    }
                },
                { text: prompt }
            ]
        }
    }, { allowFallback: false });

    return response.text?.trim() || '';
}

