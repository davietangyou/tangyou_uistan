import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from HbA1cTab (lines 29-117); JSX copied verbatim.
export function HbA1cEntryForm({vm}: {vm: GlucoseViewModel}) {
    const {
        addHbA1cRecord,
        isLargeFont,
        newHbA1c,
        setNewHbA1c
    } = vm;

    return (
                    <div className="premium-card bg-white border border-slate-200/60 p-4 sm:p-6 rounded-3xl space-y-5">
                        <div className="space-y-4">
                            <h3 className={`font-black text-[#4A6E85] text-center ${isLargeFont ? 'text-xl' : 'text-base'}`}>🧬 紀錄糖化血紅素 (HbA1c) 數值</h3>
                            
                            <div className="max-w-[180px] mx-auto relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    inputMode="decimal"
                                    className={`w-full bg-slate-50 border-2 border-[#7FA0B4]/30 text-center focus:border-[#7FA0B4] focus:bg-white outline-none transition-all shadow-sm text-[#4A6E85] font-black rounded-2xl p-4 ${
                                        isLargeFont ? 'text-5xl' : 'text-4xl'
                                    }`}
                                    placeholder="6.0"
                                    value={newHbA1c.value}
                                    onChange={e => setNewHbA1c({...newHbA1c, value: e.target.value})}
                                />
                                <span className={`absolute text-slate-400 font-black pointer-events-none ${isLargeFont ? 'right-5 bottom-4 text-sm' : 'right-4 bottom-3 text-xs'}`}>%</span>
                            </div>

                            {/* Medical Advice Banner based on HbA1c */}
                            {newHbA1c.value && !isNaN(parseFloat(newHbA1c.value)) && (() => {
                                const val = parseFloat(newHbA1c.value);
                                if (val < 6.0) {
                                    return (
                                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2 text-emerald-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">💚</span>
                                            <p className="font-bold text-xs text-emerald-800">
                                                太棒了！糖化血紅素控制在非糖尿病/非常理想的範圍。
                                            </p>
                                        </div>
                                    );
                                } else if (val < 7.0) {
                                    return (
                                        <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 flex items-center gap-2 text-blue-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">👍</span>
                                            <p className="font-bold text-xs text-blue-800">
                                                控制滿意！一般長者糖化血紅素控制在 7.0% 以下為良好。
                                            </p>
                                        </div>
                                    );
                                } else if (val < 8.0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">⚠️</span>
                                            <p className="font-bold text-xs text-amber-800 text-left">
                                                控制尚可。部分高齡或有併發症長者目標可放寬至 8.0% 以下，請遵循醫囑。
                                            </p>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-xl">🚨</span>
                                            <div className="text-xs text-left">
                                                <p className="font-black text-rose-850">數值偏高 ({val}%)</p>
                                                <p className="font-bold text-rose-700">糖化血紅素較高，請配合醫生調整藥物與飲食方案噢。</p>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            <div className="max-w-md mx-auto w-full space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400">📅 選擇檢查/抽血日期：</label>
                                    <input 
                                        type="date"
                                        className={`w-full bg-slate-50 border border-slate-200 font-bold text-slate-600 focus:outline-none focus:border-[#7FA0B4] py-2 px-3 rounded-xl text-sm ${isLargeFont ? 'py-3' : ''}`}
                                        value={newHbA1c.date}
                                        onChange={e => setNewHbA1c({...newHbA1c, date: e.target.value})}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => {
                                            if (newHbA1c.value) {
                                                addHbA1cRecord();
                                            }
                                        }}
                                        disabled={!newHbA1c.value}
                                        className={`w-full bg-[#7FA0B4] text-white font-black shadow-md hover:bg-[#6c91a7] active:scale-95 transition-all cursor-pointer py-3 rounded-xl text-base disabled:opacity-40`}
                                    >
                                        💾 儲存糖化血紅素
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    );
}
