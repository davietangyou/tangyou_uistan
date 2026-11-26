/**
 * Consult chat persistence. Image base64 is stripped before write to avoid overflowing localStorage.
 */
import type { ChatMessage } from '../utils/types';
import { STORAGE_KEYS } from './storageKeys';
import { readString, writeJson, removeKey } from './storage';

export function loadChatMessages<T = ChatMessage>(fallback: T[]): T[] {
    try {
        const saved = readString(STORAGE_KEYS.chatMessages);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed as T[];
            }
        }
    } catch (e) {
        console.error("無法讀取歷史對話紀錄", e);
    }
    return fallback;
}

export function persistChatMessages(chatMessages: ChatMessage[]): void {
    try {
        const messagesToStore = chatMessages.map(msg => {
            if (msg.imageAttachment) {
                return {
                    ...msg,
                    imageAttachment: {
                        mimeType: msg.imageAttachment.mimeType,
                        base64: '',
                        previewUrl: '',
                        name: msg.imageAttachment.name
                    }
                };
            }
            return msg;
        });
        writeJson(STORAGE_KEYS.chatMessages, messagesToStore);
    } catch (e) {
        console.error("儲存對話紀錄失敗", e);
    }
}

export function clearChatMessages(): void {
    try {
        removeKey(STORAGE_KEYS.chatMessages);
    } catch (e) {
        console.error("清空對話儲存失敗", e);
    }
}
