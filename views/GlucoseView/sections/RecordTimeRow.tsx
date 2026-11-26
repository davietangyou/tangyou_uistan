import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from BloodGlucoseTab/SymptomTab (lines 85-151 / 66-132); JSX copied verbatim.
export function RecordTimeRow({vm, label}: {vm: GlucoseViewModel; label: string}) {
    const {
        formattedTime,
        handleSetTime,
        isLargeFont,
        isLiveTime,
        isTimePickerOpen,
        setIsTimePickerOpen
    } = vm;

    return (
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⏱️</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                            {label}
                                        </span>
                                        {isLiveTime ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                即時
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                ✏️ 補選時間
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-200 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span className="truncate max-w-[170px] sm:max-w-none">
                                        {formattedTime.zh}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {isTimePickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時間挑選面板 */}
                            {isTimePickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3 animate-soft">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="datetime-local"
                                            value={formattedTime.isoForPicker}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleSetTime(new Date(e.target.value), false);
                                                }
                                            }}
                                            className="w-full sm:w-auto flex-grow bg-white border-2 border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-inner"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSetTime(new Date(), true);
                                                setIsTimePickerOpen(false);
                                            }}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                                                isLiveTime 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            設為現在時間
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
    );
}
