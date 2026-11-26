/** Medication reminder persistence (unwired UI still uses these keys). */
import { STORAGE_KEYS } from './storageKeys';
import { readJsonSafe, writeJson } from './storage';

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
