/**
 * /Users/davie/Desktop/EffLearn/tangyou_uistan/services/dataService.ts
 *
 * 数据服务层
 * 负责处理所有与后端 API 的交互，包括文件上传。
 * 同时包含纯数据转换辅助函数（如 Profile 自动写回）。
 */

import { UserProfile, DecisionResult } from "../utils/types";

// === 环境判断逻辑 ===
const isLocalEnv = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// === API 配置 ===
const PROD_HOST = 'https://tangyou-app.alphathought.org';
const LOCAL_HOST = 'http://localhost:8002';
// 保持原有的长路径结构
const API_PATH = '/chtatain-datacent/client-api/tangserv/newyshwo/vidoquse';

// 根据环境动态生成 Base URL
const API_BASE = isLocalEnv()
    ? `${LOCAL_HOST}${API_PATH}`
    : `${PROD_HOST}${API_PATH}`;

// 调试日志，方便确认当前连接的地址
console.log(`[DataService] Current Environment: ${isLocalEnv() ? 'Local' : 'Production'}, API Base: ${API_BASE}`);

const UPLOAD_URL = `${API_BASE}/fileupload`;
const DOWNLOAD_BASE = `${API_BASE}/fileget`;

// 统一的鉴权 Header
const BASE_HEADERS = {
    'fixed-pwd': '8875be1014764426',
};

/**
 * 上传单个文件（录音或 JSON 数据）
 *
 * @param blob - 要上传的文件 Blob 对象
 * @param filename - 文件名
 * @returns Promise<string> - 返回文件的下载链接 (URL)
 */
export const uploadFile = async (blob: Blob, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            ...BASE_HEADERS,
            'check-same-md5': 'true'
        },
        body: formData
    });

    if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
    }

    const json = await res.json();

    // 构造并返回下载链接
    return `${DOWNLOAD_BASE}/${json.alphathought_anon_id}/${json.filename}`;
};

/**
 * Split Write-back Logic (Corresponds to Flowchart Stage B)
 * 将 AI 返回的 extractedProfileData 合并到用户 Profile 中。
 * - Auto-write: Explicit, low-risk fields.
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