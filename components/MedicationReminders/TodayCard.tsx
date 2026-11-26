import type { MedicationRemindersViewModel } from './useMedicationReminders';

export function TodayCard({vm}: {vm: MedicationRemindersViewModel}) {
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
            {/* 2. 主卡片：今日用藥守護 */}
            <div 
                id="med-timeline-anchor"
                className="bg-white rounded-xl p-2.5 border border-slate-100/80 shadow-xs space-y-1.5"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm shrink-0">⏰</span>
                        <div className="min-w-0">
                            <h3 className={`font-black text-slate-800 flex items-center gap-1 truncate ${isLargeFont ? 'text-sm' : 'text-[11px] sm:text-xs'}`}>
                                今日用藥守護
                                {totalCount > 0 && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full font-black shrink-0 border border-emerald-100">
                                        {takenCount}/{totalCount}服
                                    </span>
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* 🔔 測試提醒彈窗 */}
                        <button
                            onClick={() => {
                                setIsTestMode(true);
                                setShowReminderPopup(true);
                            }}
                            className={`font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-lg active:scale-[0.97] transition-all cursor-pointer flex items-center gap-0.5 shrink-0 ${
                                isLargeFont ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'
                            }`}
                        >
                            <span>🔔</span> 測試提醒
                        </button>

                        {/* 管理按鈕 */}
                        <button
                            onClick={() => setIsManageOpen(true)}
                            className={`font-black text-[#4A6E85] bg-[#4A6E85]/10 hover:bg-[#4A6E85]/15 border border-[#4A6E85]/20 rounded-lg active:scale-[0.97] transition-all cursor-pointer flex items-center gap-0.5 shrink-0 ${
                                isLargeFont ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'
                            }`}
                        >
                            <span>⚙️</span> 設定
                        </button>
                    </div>
                </div>

                {/* 輕量極簡微進度條 */}
                {totalCount > 0 && (
                    <div className="w-full bg-slate-100 h-0.5 rounded-full overflow-hidden shrink-0">
                        <div 
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500"
                            style={{ width: `${(takenCount / totalCount) * 100}%` }}
                        />
                    </div>
                )}

                {/* 極致緊湊四時段 Tab 切換列 */}
                {totalCount > 0 && (
                    <div className="grid grid-cols-4 gap-0.5 bg-slate-100/60 p-0.5 rounded-lg">
                        {(['morning', 'noon', 'evening', 'bedtime'] as const).map(pKey => {
                            const pConfig = periodConfigs[pKey];
                            const isSelected = selectedPeriod === pKey;
                            const isCurrent = currentPeriod === pKey;
                            const pMeds = todayReminders.filter(r => r.period === pKey);
                            const pTotal = pMeds.length;
                            const pTaken = pMeds.filter(r => takenLogs[getTakenKey(r.id)]).length;

                            let statusDot = null;
                            if (pTotal > 0) {
                                if (pTaken === pTotal) {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />;
                                } else if (isCurrent) {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shrink-0" />;
                                } else {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />;
                                }
                            }

                            return (
                                <button
                                    key={pKey}
                                    type="button"
                                    onClick={() => setSelectedPeriod(pKey)}
                                    className={`flex items-center justify-center gap-0.5 py-0.5 rounded transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-white text-[#4A6E85] shadow-xs font-black' 
                                            : 'text-slate-500 hover:bg-white/30 font-extrabold'
                                    }`}
                                >
                                    <span className="text-xs leading-none">{pConfig.icon}</span>
                                    <span className="text-[9px] tracking-tight">
                                        {pKey === 'morning' ? '晨' : pKey === 'noon' ? '午' : pKey === 'evening' ? '晚' : '睡'}
                                    </span>
                                    {statusDot}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 選中時段的服藥細項列表 */}
                <div className="mt-0.5">
                    {totalCount === 0 ? (
                        <div className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200/50">
                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <span>💊</span> 暫無啟用中的用藥提醒
                            </p>
                            <button
                                onClick={() => setIsManageOpen(true)}
                                className="text-[9px] font-black text-[#4A6E85] hover:underline cursor-pointer bg-[#4A6E85]/5 px-2 py-0.5 rounded border border-[#4A6E85]/10"
                            >
                                點此新增
                            </button>
                        </div>
                    ) : (
                        (() => {
                            const pMeds = todayReminders.filter(r => r.period === selectedPeriod);
                            const pConfig = periodConfigs[selectedPeriod];

                            return (
                                <div className="space-y-1">
                                    {/* 緊湊服藥清單 */}
                                    {pMeds.length === 0 ? (
                                        <div className="text-center py-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold">
                                                🍀 此時段無登錄之藥物。
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {pMeds.map(med => {
                                                const isTaken = !!takenLogs[getTakenKey(med.id)];
                                                return (
                                                    <div 
                                                        key={med.id}
                                                        className={`flex items-center justify-between gap-2 p-1 px-2 rounded-lg border transition-all ${
                                                            isTaken 
                                                                ? 'bg-emerald-50/40 border-emerald-100/50 text-emerald-950' 
                                                                : 'bg-slate-50/40 border-slate-100/50 text-slate-800'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-grow">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] shrink-0">💊</span>
                                                                <p className={`font-black text-[10px] sm:text-[11px] truncate ${isTaken ? 'line-through text-slate-400' : ''}`}>
                                                                    {med.name}
                                                                </p>
                                                            </div>
                                                            <p className={`text-[8px] pl-3.5 font-extrabold ${isTaken ? 'text-slate-400' : 'text-slate-400'}`}>
                                                                劑量: {med.dosage}
                                                            </p>
                                                        </div>
                                                        {/* 登記按鈕 */}
                                                        <button
                                                            onClick={() => toggleTaken(med.id)}
                                                            className={`flex items-center gap-0.5 py-0.5 px-1.5 rounded text-[9px] font-black cursor-pointer active:scale-95 transition-all shrink-0 ${
                                                                isTaken
                                                                    ? 'bg-emerald-500 text-white shadow-xs'
                                                                    : 'bg-[#4A6E85]/10 text-[#4A6E85] border border-[#4A6E85]/20 hover:bg-[#4A6E85]/15'
                                                            }`}
                                                        >
                                                            <span>{isTaken ? '🟢 已服' : '⚪ 登記'}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>

        </>
    );
}
