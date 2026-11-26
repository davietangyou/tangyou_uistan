/**
 * HbA1c record construction and persistence.
 */
import type { HbA1cRecord } from '../utils/types';
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson } from './storage';

export function loadHbA1cRecords(): HbA1cRecord[] {
    return readJson<HbA1cRecord[]>(STORAGE_KEYS.hba1c, []);
}

export function persistHbA1cRecords(records: HbA1cRecord[]): void {
    writeJson(STORAGE_KEYS.hba1c, records);
}

export function sortHbA1cRecords(records: HbA1cRecord[]): HbA1cRecord[] {
    return [...records].sort((a, b) => b.timestamp - a.timestamp);
}

export function buildHbA1cRecord(value: string, date: string, now: Date = new Date()): HbA1cRecord | null {
    const val = parseFloat(value);
    if (isNaN(val)) return null;
    return {
        id: now.getTime().toString(),
        value: val.toFixed(1),
        date,
        timestamp: new Date(date).getTime()
    };
}
