/**
 * UI-independent domain layer for 糖友導航.
 *
 * Hooks and views should import business rules, record builders, and
 * persistence from here so a future UI refactor can reuse the same contracts
 * without copying localStorage keys or calculation logic.
 */
export { STORAGE_KEYS, storage, readJson, readJsonSafe, writeJson, readString, writeString, removeKey, clearAllStorage } from './storage';
export type { StorageKey } from './storageKeys';
export { emptyProfile, loadProfileFromStorage, persistProfile, toggleConditionOnProfile, mergeSavedDoctorQuestions } from './profile';
export { emptyGlucoseDraft, loadGlucoseRecords, persistGlucoseRecords, sortGlucoseRecords, buildGlucoseRecord } from './glucose';
export type { NewGlucoseDraft, BuildGlucoseResult } from './glucose';
export { loadHbA1cRecords, persistHbA1cRecords, sortHbA1cRecords, buildHbA1cRecord } from './hba1c';
export { calculateBmi } from './bmi';
export { EXERCISE_TYPE_OPTIONS, calculateExerciseFromHabits } from './exercise';
export { loadLargeFontPreference, persistLargeFontPreference } from './font';
export { loadChatMessages, persistChatMessages, clearChatMessages } from './chatMessages';
export { loadReminders, persistReminders, loadTakenLogs, persistTakenLogs } from './reminders';
