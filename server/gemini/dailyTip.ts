/**
 * 每日小貼士生成。HTTP 路由 /api/gemini/daily-tip 已接上本函數，
 * 但前端目前沒有調用 generateDailyTipFromHKWebsites()。請勿刪除。
 */
import { Type } from "@google/genai";
import { getTextModel } from "./env.ts";
import { generateContentWithRetry } from "./errors.ts";

export async function generateDailyTipFromHKWebsitesServer(): Promise<{
    icon: string;
    title: string;
    desc: string;
    tag: string;
    source: string;
    url?: string;
}> {
    const prompt = `請生成一個適合香港糖尿病長者的溫馨日常控糖貼士（Daily Diabetes Control Tip）。
    
貼士要求：
1. 語氣溫馨、體貼，使用地道親切的香港廣東話（口語）。
2. 主題可以圍繞以下其中之一：飲食管理（如飲茶技巧、少鹽低糖、水果分量）、日常運動（如飯後散步、在家拉筋）、血糖檢測、足部護理、防低血糖、就醫溝通等。
3. 提供 1 個合適的 emoji 作為 icon。
4. 提供一個具有吸引力的短標題 (title)。
5. 提供具體、實用的行動建議描述 (desc)。
6. tag 必須是以下之一：「膳食指南」、「日常運動」、「自我監測」、「足部護理」、「用藥注意」或「情緒舒緩」。
7. source 必須是權威機構，如：「香港衞生署長者健康服務」、「香港糖尿病聯會」或「香港醫院管理局」。
8. url 請提供與該主題或機構相關的香港官方權威網站連結（如 https://www.elderly.gov.hk 或 https://www.ha.org.hk）。

請嚴格以符合 Schema 的 JSON 格式返回。`;

    const response = await generateContentWithRetry({
        model: getTextModel(),
        contents: prompt,
        config: {
            systemInstruction: "你是一位精通香港長者健康衛教的糖尿病管理專家。你擅長用極其親切、充滿關懷的地道香港廣東話，為糖尿病長者提供易讀、易懂、實用的日常生活小建議。",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    icon: { type: Type.STRING },
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    tag: { type: Type.STRING },
                    source: { type: Type.STRING },
                    url: { type: Type.STRING }
                },
                required: ["icon", "title", "desc", "tag", "source", "url"]
            }
        }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
        icon: parsed.icon || "💡",
        title: parsed.title || "均衡飲食控血糖",
        desc: parsed.desc || "老友記，記住每餐食飯都要定時定量，多選擇高纖維食物，出街食飯少甜少鹽，對控制血糖好有幫助呀！",
        tag: parsed.tag || "膳食指南",
        source: parsed.source || "香港衞生署長者健康服務",
        url: parsed.url || "https://www.elderly.gov.hk"
    };
}

