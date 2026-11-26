import { Type } from "@google/genai";
import { getTextModel } from "./env.ts";
import { generateContentWithRetry } from "./errors.ts";

export async function analyzeSavedQuestionsServer(questions: string[]): Promise<{
    summary: string;
    categories?: {
        categoryName: string;
        description: string;
        frequency: string;
    }[];
    recommendedQuestions: {
        question: string;
        categoryTag?: string;
    }[];
    suggestedDoctorPrep?: string[];
}> {
    if (!questions || questions.length === 0) {
        return {
            summary: "老友記，您暫時未有保存任何問題。在問診或與 AI 對話時，如果見到想問醫生的問題，可以點擊「保存」，AI 會在這裡幫您按經常問的 3-5 個類別整理總結！",
            recommendedQuestions: []
        };
    }

    const prompt = `
    請分析以下由糖尿病長者（老友記）保存的問題清單：
    ${JSON.stringify(questions)}
    
    請進行清晰、結構化的整理：
    1. 【經常保存的 3-5 類別問題總結】：統計並歸納出長者最關心的 3 至 5 個核心類別話題（例如：用藥與副作用、飲食份量與技巧、日常血糖波動、低血糖預防、足部與併發症檢查等），並按出現頻率排序，簡短說明每個類別的主要關注點。
    2. 【整體 AI 總結摘要 (summary)】：用親切的香港廣東話口語（2-3 句），整體概述長者最關注的焦點。
    3. 【建議問診問題 (recommendedQuestions)】：根據上述 3-5 個類別重點，精準提煉出【剛好 3-5 個】最實用、切中要害、可直接向醫生開口發問的廣東話問題。
       - 格式要求：直接給出問題句子本身（question），並標註所屬類別標籤（categoryTag）。
    
    請嚴格使用以下 JSON 結構返回：
    - summary: 整體概述（繁體中文廣東話口語）
    - categories: 歸納出的 3-5 個類別列表，每項包含：
       - categoryName: 類別名稱（例如：「用藥與副作用管理」）
       - description: 簡要說明（例如：「關心食藥後的胃脹、低血糖風險及是否需調藥」）
       - frequency: 頻率標籤（例如：「最常提問」、「高頻關注」或「經常諮詢」）
    - recommendedQuestions: 建議就診提問列表（剛好 3-5 個），每項包含：
       - question: 建議直接問醫生的廣東話問題句子（例如「醫生，我食咗藥後成日胃脹，可唔可以調整藥物？」）
       - categoryTag: 所屬類別標籤
    `;

    const response = await generateContentWithRetry({
        model: getTextModel(),
        contents: prompt,
        config: {
            systemInstruction: "你是一位香港糖尿病就診溝通助理。你的任務是總結長者保存的問題，歸納出 3-5 個經常保存的類別問題，並根據重點精準給出 3-5 個建議就診提問句子。文字精簡、親切廣東話口語，不囉嗦。",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    categories: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                categoryName: { type: Type.STRING },
                                description: { type: Type.STRING },
                                frequency: { type: Type.STRING }
                            },
                            required: ["categoryName", "description"]
                        }
                    },
                    recommendedQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                categoryTag: { type: Type.STRING }
                            },
                            required: ["question"]
                        }
                    }
                },
                required: ["summary", "categories", "recommendedQuestions"]
            }
        }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text.trim());
    const list = (parsed.recommendedQuestions || []).slice(0, 5);
    return {
        summary: parsed.summary || "老友記，已按你最常保存嘅問題類別整理好總結與建議提問：",
        categories: (parsed.categories || []).slice(0, 5),
        recommendedQuestions: list
    };
}

