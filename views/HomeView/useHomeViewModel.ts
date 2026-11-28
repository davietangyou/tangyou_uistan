import { useMemo, useState } from 'react';
import { personalGreeting, clinicDateReminder, saveNextClinicDetails, loadReminders } from '../../domain';
import type { MedicationReminder } from '../../utils/types';
import type { HomeViewProps } from './types';

export function useHomeViewModel({glucoseRecords, setView, setConsultStep, profile, setProfile, isLargeFont, setIsLargeFont}: HomeViewProps) {
    const hour = new Date().getHours();
    const greeting = personalGreeting(profile?.name, hour);

    // 檢查生活檔案是否已完善
    const isProfileEnriched = !!(profile.clinicType || (profile.dietHabits && profile.dietHabits.length > 0));

    // 下次問診相關狀態
    const nextClinicDate = profile.nextClinicDate || '';
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const nextClinicTime = profile.nextClinicTime || '';
    const nextClinicLocation = profile.nextClinicLocation || '';

    // 日期提醒計算 (檢查是否為當日或即將到來)
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [tempDate, setTempDate] = useState(nextClinicDate);
    const [tempTime, setTempTime] = useState(nextClinicTime);
    const [tempLocation, setTempLocation] = useState(nextClinicLocation);

    // 計算就診提醒狀態
    const reminder = clinicDateReminder(nextClinicDate);
    const dateReminderStatus = reminder.status;
    const daysDiff = reminder.daysDiff;

    // 儲存修改的問診日期
    const handleSaveDate = () => {
        setProfile(saveNextClinicDetails(profile, { date: tempDate, time: tempTime, location: tempLocation }));
        setIsEditingDate(false);
    };

    // 今日服藥（唯讀）：只讀取檔案用藥與 dia_reminders_v2，不寫入、不改提醒規則
    const medicationReminders = useMemo(
        () => loadReminders<MedicationReminder>([])
            .filter((r) => r && typeof r.time === 'string' && typeof r.name === 'string')
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time)),
        []
    );
    const medications = (profile.medicationDetails || []).filter((m) => m && m.name);

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
        nextClinicTime,
        nextClinicLocation,
        tempTime, setTempTime,
        tempLocation, setTempLocation,
        medicationReminders,
        medications,
        isEditingDate, setIsEditingDate,
        tempDate, setTempDate,
        dateReminderStatus,
        daysDiff,
        handleSaveDate,
    };
}

export type HomeViewModel = ReturnType<typeof useHomeViewModel>;
