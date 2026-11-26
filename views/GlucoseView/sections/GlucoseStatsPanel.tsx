import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from BloodGlucoseTab (lines 643-776); JSX copied verbatim.
export function GlucoseStatsPanel({vm}: {vm: GlucoseViewModel}) {
    const {
        bgStats,
        chartRange,
        customEndDate,
        customStartDate,
        isLargeFont,
        rangeTimeBounds,
        setChartRange,
        setCustomEndDate,
        setCustomPresetDays,
        setCustomPresetThisMonth,
        setCustomStartDate
    } = vm;

    return (
                    <div id="glucose-dashboard-anchor" className="space-y-6 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <h3 className="text-lg font-black text-[#4A6E85]">血糖數據分析</h3>
                                    <p className="text-xs text-slate-400 font-bold">
                                        當前篩選：{rangeTimeBounds.label} ({rangeTimeBounds.description})
                                    </p>
                                </div>
                            </div>

                            {/* ⏳ 時間範圍切換：週 / 月 / 年 / 自定義 */}
                            <div className={`flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto`}>
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setChartRange(item.id)}
                                        className={`font-black transition-all cursor-pointer ${
                                            isLargeFont 
                                                ? 'px-5 py-2 rounded-xl text-base' 
                                                : 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm'
                                        } ${
                                            chartRange === item.id 
                                                ? 'bg-white shadow-sm text-[#4A6E85]' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 📅 自定義時間選擇器模組 (僅在選擇「自定義」時展開) */}
                        {chartRange === 'CUSTOM' && (
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-soft">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">起始</span>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-slate-300 font-black text-center hidden sm:inline">至</span>
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">結束</span>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 快捷時間範圍標籤 */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">快捷選擇：</span>
                                    {[
                                        { label: '近 3 天', onClick: () => setCustomPresetDays(3) },
                                        { label: '近 14 天', onClick: () => setCustomPresetDays(14) },
                                        { label: '近 30 天', onClick: () => setCustomPresetDays(30) },
                                        { label: '近 90 天', onClick: () => setCustomPresetDays(90) },
                                        { label: '本月', onClick: () => setCustomPresetThisMonth() }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={preset.onClick}
                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 統計概覽卡片 (隨選擇之時間範圍動態更新，僅顯示 Mean, Min, Max) */}
                        {bgStats ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">
                                        平均值 (Mean)
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-emerald-600 text-2xl sm:text-3xl">{bgStats.avg}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-bold block mt-2">
                                        {chartRange === 'WEEK' ? '週平均血糖' : chartRange === 'MONTH' ? '月平均血糖' : chartRange === 'YEAR' ? '年平均血糖' : '區間平均血糖'}
                                    </span>
                                </div>

                                <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">最低值 (Min)</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-amber-600 text-2xl sm:text-3xl">{bgStats.min}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-bold block mt-2">
                                        {bgStats.lowCount > 0 ? `⚠️ 低血糖 ${bgStats.lowCount} 次` : '無低血糖記錄'}
                                    </span>
                                </div>

                                <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 border border-rose-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">最高值 (Max)</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-rose-500 text-2xl sm:text-3xl">{bgStats.max}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-2">
                                        {bgStats.highCount > 0 ? `偏高 ${bgStats.highCount} 次` : '無超標記錄'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                <p className="text-slate-400 font-black text-sm">🌱 該時間區間內暫無血糖紀錄數據，您可以更換時間區間或在上方記錄新數值！</p>
                            </div>
                        )}
                    </div>
    );
}
