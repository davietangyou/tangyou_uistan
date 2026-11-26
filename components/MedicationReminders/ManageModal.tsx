import type { MedicationRemindersViewModel } from './useMedicationReminders';

export function ManageModal({vm}: {vm: MedicationRemindersViewModel}) {
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
            {/* 3. 設定與管理對話框 Overlay / Modal */}
            {isManageOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8">
                        
                        {/* 對話框頭部 */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5">
                                    <span>⚙️</span> 設定您的用藥提醒
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold">管理服藥方案，預防忘記服藥</p>
                            </div>
                            <button
                                onClick={() => setIsManageOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 對話框主內容 */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-grow">
                            
                            {/* 一鍵匯入區 */}
                            <div className="bg-gradient-to-r from-[#E8DED2]/20 to-orange-50/20 p-4 rounded-2xl border border-orange-200/40 space-y-2">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>📥</span> 一鍵匯入健康資料
                                </h4>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    AI 能讀取您在「個人設定」中登記服用之專科藥物，並自動建立每天提醒。
                                </p>
                                <button
                                    type="button"
                                    onClick={handleImportMeds}
                                    className="w-full bg-[#4A6E85] hover:bg-[#3d5b70] text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center"
                                >
                                    📥 匯入個人已登記藥物
                                </button>
                            </div>

                            {/* 手動新增表單 */}
                            <form onSubmit={handleAddReminder} className="space-y-3.5 border-t border-slate-100 pt-4">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>➕</span> 手動新增提醒項目
                                </h4>

                                <div className="space-y-2">
                                    {/* 快速選藥 dropdown */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 block mb-1">快速選藥 (可在此直接選擇香港常用藥物)：</label>
                                        <select
                                            className="w-full bg-slate-50 p-2.5 rounded-xl font-extrabold text-xs text-slate-700 outline-none border border-slate-200 cursor-pointer"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const selected = HK_COMMON_MEDS.find(m => m.name === e.target.value);
                                                if (selected) {
                                                    setNewMedName(selected.name);
                                                    setNewDosage(selected.dosage);
                                                    setNewPeriod(selected.period);
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">-- 點此選擇常用藥物 --</option>
                                            {HK_COMMON_MEDS.map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 藥物名稱輸入 */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 block mb-1">藥物名稱 (可自行手動修改)：</label>
                                        <input
                                            type="text"
                                            placeholder="請輸入藥物名稱，如：美獲平 Metformin"
                                            required
                                            value={newMedName}
                                            onChange={(e) => setNewMedName(e.target.value)}
                                            className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-[#4A6E85]/50 focus:bg-white"
                                        />
                                    </div>

                                    {/* 劑量與時段二合一 */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1">劑量：</label>
                                            <input
                                                type="text"
                                                placeholder="如：500mg, 1粒"
                                                value={newDosage}
                                                onChange={(e) => setNewDosage(e.target.value)}
                                                className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-[#4A6E85]/50 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1">服用時段：</label>
                                            <select
                                                value={newPeriod}
                                                onChange={(e: any) => setNewPeriod(e.target.value)}
                                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold text-xs text-slate-700 outline-none border border-slate-200 cursor-pointer"
                                            >
                                                <option value="morning">🌄 早上/早餐後</option>
                                                <option value="noon">☀️ 中午/午餐後</option>
                                                <option value="evening">🌆 晚上/晚餐後</option>
                                                <option value="bedtime">🌙 睡前</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center"
                                >
                                    ＋ 登記此用藥提醒
                                </button>
                            </form>

                            {/* 目前提醒列表與管理 */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>📋</span> 目前提醒清單 ({reminders.length})
                                </h4>

                                {reminders.length === 0 ? (
                                    <p className="text-center py-4 text-slate-400 font-bold text-xs">暫無設定之用藥清單。</p>
                                ) : (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {reminders.map(rem => (
                                            <div 
                                                key={rem.id} 
                                                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                                                    rem.active 
                                                        ? 'bg-slate-50 border-slate-200/60' 
                                                        : 'bg-slate-100/50 border-slate-200/30 opacity-60'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-grow">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">{periodConfigs[rem.period].icon}</span>
                                                        <p className="font-extrabold text-xs text-slate-800 truncate">{rem.name}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-extrabold pl-4">
                                                        劑量: {rem.dosage} • 時段: {periodConfigs[rem.period].label}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* 開關 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(rem.id)}
                                                        className={`text-[10px] font-black px-2 py-1 rounded-lg border cursor-pointer active:scale-95 transition-all ${
                                                            rem.active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                                                : 'bg-slate-200 text-slate-500 border-slate-300/40'
                                                        }`}
                                                    >
                                                        {rem.active ? '啟用中' : '已關閉'}
                                                    </button>
                                                    {/* 刪除 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReminder(rem.id)}
                                                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 底部關閉 */}
                        <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl">
                            <button
                                type="button"
                                onClick={() => setIsManageOpen(false)}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs py-3 rounded-xl transition-all text-center cursor-pointer"
                            >
                                完成設定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
