import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from HbA1cTab (lines 162-232); JSX copied verbatim.
export function HbA1cRecordList({vm}: {vm: GlucoseViewModel}) {
    const {
        hba1cRecords,
        isHba1cRecentRecordsVisible,
        isLargeFont,
        setHba1cRecords,
        setIsHba1cRecentRecordsVisible
    } = vm;

    return (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🧬</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    最近 HbA1c 紀錄報告
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    (共 {hba1cRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsHba1cRecentRecordsVisible(!isHba1cRecentRecordsVisible)}
                                    className="ml-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                    {isHba1cRecentRecordsVisible ? '收起隱藏 ▲' : '展開顯示 ▼'}
                                </button>
                            </div>
                        </div>

                        {isHba1cRecentRecordsVisible && (
                            <div className="space-y-3 animate-soft">
                                {hba1cRecords.length === 0 ? (
                                    <div className={`bg-white rounded-3xl text-center border-2 border-dashed border-slate-100 ${isLargeFont ? 'py-16 space-y-3 animate-soft' : 'py-12 space-y-2'}`}>
                                        <p className="text-3xl">🧬</p>
                                        <p className={`font-extrabold text-slate-400 ${isLargeFont ? 'text-base' : 'text-sm'}`}>暫無歷史 HbA1c 紀錄數據</p>
                                    </div>
                                ) : (
                                    hba1cRecords.map(r => {
                                        const val = parseFloat(r.value);
                                        let statusColor = 'bg-emerald-400';
                                        if (val >= 8.0) {
                                            statusColor = 'bg-rose-400';
                                        } else if (val >= 7.0) {
                                            statusColor = 'bg-amber-400';
                                        }

                                        return (
                                            <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-6'}`}>
                                                <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-6'}`}>
                                                    <div className={`rounded-full opacity-70 ${statusColor} ${isLargeFont ? 'w-5 h-20' : 'w-3.5 h-12'}`}></div>
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-baseline gap-2">
                                                            <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-5xl' : 'text-3xl'}`}>{r.value}</p>
                                                            <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>%</span>
                                                            {val >= 8.0 ? (
                                                                <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>控制不理想</span>
                                                            ) : val >= 7.0 ? (
                                                                <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>偏高 需注意</span>
                                                            ) : (
                                                                <span className={`font-black bg-emerald-50 text-emerald-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>控制理想</span>
                                                            )}
                                                        </div>
                                                        <p className={`text-slate-400 font-extrabold uppercase tracking-wide ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                            📅 檢查日期: {r.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setHba1cRecords(hba1cRecords.filter(rec => rec.id !== r.id))}
                                                    className={`rounded-full flex items-center justify-center text-slate-305 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-10 h-10 text-3xl'}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
    );
}
