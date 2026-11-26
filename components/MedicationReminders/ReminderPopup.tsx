import { motion, AnimatePresence } from 'motion/react';
import type { MedicationRemindersViewModel } from './useMedicationReminders';

export function ReminderPopup({vm}: {vm: MedicationRemindersViewModel}) {
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
            {/* 4. 溫馨用藥提醒互動彈窗 */}
            <AnimatePresence>
                {showReminderPopup && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* 彈窗頭部：溫暖和煦的配色，凸顯健康守護 */}
                            <div className="bg-gradient-to-r from-[#4A6E85] to-[#7FA0B4] p-5 sm:p-6 text-white shrink-0 relative">
                                <div className="absolute right-4 top-4">
                                    <button
                                        onClick={() => setShowReminderPopup(false)}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl animate-bounce">⏰</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {periodConfigs[currentPeriod].icon} {periodConfigs[currentPeriod].label}
                                            </span>
                                            {isTestMode && (
                                                <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                                                    🛠️ 模擬測試中
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-lg sm:text-xl mt-1.5">老友記，吃藥時間到啦！</h3>
                                    </div>
                                </div>
                            </div>

                            {/* 溫馨提示卡片 */}
                            <div className="px-5 py-4 sm:px-6 bg-orange-50/50 border-b border-orange-100 flex items-start gap-2.5 shrink-0">
                                <span className="text-lg">❤️</span>
                                <div className="space-y-1">
                                    <p className="text-xs sm:text-sm font-bold text-orange-900 leading-relaxed">
                                        適時用藥可以更穩定控制血糖。請記得準備一杯溫開水，不要空腹服藥（除非醫生另有指示）喔！
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const meds = (isTestMode && reminders.filter(r => r.active && r.period === currentPeriod).length === 0)
                                                    ? ['美獲平 Metformin', '達美康 Diamicron']
                                                    : reminders.filter(r => r.active && r.period === currentPeriod).map(r => r.name);
                                                const names = meds.join('、');
                                                speakReminder(`老友記，現在是${periodConfigs[currentPeriod].label}。您需要服用：${names || '您設定的藥物'}。記得用溫水送服。`);
                                            }}
                                            className="text-[10px] font-black text-[#4A6E85] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            🔊 廣東話念讀藥單
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 待服藥物清單 */}
                            <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-4">
                                {(() => {
                                    const meds = (isTestMode && reminders.filter(r => r.active && r.period === currentPeriod).length === 0)
                                        ? [
                                            { id: 'mock_1', name: '美獲平 Metformin (二甲雙胍)', dosage: '500mg (1粒)', period: currentPeriod, active: true },
                                            { id: 'mock_2', name: '達美康 Diamicron (格列齊特)', dosage: '80mg (1粒)', period: currentPeriod, active: true }
                                          ]
                                        : reminders.filter(r => r.active && r.period === currentPeriod);

                                    if (meds.length === 0) {
                                        return (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-3xl block mb-2">🍀</span>
                                                <p className="text-sm text-slate-500 font-extrabold">此時段沒有安排服用藥物。</p>
                                                <p className="text-xs text-slate-400 font-bold mt-1">您可以點擊「設定」新增在此時段服用的藥物。</p>
                                            </div>
                                        );
                                    }

                                    const allFinished = meds.every(m => {
                                        const isMock = m.id.startsWith('mock_');
                                        return isMock ? !!mockTaken[m.id] : !!takenLogs[getTakenKey(m.id)];
                                    });

                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs text-slate-400 font-black px-1">
                                                <span>💊 應服藥物 ({meds.length})</span>
                                                <span>狀態</span>
                                            </div>

                                            {meds.map(med => {
                                                const isMock = med.id.startsWith('mock_');
                                                const isTaken = isMock ? !!mockTaken[med.id] : !!takenLogs[getTakenKey(med.id)];

                                                return (
                                                    <div
                                                        key={med.id}
                                                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                            isTaken
                                                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-inner'
                                                                : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {isTaken ? (
                                                                    <span className="text-emerald-600 text-sm">✅</span>
                                                                ) : (
                                                                    <span className="text-rose-500 text-sm animate-pulse">💊</span>
                                                                )}
                                                                <h4 className={`font-black truncate ${isTaken ? 'line-through text-slate-400' : 'text-slate-800'} ${isLargeFont ? 'text-base' : 'text-sm sm:text-base'}`}>
                                                                    {med.name}
                                                                </h4>
                                                            </div>
                                                            <p className={`text-xs pl-5 font-black mt-0.5 ${isTaken ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                服用劑量：{med.dosage}
                                                            </p>
                                                        </div>

                                                        {/* 獨立已服藥按鈕 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePopupToggleTaken(med.id, isMock)}
                                                            className={`px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                                                isTaken
                                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                    : 'bg-[#4A6E85] text-white hover:bg-[#3D5B70]'
                                                            }`}
                                                        >
                                                            {isTaken ? '🟢 已服藥' : '⚪ 登記服藥'}
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {/* 一鍵全部服藥按鈕 */}
                                            {!allFinished && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTakeAll(meds)}
                                                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    <span>✨</span> 我已吃完本時段所有藥物
                                                </button>
                                            )}

                                            {allFinished && (
                                                <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1 mt-3">
                                                    <p className="font-black text-emerald-800 text-sm">🎉 恭喜！本時段所需藥物已全部服妥！</p>
                                                    <p className="text-xs text-emerald-600 font-extrabold">積極配合醫生用藥，血糖守護更安心！</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* 底部按鈕 */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        speakReminder("稍後會再次提醒您服藥，請保重身體喔！");
                                        setShowReminderPopup(false);
                                    }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs sm:text-sm py-3 rounded-2xl transition-all cursor-pointer text-center"
                                >
                                    稍後提醒我 ⏰
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReminderPopup(false)}
                                    className="flex-1 bg-[#4A6E85] hover:bg-[#3D5B70] text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md transition-all cursor-pointer text-center"
                                >
                                    我知道了 👍
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
