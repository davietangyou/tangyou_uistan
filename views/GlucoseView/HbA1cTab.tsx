import type {GlucoseViewModel} from './useGlucoseViewModel';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export function HbA1cTab({vm}: {vm: GlucoseViewModel}) {
    const {
        addHbA1cRecord,
        chartData,
        hba1cRecords,
        isHba1cRecentRecordsVisible,
        isLargeFont,
        newHbA1c,
        setHba1cRecords,
        setIsHba1cRecentRecordsVisible,
        setNewHbA1c
    } = vm;

    return (
                <div className="space-y-6 animate-soft">
                    {/* 輸入檢查結果 */}
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

                    {/* HbA1c 視圖：柔和科學藍系 (Trend/Chart) */}
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-8' : 'p-8 space-y-6'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`bg-[#7FA0B4]/10 rounded-2xl flex items-center justify-center ${isLargeFont ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'}`}>
                                📈
                            </div>
                            <div>
                                <h2 className={`font-black text-[#4A6E85] ${isLargeFont ? 'text-2xl' : 'text-xl'}`}>糖化血紅素趨勢</h2>
                                <p className={`font-medium text-slate-400 ${isLargeFont ? 'text-base' : 'text-sm'}`}>長期血糖控制與平均水平走勢圖</p>
                            </div>
                        </div>
                        
                        <div className={`w-full mt-8 ${isLargeFont ? 'h-[320px]' : 'h-[240px]'}`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" fontSize={isLargeFont ? 13 : 10} fontWeight="600" tick={{ fill: '#94a3b8' }} />
                                        <YAxis domain={[4, 'auto']} fontSize={isLargeFont ? 13 : 10} fontWeight="600" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '1.25rem', 
                                                border: 'none', 
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                                                fontWeight: 'bold',
                                                padding: '12px 16px',
                                                fontSize: isLargeFont ? '1rem' : '0.85rem'
                                            }}
                                        />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="5 5" label={{ value: '目標 (<7%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="5 5" label={{ value: '過高 (>8%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="value" stroke="#7FA0B4" strokeWidth={4} dot={{ r: 6, fill: '#7FA0B4', strokeWidth: 3, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">暫無 HbA1c 趨勢數據</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HbA1c 歷史紀錄報告 */}
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
                </div>
    );
}
