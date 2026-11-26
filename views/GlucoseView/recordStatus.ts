/**
 * Display-only status helpers for the records views (Stage 6).
 * Same thresholds and comparison order as the inline checks they replace:
 *   glucose: no value → none; < 4.0 → low; 空腹/餐前 > 7.0 or other > 10.0 → high; else normal
 *   HbA1c list: ≥ 8.0 → high; ≥ 7.0 → elevated; else ideal
 *   HbA1c entry hint: < 6.0, < 7.0, < 8.0, else high
 * Kept in lock-step with views/HomeView/glucoseStatus.ts. Not a clinical rule change.
 */
export type GlucoseStatus = 'none' | 'low' | 'high' | 'normal';

export function isFastingTimeType(timeType: string | undefined): boolean {
    return timeType === '空腹' || timeType === '餐前';
}

export function glucoseStatus(value: string | undefined, timeType: string | undefined): GlucoseStatus {
    const hasValue = value !== undefined && value !== '';
    if (!hasValue) return 'none';
    const val = parseFloat(value as string);
    if (val < 4.0) return 'low';
    const isFasting = isFastingTimeType(timeType);
    if ((isFasting && val > 7.0) || (!isFasting && val > 10.0)) return 'high';
    return 'normal';
}

export type HbA1cRecordTier = 'high' | 'elevated' | 'ideal';

export function hba1cRecordTier(value: string): HbA1cRecordTier {
    const val = parseFloat(value);
    if (val >= 8.0) return 'high';
    if (val >= 7.0) return 'elevated';
    return 'ideal';
}

export type HbA1cEntryTier = 'excellent' | 'good' | 'fair' | 'high';

export function hba1cEntryTier(val: number): HbA1cEntryTier {
    if (val < 6.0) return 'excellent';
    if (val < 7.0) return 'good';
    if (val < 8.0) return 'fair';
    return 'high';
}
