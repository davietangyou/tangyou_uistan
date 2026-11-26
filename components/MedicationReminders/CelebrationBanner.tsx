import type { MedicationRemindersViewModel } from './useMedicationReminders';

export function CelebrationBanner({vm}: {vm: MedicationRemindersViewModel}) {
    const {
        profile, isLargeFont, onProfileUpdate,
        reminders, setReminders, takenLogs, setTakenLogs,
        isManageOpen, setIsManageOpen,
        newMedName, setNewMedName, newDosage, setNewDosage, newPeriod, setNewPeriod,
        showCelebration, setShowCelebration,
        showReminderPopup, setShowReminderPopup,
        isTestMode, setIsTestMode, mockTaken, setMockTaken,
        getTodayStr, todayStr, currentPeriod, setCurrentPeriod,
        selectedPeriod, setSelectedPeriod, speakReminder, periodConfigs,
        activeReminders, todayReminders, getTakenKey, takenCount, totalCount,
        toggleTaken, handlePopupToggleTaken, handleTakeAll, handleImportMeds,
        handleAddReminder, handleDeleteReminder, toggleActive,
        groupedReminders, currentPeriodUnfinished, HK_COMMON_MEDS,
    } = vm;
    return (
        <>
            {/* 慶祝全服藥完成特效 */}
            {showCelebration && (
                <div className="bg-emerald-500 text-white p-2 px-3 rounded-xl shadow-xs text-center animate-bounce space-y-0.5">
                    <p className="font-black text-[11px]">🎉 非常棒！今日所需藥物已全部服妥！</p>
                    <p className="text-[9px] font-extrabold opacity-95">積極配合醫生用藥，守護健康！</p>
                </div>
            )}
        </>
    );
}
