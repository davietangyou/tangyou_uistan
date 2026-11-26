import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from BloodGlucoseTab (lines 907-1143); JSX copied verbatim.
export function GlucoseRecordList({vm}: {vm: GlucoseViewModel}) {
    const {
        abnormalRecordsCount,
        filteredRecentRecords,
        glucoseRecords,
        isLargeFont,
        isRecentRecordsVisible,
        isRecordsExpanded,
        recordFilter,
        setGlucoseRecords,
        setIsRecentRecordsVisible,
        setIsRecordsExpanded,
        setRecordFilter,
        visibleRecords
    } = vm;

    return (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">📋</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    最近紀錄報告
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    (共 {glucoseRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsRecentRecordsVisible(!isRecentRecordsVisible)}
                                    className="ml-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                    {isRecentRecordsVisible ? '收起隱藏 ▲' : '展開顯示 ▼'}
                                </button>
                            </div>

                            {/* 💡 異常數值快速篩選標籤 */}
                            {isRecentRecordsVisible && (
                                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('ALL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            recordFilter === 'ALL'
                                                ? 'bg-white text-slate-800 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        全部 ({glucoseRecords.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('ABNORMAL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                            recordFilter === 'ABNORMAL'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-rose-600 hover:bg-rose-50'
                                        }`}
                                    >
                                        <span>⚠️ 僅看異常</span>
                                        {abnormalRecordsCount > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                recordFilter === 'ABNORMAL' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {abnormalRecordsCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('NORMAL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            recordFilter === 'NORMAL'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-emerald-700 hover:bg-emerald-50'
                                        }`}
                                    >
                                        🟢 僅看正常
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 記錄卡片列表 */}
                        {isRecentRecordsVisible && (
                            visibleRecords.length > 0 ? (
                                <div className="space-y-3">
                                {visibleRecords.map(r => {
                                    const hasValue = r.value !== undefined && r.value !== '';
                                    const val = hasValue ? parseFloat(r.value) : NaN;
                                    const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
                                    
                                    let statusColor = 'bg-emerald-400';

                                    if (!hasValue) {
                                        statusColor = 'bg-[#7FA0B4]';
                                    } else if (val < 4.0) {
                                        statusColor = 'bg-amber-400';
                                    } else if (isFasting && val > 7.0) {
                                        statusColor = 'bg-rose-400';
                                    } else if (!isFasting && val > 10.0) {
                                        statusColor = 'bg-rose-400';
                                    }

                                    return (
                                        <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-5 sm:p-6'}`}>
                                            <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-5'}`}>
                                                <div className={`rounded-full opacity-70 ${isLargeFont ? 'w-5 h-24' : 'w-3 h-14'} ${statusColor}`}></div>
                                                <div className="space-y-1">
                                                    {hasValue ? (
                                                        <div className="flex flex-wrap items-baseline gap-2">
                                                            <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-6xl' : 'text-3xl sm:text-4xl'}`}>{r.value}</p>
                                                            <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-xs sm:text-sm'}`}>mmol/L</span>
                                                            {val < 4.0 && (
                                                                <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>低血糖風險</span>
                                                            )}
                                                            {(isFasting && val > 7.0) || (!isFasting && val > 10.0) ? (
                                                                <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>血糖偏高</span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-black text-[#4A6E85] flex items-center gap-1.5 bg-slate-50 rounded-2xl border border-slate-100 ${isLargeFont ? 'text-xl px-5 py-3' : 'text-base px-3.5 py-1.5'}`}>
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

                                                    <p className={`text-slate-400 font-extrabold uppercase tracking-wide mt-1 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                        【{r.mealTag ? `${r.mealTag} • ${r.timeType}` : r.timeType}】 {r.date}
                                                    </p>

                                                    {/* 📋 飲食、運動、症狀、用藥、血壓等詳細情境顯示 */}
                                                    {(r.dietNote || r.exerciseNote || r.illnessNote || r.medicationNote || r.bpSystolic || r.bpDiastolic || r.pulse || r.weight || r.mood) && (
                                                        <div className="mt-2.5 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-[11px] font-extrabold text-slate-600 max-w-xs sm:max-w-md">
                                                            {r.dietNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🍕 飲食:</span>
                                                                    <span className="text-slate-700 font-black">{r.dietNote}</span>
                                                                </div>
                                                            )}
                                                            {r.exerciseNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🏃 運動:</span>
                                                                    <span className="text-slate-700 font-black">{r.exerciseNote}</span>
                                                                </div>
                                                            )}
                                                            {r.illnessNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🤒 狀況:</span>
                                                                    <span className="text-slate-700 font-black">{r.illnessNote}</span>
                                                                </div>
                                                            )}
                                                            {r.medicationNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-amber-500">💊 用藥:</span>
                                                                    <span className="text-slate-700 font-black">{r.medicationNote}</span>
                                                                </div>
                                                            )}
                                                            {(r.bpSystolic || r.bpDiastolic || r.pulse) && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-indigo-500">❤️ 血壓:</span>
                                                                    <span className="text-slate-700 font-black">
                                                                        {r.bpSystolic || '--'}/{r.bpDiastolic || '--'} mmHg {r.pulse ? `(心率 ${r.pulse} bpm)` : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {r.weight && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-teal-600">⚖️ 體重:</span>
                                                                    <span className="text-slate-700 font-black">{r.weight} kg</span>
                                                                </div>
                                                            )}
                                                            {r.mood && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-amber-500">😊 心情:</span>
                                                                    <span className="text-slate-700 font-black">{r.mood}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id))}
                                                className={`rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-9 h-9 text-2xl'}`}
                                                title="刪除紀錄"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* 💡 展開更多 / 收起紀錄 按鈕 */}
                                {filteredRecentRecords.length > 6 && (
                                    <div className="pt-2 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsRecordsExpanded(!isRecordsExpanded)}
                                            className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                                        >
                                            {isRecordsExpanded ? (
                                                <>
                                                    <span>▲ 收起記錄</span>
                                                    <span className="text-slate-400 text-xs font-normal">（僅看最近 6 筆）</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>▼ 展開更多紀錄</span>
                                                    <span className="text-[#4A6E85] font-black">（共 {filteredRecentRecords.length} 筆，還有 {filteredRecentRecords.length - 6} 筆）</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                                <span className="text-2xl">🎉</span>
                                <p className="text-slate-600 font-black text-sm">
                                    {recordFilter === 'ABNORMAL' ? '無異常數值記錄，血糖控制得非常平穩！' : '暫無相關記錄'}
                                </p>
                                {recordFilter !== 'ALL' && (
                                    <button
                                        type="button"
                                        onClick={() => setRecordFilter('ALL')}
                                        className="text-xs text-[#4A6E85] font-black underline cursor-pointer"
                                    >
                                        查看全部紀錄
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
    );
}
