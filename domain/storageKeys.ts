/**
 * Canonical localStorage key names. Values must stay stable: changing a
 * string would drop users' existing data.
 */
export const STORAGE_KEYS = {
    profile: 'dia_profile',
    glucose: 'dia_glucose',
    hba1c: 'dia_hba1c',
    largeFont: 'dia_large_font',
    chatMessages: 'dia_chat_messages',
    reminders: 'dia_reminders_v2',
    takenLogs: 'dia_taken_logs_v2',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
