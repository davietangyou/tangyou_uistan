/**
 * Display-only classification for the Home glucose card.
 * Thresholds match views/GlucoseView/useGlucoseViewModel.ts
 * (low < 4.0; fasting/餐前 high > 7.0; otherwise high > 10.0).
 * Do not treat this as a new clinical rule — keep it in lock-step with GlucoseView.
 */
import type {GlucoseRecord} from '../../utils/types';
import type {StatTone} from '../../components/ui';

export function isFastingTimeType(timeType: GlucoseRecord['timeType'] | undefined): boolean {
    return timeType === '空腹' || timeType === '餐前';
}

export function glucoseCardStatus(record: GlucoseRecord | undefined): {
    tone: StatTone;
    statusLabel: string;
} | null {
    if (!record) return null;
    const raw = record.value;
    if (raw === undefined || raw === '' || Number.isNaN(parseFloat(raw))) return null;
    const value = parseFloat(raw);
    if (value < 4.0) return {tone: 'low', statusLabel: '過低 請小心'};
    if (isFastingTimeType(record.timeType) && value > 7.0) return {tone: 'high', statusLabel: '偏高 需注意'};
    if (!isFastingTimeType(record.timeType) && value > 10.0) return {tone: 'high', statusLabel: '偏高 需注意'};
    return {tone: 'target', statusLabel: '達標'};
}

export function glucosePeriodLabel(record: GlucoseRecord): string {
    const parts = [record.timeType, record.mealTag].filter(Boolean);
    return parts.join(' · ');
}
