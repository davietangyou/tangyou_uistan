/**
 * Single access path for persisted client data.
 * Behavior matches the previous inlined localStorage calls.
 */
import { STORAGE_KEYS } from './storageKeys';

export { STORAGE_KEYS };
export type { StorageKey } from './storageKeys';

export function readString(key: string): string | null {
    return localStorage.getItem(key);
}

export function writeString(key: string, value: string): void {
    localStorage.setItem(key, value);
}

export function removeKey(key: string): void {
    localStorage.removeItem(key);
}

/** Parse JSON or return fallback. Throws if the stored value is invalid JSON (legacy glucose/profile behavior). */
export function readJson<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw) as T;
}

/** Parse JSON, returning fallback on missing data or parse errors. */
export function readJsonSafe<T>(key: string, fallback: T, onError?: (error: unknown) => void): T {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        onError?.(error);
        return fallback;
    }
}

export function writeJson(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
}

export function clearAllStorage(): void {
    localStorage.clear();
}

export const storage = {
    keys: STORAGE_KEYS,
    readString,
    writeString,
    removeKey,
    readJson,
    readJsonSafe,
    writeJson,
    clearAll: clearAllStorage,
};
