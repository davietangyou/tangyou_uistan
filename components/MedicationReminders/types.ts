import type { UserProfile } from '../../utils/types';

export interface MedicationRemindersProps {
    profile: UserProfile;
    isLargeFont: boolean;
    onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

export interface ReminderItem {
    id: string;
    name: string;
    dosage: string;
    period: 'morning' | 'noon' | 'evening' | 'bedtime';
    active: boolean;
}

export type MedPeriod = ReminderItem['period'];
