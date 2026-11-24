import { UserProfile, DecisionResult } from "../utils/types";

/**
 * Split Write-back Logic (Corresponds to Flowchart Stage B)
 * - Auto-write: Explicit, low-risk fields.
 * - (Potential future) Flag for review: Speculative or risky data.
 */
export function applyProfileUpdate(
    currentProfile: UserProfile, 
    extracted?: DecisionResult['extractedProfileData']
): UserProfile {
    if (!extracted) return currentProfile;

    const newProfile = { ...currentProfile };

    // 1. Stated Concern & Themes
    if (extracted.statedConcern) {
        const concerns = newProfile.expressedConcerns || [];
        if (!concerns.includes(extracted.statedConcern)) {
            newProfile.expressedConcerns = [...concerns, extracted.statedConcern];
        }
    }
    
    if (extracted.scenarioTheme) {
        const themes = newProfile.recentQuestionThemes || [];
        if (!themes.includes(extracted.scenarioTheme)) {
            newProfile.recentQuestionThemes = [...themes, extracted.scenarioTheme];
        }
    }

    // 2. Caregiver Involvement
    if (extracted.caregiverMentioned === true) {
        newProfile.hasCaregiverSupport = true;
    }

    // 3. Education Topics
    if (extracted.educationTopic) {
        const topics = newProfile.educationTopicsViewed || [];
        if (!topics.includes(extracted.educationTopic)) {
            newProfile.educationTopicsViewed = [...topics, extracted.educationTopic];
        }
    }

    // 4. Stated Preference Signals
    if (extracted.preference) {
        const prefs = newProfile.preferenceSignals || [];
        if (!prefs.includes(extracted.preference)) {
            newProfile.preferenceSignals = [...prefs, extracted.preference];
        }
    }

    // 5. Inferred Notes & Risk Signals (Flagged for Review)
    if (extracted.inferredNote) {
        const notes = newProfile.inferredNotes || [];
        if (!notes.includes(extracted.inferredNote)) {
            newProfile.inferredNotes = [...notes, extracted.inferredNote];
        }
    }

    if (extracted.riskSignal) {
        const risks = newProfile.riskSignals || [];
        if (!risks.includes(extracted.riskSignal)) {
            newProfile.riskSignals = [...risks, extracted.riskSignal];
        }
    }

    return newProfile;
}

/**
 * Generic file upload mock (Corresponds to Data Reporting Path)
 */
export async function uploadFile(blob: Blob | File, filename: string): Promise<string> {
    // 模擬網絡延遲
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 返回一個模擬的 URL
    const mockId = Math.random().toString(36).substring(7);
    return `https://mock-storage.example.com/uploads/${mockId}/${filename}`;
}

/**
 * Mock fetching admin JSON data
 */
export async function fetchAdminJson(): Promise<Record<string, Record<string, any>>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        "report_1": {
            id: "report_1",
            date: "2024-05-20",
            summary: "病人在飲食控制方面有明顯進步。",
            details: "HbA1c 下降了 0.2%"
        },
        "report_2": {
            id: "report_2",
            date: "2024-05-15",
            summary: "建議增加運動頻率。",
            details: "平均每日步數小於 3000"
        }
    };
}

/**
 * Mock fetching a secure blob (e.g. for audio playback with auth)
 */
export async function fetchSecureBlob(url: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // 返回一個空的音頻 Blob 模擬
    return new Blob([], { type: 'audio/webm' });
}
