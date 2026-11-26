import type { UserProfile } from "../../utils/types";

/** Load and migrate the stored profile, or return the empty default profile. */
export function loadProfileFromStorage(): UserProfile {
    const saved = localStorage.getItem('dia_profile');
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
