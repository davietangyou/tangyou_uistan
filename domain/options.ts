/**
 * Option tables whose ids / values get stored in dia_profile and sent to the
 * AI. They used to be written inline in the view files; moved here unchanged
 * (ids, labels, order) so a UI rewrite can restyle or move the pickers
 * without touching stored values. scripts/verify pins them in
 * option-values.normalized.json.
 */

/** 日常飲食習慣 (multi-select) → profile.dietHabits */
export const DIET_HABIT_OPTIONS = [
    { id: 'OUTSIDE_EATING', title: '經常出街食飯 (外食為主)' },
    { id: 'REFINED_CARB', title: '主食偏好精製澱粉 (如白飯、麵包、河粉、粥)' },
    { id: 'SUGARY_DRINK', title: '習慣飲含糖飲品 (如奶茶、凍檸茶、汽水)' },
    { id: 'MIDNIGHT_SNACK', title: '有食宵夜或睡前點心習慣' },
    { id: 'HOME_COOK', title: '飲食定時定量，家中自煮為主' }
] as const;

/** 每週運動日數 → profile.exerciseDaysPerWeek */
export const EXERCISE_DAYS_OPTIONS = [
    { id: '0', label: '0 日' },
    { id: '1-2', label: '1-2 日' },
    { id: '3-4', label: '3-4 日' },
    { id: '5+', label: '5 日以上' }
] as const;

/** 每次運動分鐘 → profile.exerciseMinutesPerSession */
export const EXERCISE_MINUTES_OPTIONS = [
    { id: '15', label: '< 20 分鐘' },
    { id: '30', label: '約 30 分鐘' },
    { id: '45', label: '約 45 分鐘' },
    { id: '60+', label: '60 分鐘+' }
] as const;

/** 運動自覺強度 → profile.exerciseIntensity */
export const EXERCISE_INTENSITY_OPTIONS = [
    { id: 'LIGHT', title: '輕度' },
    { id: 'MODERATE', title: '中等' },
    { id: 'VIGOROUS', title: '高強度' }
] as const;

/** 糖尿病類型 (我的 → 糖尿病相關信息) → profile.diabetesType */
export const DIABETES_TYPE_OPTIONS = [
    { value: 'TYPE_2', label: '第 2 型糖尿病 (常見糖尿 / Type 2 DM)' },
    { value: 'TYPE_1', label: '第 1 型糖尿病 (胰島素依賴 / Type 1 DM)' },
    { value: 'PRE_DIABETES', label: '糖尿病前期 / 血糖警戒線 (Pre-diabetes)' },
    { value: 'GESTATIONAL', label: '妊娠期糖尿病 (Gestational DM)' },
    { value: 'OTHER', label: '其他類型 (Other Types)' }
] as const;

/** 糖尿病類型 (首次設定) → profile.diabetesType. Same values; last label differs. */
export const ONBOARDING_DIABETES_TYPE_OPTIONS = [
    { value: 'TYPE_2', label: '第 2 型糖尿病 (常見糖尿 / Type 2 DM)' },
    { value: 'TYPE_1', label: '第 1 型糖尿病 (胰島素依賴 / Type 1 DM)' },
    { value: 'PRE_DIABETES', label: '糖尿病前期 / 血糖警戒線 (Pre-diabetes)' },
    { value: 'GESTATIONAL', label: '妊娠期糖尿病 (Gestational DM)' },
    { value: 'OTHER', label: '其他類型 / 未確定' }
] as const;

/** 性別 → profile.gender (stored as the label itself). */
export const GENDER_OPTIONS = ['男', '女', '其他'] as const;
