import { Type } from "@google/genai";
import { getVisionModel } from "./env.ts";
import { generateContentWithRetry } from "./errors.ts";

export async function recognizeMedicationsFromImageServer(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<{
    medications: { name: string; dosage?: string; usage?: string }[];
    rawNotes?: string;
}> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const prompt = `請辨識並提取這張相片中（如香港公立醫院/私家診所藥袋、藥盒標籤、處方單等）的所有藥物資訊。

提取要求：
1. 提取每種藥物的名稱 (name)：中英文名稱均可，優先使用標籤上的常用藥名（如 Metformin / 雙胍、Gliclazide、Dapagliflozin / 達格列淨、Empagliflozin、Semaglutide 等）。
2. 提取劑量 (dosage)：例如 500mg, 850mg, 10mg, 30units 等。若無則留空。
3. 提取服用方法/用法 (usage)：例如「每日早晚各一次，隨餐服」、「每日一次，早餐前」等。若無則留空。
4. 整理出一個簡要備註 (rawNotes)，指出辨識出的整體摘要與溫馨提醒。

請嚴格按照 JSON Schema 格式回傳。`;

    const response = await generateContentWithRetry({
        model: getVisionModel(),
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType || "image/jpeg",
                            data: cleanBase64
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        ],
        config: {
            systemInstruction: "你是一位專業的臨床藥劑師助理。你擅長辨識香港及華人地區醫院和診所的藥袋標籤、藥丸包裝及藥物處方，準確提取藥名、劑量與服用指引。",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    medications: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                dosage: { type: Type.STRING },
                                usage: { type: Type.STRING }
                            },
                            required: ["name"]
                        }
                    },
                    rawNotes: { type: Type.STRING }
                },
                required: ["medications"]
            }
        }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        rawNotes: parsed.rawNotes || ''
    };
}
