import type { ChatTurn, GlucoseRecord, HbA1cRecord, UserProfile } from "../utils/types";

async function postGeminiApi<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    const trimmed = rawText.trimStart();
    const looksLikeHtml =
        contentType.includes("text/html") ||
        trimmed.startsWith("<!") ||
        trimmed.startsWith("<html");

    if (!response.ok) {
        let errorMessage = `請求失敗 (${response.status})`;
        if (!looksLikeHtml && rawText) {
            try {
                const errorBody = JSON.parse(rawText);
                if (errorBody?.error) {
                    errorMessage = errorBody.error;
                }
            } catch {
                // Ignore JSON parse errors on error responses
            }
        }
        throw new Error(errorMessage);
    }

    if (looksLikeHtml) {
        throw new Error("伺服器暫時回傳了非預期的網頁回應，請重新整理頁面後再試一次。");
    }

    try {
        return JSON.parse(rawText) as T;
    } catch {
        throw new Error("伺服器回應格式異常，請稍後再試一次。");
    }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    const data = await postGeminiApi<{ text: string }>("/api/gemini/transcribe-audio", {
        base64Audio,
        mimeType,
    });
    return data.text || "";
}

export async function getConversationalChatResponse(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    message: string,
    history: ChatTurn[] = [],
    imageAttachment?: { data: string; mimeType: string },
    hba1cRecords: HbA1cRecord[] = [],
    preferenceAlreadySubmitted: boolean = false
): Promise<any> {
    return postGeminiApi<any>("/api/gemini/chat", {
        profile,
        glucoseRecords,
        hba1cRecords,
        message,
        history,
        imageAttachment,
        preferenceAlreadySubmitted,
    });
}

export async function analyzeSavedQuestions(questions: string[]): Promise<{
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
    return postGeminiApi("/api/gemini/analyze-saved-questions", {
        questions,
    });
}

/** 未接線能力：客戶端已封裝 /api/gemini/daily-tip，但目前沒有任何 UI 調用本函數。請勿刪除。 */
export async function generateDailyTipFromHKWebsites(): Promise<{
    icon: string;
    title: string;
    desc: string;
    tag: string;
    source: string;
    url?: string;
}> {
    return postGeminiApi("/api/gemini/daily-tip", {});
}

export async function recognizeMedicationsFromImage(
    imageBase64: string,
    mimeType: string = "image/jpeg"
): Promise<{
    medications: { name: string; dosage?: string; usage?: string }[];
    rawNotes?: string;
}> {
    return postGeminiApi("/api/gemini/recognize-medications", {
        imageBase64,
        mimeType,
    });
}