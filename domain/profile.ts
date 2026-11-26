/**
 * Profile defaults, storage migration, and pure profile updates.
 * UI hooks should call these instead of inlining the same rules.
 */
import type { UserProfile } from '../utils/types';
import { STORAGE_KEYS } from './storageKeys';
import { readString, writeJson } from './storage';

export function emptyProfile(): UserProfile {
    return {
        age: '',
        gender: '',
        bmi: '',
        height: '',
        weight: '',
        weightUnit: 'kg',
        lifestyle: '',
        diabetesType: 'UNKNOWN',
        otherDiabetesType: '',
        yearsWithDiabetes: '',
        hypertensionYears: '',
        livingSituation: '',
        medications: '',
        otherConditions: '',
        conditions: [],
        conditionDetails: {},
        hypoExperience: '',
        glucoseMonitoring: '',
        dietHabits: [],
        dietHabitsOther: '',
        exerciseWeekly: '',
        exerciseDaysPerWeek: '',
        exerciseMinutesPerSession: '',
        exerciseTypes: [],
        sleepQuality: '',
        stressMood: '',
        clinicType: undefined,
        clinicTypes: [],
        clinicTypeOther: '',
        isInsulinUser: false,
        hasCaregiverSupport: false,
        hasNoCaregiverSupport: false,
        savedDoctorQuestions: [],
        nextClinicDate: '',
        nextClinicQuestions: []
    };
}

/** Load and migrate the stored profile, or return the empty default profile. */
export function loadProfileFromStorage(): UserProfile {
    const saved = readString(STORAGE_KEYS.profile);
    if (saved) {
        const parsed = JSON.parse(saved);
        const conditionDetails = parsed.conditionDetails || {};
        const dmYears = parsed.yearsWithDiabetes || conditionDetails?.DM?.years || '';
        if (dmYears) {
            conditionDetails.DM = { ...(conditionDetails.DM || {}), years: dmYears };
        }
        // 賦予預設值以防舊數據缺失新欄位
        return {
            diabetesType: parsed.diabetesType || 'UNKNOWN',
            isInsulinUser: parsed.isInsulinUser || false,
            hasCaregiverSupport: parsed.hasCaregiverSupport || false,
            hasNoCaregiverSupport: parsed.hasNoCaregiverSupport || false,
            savedDoctorQuestions: parsed.savedDoctorQuestions || [],
            nextClinicDate: parsed.nextClinicDate || '',
            nextClinicQuestions: parsed.nextClinicQuestions || [],
            bmi: parsed.bmi || '',
            ...parsed,
            yearsWithDiabetes: dmYears,
            conditionDetails: conditionDetails,
            clinicTypes: parsed.clinicTypes || (parsed.clinicType ? [parsed.clinicType] : [])
        };
    }
    return emptyProfile();
}

export function persistProfile(profile: UserProfile): void {
    writeJson(STORAGE_KEYS.profile, profile);
}

export function toggleConditionOnProfile(profile: UserProfile, cond: string): UserProfile {
    const current = profile.conditions || [];
    if (cond === 'NONE') {
        return {...profile, conditions: ['NONE']};
    }
    let next = current.filter(c => c !== 'NONE');
    if (next.includes(cond)) {
        next = next.filter(c => c !== cond);
    } else {
        next = [...next, cond];
    }
    return {...profile, conditions: next};
}

export function mergeSavedDoctorQuestions(profile: UserProfile, questions: string[]): UserProfile {
    if (!questions.length) return profile;
    const current = profile.savedDoctorQuestions || [];
    // 合併並去重，保持最新
    const updated = [...new Set([...questions, ...current])];
    return {...profile, savedDoctorQuestions: updated};
}
