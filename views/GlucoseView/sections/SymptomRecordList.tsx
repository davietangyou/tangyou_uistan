import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from SymptomTab (lines 634-776); JSX copied verbatim.
export function SymptomRecordList({vm}: {vm: GlucoseViewModel}) {
    const {
        filteredSymptomGlucoseRecords,
        glucoseRecords,
        isLargeFont,
        isSymptomRecentRecordsVisible,
        selectedSymptomFilter,
        setGlucoseRecords,
        setIsSymptomRecentRecordsVisible,
        setSelectedSymptomFilter,
        symptomRangeTimeBounds
    } = vm;

    return (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base">📋</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    {selectedSymptomFilter 
                                        ? `已篩選症狀：「${selectedSymptomFilter}」的歷史紀錄` 
                                        : `最近紀錄報告`}
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    ({symptomRangeTimeBounds.label} • 共 {filteredSymptomGlucoseRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsSymptomRecentRecordsVisible(!isSymptomRecentRecordsVisible)}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                    {isSymptomRecentRecordsVisible ? '收起詳細紀錄 ▲' : '下拉查看詳細紀錄 ▼'}
                                </button>
                            </div>
                            {selectedSymptomFilter && (
                                <button
                                    onClick={() => setSelectedSymptomFilter(null)}
                                    className={`text-rose-500 hover:underline font-black cursor-pointer ${isLargeFont ? 'text-sm' : 'text-xs'}`}
                                >
                                    清除症狀篩選 ✕
                                </button>
                            )}
                        </div>

                        {/* 僅在下拉展開時顯示詳細紀錄內容 */}
                        {isSymptomRecentRecordsVisible ? (
                            <div className="space-y-4 animate-soft">
                                {(() => {
                                    const baseList = filteredSymptomGlucoseRecords;
                                    const filteredRecords = selectedSymptomFilter 
                                        ? baseList.filter(r => r.symptoms && r.symptoms.includes(selectedSymptomFilter))
                                        : baseList;

                                    if (filteredRecords.length === 0) {
                                        return (
                                            <div className={`bg-white rounded-3xl text-center border-2 border-slate-100 ${isLargeFont ? 'py-16 space-y-4' : 'py-12 space-y-2'}`}>
                                                <p className="text-3xl">🧩</p>
                                                <p className={`text-slate-400 font-extrabold ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                                    {selectedSymptomFilter 
                                                        ? `在「${symptomRangeTimeBounds.label}」內查無與「${selectedSymptomFilter}」相關的紀錄`
                                                        : `在「${symptomRangeTimeBounds.label}」內暫無歷史紀錄`}
                                                </p>
                                                {selectedSymptomFilter && (
                                                    <button
                                                        onClick={() => setSelectedSymptomFilter(null)}
                                                        className={`text-rose-500 hover:underline font-black cursor-pointer ${isLargeFont ? 'text-base' : 'text-xs'}`}
                                                    >
                                                        查看該時段全部紀錄
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }

                                    return filteredRecords.map(r => {
                                        const hasValue = r.value !== undefined && r.value !== '';
                                        const val = hasValue ? parseFloat(r.value) : NaN;
                                        const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
                                        
                                        let statusColor = 'bg-emerald-400';

                                        if (!hasValue) {
                                            statusColor = 'bg-rose-450';
                                        } else if (val < 4.0) {
                                            statusColor = 'bg-amber-400';
                                        } else if (isFasting && val > 7.0) {
                                            statusColor = 'bg-rose-400';
                                        } else if (!isFasting && val > 10.0) {
                                            statusColor = 'bg-rose-400';
                                        }

                                        return (
                                            <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-6'}`}>
                                                <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-6'}`}>
                                                    <div className={`rounded-full opacity-70 ${isLargeFont ? 'w-5 h-24' : 'w-3.5 h-16'} ${statusColor}`}></div>
                                                    <div className="space-y-1">
                                                        {hasValue ? (
                                                            <div className="flex flex-wrap items-baseline gap-2">
                                                                <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-6xl' : 'text-4xl'}`}>{r.value}</p>
                                                                <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>mmol/L</span>
                                                                {val < 4.0 && (
                                                                    <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>低血糖風險</span>
                                                                )}
                                                                {(isFasting && val > 7.0) || (!isFasting && val > 10.0) ? (
                                                                    <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>血糖偏高</span>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-black text-rose-500 flex items-center gap-1.5 bg-rose-50/50 rounded-2xl border border-rose-100 ${isLargeFont ? 'text-xl px-5 py-3' : 'text-base px-3.5 py-1.5'}`}>
                                                                    🤒 身體症狀紀錄
                                                                </span>
                                                            </div>
                                                        )}
                                                        
                                                        {r.symptoms && r.symptoms.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2 max-w-xs sm:max-w-md">
                                                                {r.symptoms.map((sym, index) => (
                                                                    <span key={index} className={`font-black bg-rose-50 text-rose-600 border border-rose-100 rounded-full whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-2' : 'text-xs px-2.5 py-1'}`}>
                                                                        {sym}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <p className={`text-slate-400 font-extrabold uppercase tracking-wide mt-1.5 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                            【{r.timeType}】 {r.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id))}
                                                    className={`rounded-full flex items-center justify-center text-slate-305 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-10 h-10 text-3xl'}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsSymptomRecentRecordsVisible(true)}
                                className="p-5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center cursor-pointer transition-all space-y-1.5 shadow-xs group"
                            >
                                <p className="text-xs sm:text-sm font-black text-slate-600 flex items-center justify-center gap-2 group-hover:text-[#4A6E85]">
                                    <span>📑</span>
                                    <span>點擊下拉展開查看 <strong>{symptomRangeTimeBounds.label}</strong> 的詳細測量與症狀紀錄 (共 {filteredSymptomGlucoseRecords.length} 筆)</span>
                                    <span className="text-rose-500 font-black transition-transform group-hover:translate-y-0.5">▼</span>
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    預設收起詳細紀錄，點擊此處或上方按鈕即可展開查看
                                </p>
                            </div>
                        )}
                    </div>
    );
}
