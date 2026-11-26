import { useState } from 'react';
import { personalGreeting, clinicDateReminder, saveNextClinicDate } from '../../domain';
import type { HomeViewProps } from './types';

export function useHomeViewModel({glucoseRecords, setView, setConsultStep, profile, setProfile, isLargeFont, setIsLargeFont}: HomeViewProps) {
    const hour = new Date().getHours();
    const greeting = personalGreeting(profile?.name, hour);

    // 檢查生活檔案是否已完善
    const isProfileEnriched = !!(profile.clinicType || (profile.dietHabits && profile.dietHabits.length > 0));

    // 下次問診相關狀態
    const nextClinicDate = profile.nextClinicDate || '';
    const nextClinicQuestions = profile.nextClinicQuestions || [];

    // 日期提醒計算 (檢查是否為當日或即將到來)
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [tempDate, setTempDate] = useState(nextClinicDate);

    // 計算就診提醒狀態
    const reminder = clinicDateReminder(nextClinicDate);
    const dateReminderStatus = reminder.status;
    const daysDiff = reminder.daysDiff;

    // 儲存修改的問診日期
    const handleSaveDate = () => {
        setProfile(saveNextClinicDate(profile, tempDate));
        setIsEditingDate(false);
    };

    return {
        glucoseRecords,
        setView,
        setConsultStep,
        profile,
        setProfile,
        isLargeFont,
        setIsLargeFont,
        greeting,
        isProfileEnriched,
        nextClinicDate,
        nextClinicQuestions,
        isEditingDate, setIsEditingDate,
        tempDate, setTempDate,
        dateReminderStatus,
        daysDiff,
        handleSaveDate,
    };
}

export type HomeViewModel = ReturnType<typeof useHomeViewModel>;
