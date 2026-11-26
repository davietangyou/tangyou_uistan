import type { MedicationRemindersViewModel } from './useMedicationReminders';

export function MissedDoseBanner({vm}: {vm: MedicationRemindersViewModel}) {
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
            {/* 1. 頂部懸浮/醒目未服藥橫幅：如果當前時段有藥未吃，進行溫馨提醒 */}
            {currentPeriodUnfinished.length > 0 && (
                <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-2 px-3 rounded-xl shadow-xs animate-pulse flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">⏰</span>
                        <div className="min-w-0">
                            <p className="font-black text-[11px] leading-tight">吃藥時間到啦！</p>
                            <p className="text-[9px] opacity-95 font-extrabold truncate">
                                【{periodConfigs[currentPeriod].label}】有 {currentPeriodUnfinished.length} 種藥物待服
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const element = document.getElementById('med-timeline-anchor');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        className="bg-white text-rose-600 px-2 py-0.5 rounded-lg font-black text-[10px] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                        立即登記
                    </button>
                </div>
            )}
        </>
    );
}
