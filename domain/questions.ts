/**
 * Saved-question and next-clinic-list updates. Pure functions over UserProfile.
 */
import type { UserProfile } from '../utils/types';

export function toggleNextClinicQuestionOnProfile(profile: UserProfile, qText: string): UserProfile {
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const trimmed = qText.trim();
    const exists = nextClinicQuestions.some(item => item.trim() === trimmed);
    let updated: string[];
    if (exists) {
        updated = nextClinicQuestions.filter(item => item.trim() !== trimmed);
    } else {
        updated = [...nextClinicQuestions, trimmed];
    }
    return {
        ...profile,
        nextClinicQuestions: updated
    };
}

export function addSavedDoctorQuestion(profile: UserProfile, text: string): UserProfile | null {
    if (!text.trim()) return null;
    const savedQuestions = profile.savedDoctorQuestions || [];
    const updated = [text.trim(), ...savedQuestions];
    return {
        ...profile,
        savedDoctorQuestions: updated
    };
}

export function deleteSavedDoctorQuestion(profile: UserProfile, indexToDelete: number): UserProfile {
    const savedQuestions = profile.savedDoctorQuestions || [];
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const deletedText = savedQuestions[indexToDelete];
    const updated = savedQuestions.filter((_, idx) => idx !== indexToDelete);
    // 若該問題也在下次問診清單中，同時移除
    const updatedNext = nextClinicQuestions.filter(item => item.trim() !== deletedText.trim());
    return {
        ...profile,
        savedDoctorQuestions: updated,
        nextClinicQuestions: updatedNext
    };
}

export function editSavedDoctorQuestion(profile: UserProfile, editingIndex: number, editingText: string): UserProfile | null {
    if (!editingText.trim()) return null;
    const savedQuestions = profile.savedDoctorQuestions || [];
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const oldText = savedQuestions[editingIndex];
    const newText = editingText.trim();
    const updated = [...savedQuestions];
    updated[editingIndex] = newText;

    // 若在下次問診清單中，也同步更新
    const updatedNext = nextClinicQuestions.map(item => item.trim() === oldText.trim() ? newText : item);

    return {
        ...profile,
        savedDoctorQuestions: updated,
        nextClinicQuestions: updatedNext
    };
}

export function saveNextClinicDate(profile: UserProfile, nextClinicDate: string): UserProfile {
    return {
        ...profile,
        nextClinicDate
    };
}

export function addNextClinicQuestion(profile: UserProfile, text: string): UserProfile | null {
    if (!text.trim()) return null;
    const savedQuestions = profile.savedDoctorQuestions || [];
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const q = text.trim();
    const updatedNext = [q, ...nextClinicQuestions];
    // 若全部保存中沒有，也自動加入保存清單
    const updatedSaved = savedQuestions.includes(q) ? savedQuestions : [q, ...savedQuestions];
    return {
        ...profile,
        nextClinicQuestions: updatedNext,
        savedDoctorQuestions: updatedSaved
    };
}
