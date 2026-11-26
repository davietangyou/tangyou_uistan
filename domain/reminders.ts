/** Medication reminder persistence (unwired UI still uses these keys). */
import { STORAGE_KEYS } from './storageKeys';
import { readJsonSafe, writeJson, readString, writeString } from './storage';

export function loadReminders<T>(fallback: T[] = []): T[] {
    return readJsonSafe(STORAGE_KEYS.reminders, fallback, (e) => console.error(e));
}

export function persistReminders(reminders: unknown): void {
    writeJson(STORAGE_KEYS.reminders, reminders);
}

export function loadTakenLogs(fallback: Record<string, boolean> = {}): Record<string, boolean> {
    return readJsonSafe(STORAGE_KEYS.takenLogs, fallback, (e) => console.error(e));
}

export function persistTakenLogs(logs: Record<string, boolean>): void {
    writeJson(STORAGE_KEYS.takenLogs, logs);
}

/**
 * Daily auto-popup flags. The runtime key is always
 * dia_auto_triggered_${YYYY-MM-DD}_${period} (identical to the previous template).
 */
export function autoTriggeredStorageKey(todayStr: string, period: string): string {
    return `dia_auto_triggered_${todayStr}_${period}`;
}

export function hasAutoTriggered(todayStr: string, period: string): boolean {
    return Boolean(readString(autoTriggeredStorageKey(todayStr, period)));
}

export function markAutoTriggered(todayStr: string, period: string): void {
    writeString(autoTriggeredStorageKey(todayStr, period), 'true');
}
