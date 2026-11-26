/**
 * Glucose draft and record construction. UI hooks handle alerts and React state.
 */
import type { GlucoseRecord } from '../utils/types';
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson } from './storage';

export type NewGlucoseDraft = {
    value: string;
    timeType: GlucoseRecord['timeType'] | '';
    symptoms: string[];
    mealTag?: GlucoseRecord['mealTag'];
    dietNote?: string;
    exerciseNote?: string;
    illnessNote?: string;
    medicationNote?: string;
    bpSystolic?: string;
    bpDiastolic?: string;
    pulse?: string;
    weight?: string;
    mood?: string;
    customTimestamp?: number;
    customDateStr?: string;
};

export function emptyGlucoseDraft(): NewGlucoseDraft {
    return {
        value: '',
        timeType: '',
        symptoms: [],
        mealTag: undefined,
        dietNote: '',
        exerciseNote: '',
        illnessNote: '',
        medicationNote: '',
        bpSystolic: '',
        bpDiastolic: '',
        pulse: '',
        weight: '',
        mood: '',
        customTimestamp: undefined,
        customDateStr: undefined
    };
}

export function loadGlucoseRecords(): GlucoseRecord[] {
    return readJson<GlucoseRecord[]>(STORAGE_KEYS.glucose, []);
}

export function persistGlucoseRecords(records: GlucoseRecord[]): void {
    writeJson(STORAGE_KEYS.glucose, records);
}

export function sortGlucoseRecords(records: GlucoseRecord[]): GlucoseRecord[] {
    return [...records].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export type BuildGlucoseResult =
    | { ok: true; record: GlucoseRecord }
    | { ok: false; reason: 'empty' | 'missing-time-type' };

export function buildGlucoseRecord(newGlucose: NewGlucoseDraft, now: Date = new Date()): BuildGlucoseResult {
    let val = parseFloat(newGlucose.value);
    if (!isNaN(val) && val < 0) {
        val = 0;
    }
    const hasSymptoms = newGlucose.symptoms && newGlucose.symptoms.length > 0;

    // 如果既沒有輸入有效數值，也沒有選擇任何症狀，則不作處理
    if (isNaN(val) && !hasSymptoms) return { ok: false, reason: 'empty' };

    // 如果沒有選擇測量時間點，提示用戶選擇
    if (!newGlucose.timeType) {
        return { ok: false, reason: 'missing-time-type' };
    }

    const recordDate = newGlucose.customTimestamp
        ? new Date(newGlucose.customTimestamp)
        : now;
    const timestamp = recordDate.getTime();

    // Format display date: YYYY/MM/DD HH:mm or MM/DD HH:mm
    const dateStr = newGlucose.customDateStr || recordDate.toLocaleDateString('zh-HK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\//g, '/');

    const record: GlucoseRecord = {
        id: timestamp.toString() + '_' + Math.random().toString(36).substr(2, 4),
        value: isNaN(val) ? '' : val.toFixed(1),
        timeType: newGlucose.timeType as GlucoseRecord['timeType'],
        timestamp: timestamp,
        date: dateStr,
        symptoms: newGlucose.symptoms || [],
        mealTag: newGlucose.mealTag,
        dietNote: newGlucose.dietNote || '',
        exerciseNote: newGlucose.exerciseNote || '',
        illnessNote: newGlucose.illnessNote || '',
        medicationNote: newGlucose.medicationNote || '',
        bpSystolic: newGlucose.bpSystolic || '',
        bpDiastolic: newGlucose.bpDiastolic || '',
        pulse: newGlucose.pulse || '',
        weight: newGlucose.weight || '',
        mood: newGlucose.mood || ''
    };
    return { ok: true, record };
}
