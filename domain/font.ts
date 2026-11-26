/** Large-font preference. Defaults to on when nothing is stored. */
import { STORAGE_KEYS } from './storageKeys';
import { readString, writeString } from './storage';

export function loadLargeFontPreference(): boolean {
    const saved = readString(STORAGE_KEYS.largeFont);
    return saved ? saved === 'true' : true; // 預設開啟大字護老模式
}

export function persistLargeFontPreference(value: boolean): void {
    writeString(STORAGE_KEYS.largeFont, String(value));
}
