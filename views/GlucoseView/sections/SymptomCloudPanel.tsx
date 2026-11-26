import type {GlucoseViewModel} from '../useGlucoseViewModel';

// Stage 6 pure move from SymptomTab (lines 374-631); JSX copied verbatim.
export function SymptomCloudPanel({vm}: {vm: GlucoseViewModel}) {
    const {
        isLargeFont,
        selectedSymptomFilter,
        setIsSymptomRecentRecordsVisible,
        setSelectedSymptomFilter,
        setSymptomCustomEndDate,
        setSymptomCustomPresetDays,
        setSymptomCustomPresetThisMonth,
        setSymptomCustomStartDate,
        setSymptomRange,
        symptomCustomEndDate,
        symptomCustomStartDate,
        symptomRange,
        symptomRangeTimeBounds,
        symptomStats
    } = vm;

    return (
                    <div className="premium-card p-5 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-lg space-y-6">
                        
                        {/* 頂部標題與時間範圍切換 */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-[#4A6E85] flex items-center gap-2">
                                    <span>☁️</span>
                                    <span>症狀視覺字雲與統計</span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    當前統計區間：<span className="font-extrabold text-slate-700">{symptomRangeTimeBounds.label}</span> ({symptomRangeTimeBounds.description})
                                </p>
                            </div>

                            {/* ⏳ 時間範圍切換：週 / 月 / 年 / 自定義 */}
                            <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start md:self-auto">
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
                                        onClick={() => setSymptomRange(item.id)}
                                        className={`font-black transition-all cursor-pointer ${
                                            isLargeFont 
                                                ? 'px-5 py-2 rounded-xl text-base' 
                                                : 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm'
                                        } ${
                                            symptomRange === item.id 
                                                ? 'bg-white shadow-sm text-rose-600' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 📅 自定義時間選擇器模組 (僅在選擇「自定義」時展開) */}
                        {symptomRange === 'CUSTOM' && (
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-soft">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">起始</span>
                                        <input
                                            type="date"
                                            value={symptomCustomStartDate}
                                            onChange={(e) => setSymptomCustomStartDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-slate-300 font-black text-center hidden sm:inline">至</span>
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">結束</span>
                                        <input
                                            type="date"
                                            value={symptomCustomEndDate}
                                            onChange={(e) => setSymptomCustomEndDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 快捷時間範圍標籤 */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">快捷選擇：</span>
                                    {[
                                        { label: '近 3 天', onClick: () => setSymptomCustomPresetDays(3) },
                                        { label: '近 14 天', onClick: () => setSymptomCustomPresetDays(14) },
                                        { label: '近 30 天', onClick: () => setSymptomCustomPresetDays(30) },
                                        { label: '本月', onClick: () => setSymptomCustomPresetThisMonth() }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={preset.onClick}
                                            className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 📊 症狀分類統計指標卡片 */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* 1. 低血糖相關症狀 */}
                            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🔴 低血糖相關症狀</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-amber-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.lowBgCount}
                                    </p>
                                    <span className="text-xs text-amber-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-amber-700/80 font-medium truncate">
                                    冷汗、心悸手震、頭暈、飢餓
                                </p>
                            </div>

                            {/* 2. 高血糖滲透症狀 */}
                            <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🟠 高血糖滲透症狀</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-rose-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.highBgCount}
                                    </p>
                                    <span className="text-xs text-rose-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-rose-700/80 font-medium truncate">
                                    口乾口渴、頻尿、極度疲倦
                                </p>
                            </div>

                            {/* 3. 神經與微血管警示 */}
                            <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🟣 神經/微血管警示</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-purple-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.complicationCount}
                                    </p>
                                    <span className="text-xs text-purple-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-purple-700/80 font-medium truncate">
                                    手腳發麻、視力模糊
                                </p>
                            </div>

                            {/* 4. 最常發生的症狀 */}
                            <div className="bg-sky-50/70 border border-sky-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">📈 最常出現症狀</span>
                                </div>
                                {symptomStats.recordedList.length > 0 ? (
                                    <>
                                        <p className="font-black text-[#4A6E85] text-base sm:text-lg truncate mt-1">
                                            {symptomStats.recordedList[0].name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold">
                                            累計 {symptomStats.recordedList[0].count} 次 ({symptomStats.recordedList[0].percentage}%)
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold italic mt-2">此區間暫無紀錄</p>
                                )}
                            </div>
                        </div>

                        {symptomStats.totalRecordsWithSymptom === 0 ? (
                            <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-4xl">💭</p>
                                <p className="text-sm text-slate-500 font-extrabold">在「{symptomRangeTimeBounds.label}」內暫無症狀數據</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    您可切換上方時間範圍（如切換至「月」、「年」或自定義日期），或在上方登記新的症狀紀錄！
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-soft">
                                {/* 篩選提示與重置 */}
                                {selectedSymptomFilter && (
                                    <div className="flex justify-between items-center bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200">
                                        <span className="text-xs text-rose-700 font-black flex items-center gap-1.5">
                                            <span>🔍</span>
                                            <span>正在查看「{selectedSymptomFilter}」的歷史紀錄</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSymptomFilter(null)}
                                            className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm cursor-pointer"
                                        >
                                            清除篩選 ✕
                                        </button>
                                    </div>
                                )}

                                {/* 純文字自適應字雲畫布 */}
                                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 p-6 sm:p-8 bg-slate-50/70 rounded-3xl min-h-[200px] border border-dashed border-slate-200">
                                    {symptomStats.list.map((s) => {
                                        if (s.count === 0) {
                                            return (
                                                <span
                                                    key={s.name}
                                                    className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-lg border border-slate-100 bg-white/40 opacity-40 select-none"
                                                    title="此區間未曾記錄此症狀"
                                                >
                                                    {s.name}
                                                </span>
                                            );
                                        }

                                        // 計算相對權重大小
                                        const ratio = s.count / symptomStats.maxCount;
                                        
                                        let sizeClass = "text-xs sm:text-sm";
                                        let colorClass = "text-slate-600 bg-white hover:bg-slate-100 border-slate-200";
                                        let fontClass = "font-bold";

                                        if (ratio >= 0.8) {
                                            sizeClass = "text-xl sm:text-3xl";
                                            colorClass = "text-rose-700 bg-rose-100 hover:bg-rose-200 border-rose-300 shadow-sm";
                                            fontClass = "font-black tracking-tight";
                                        } else if (ratio >= 0.5) {
                                            sizeClass = "text-lg sm:text-2xl";
                                            colorClass = "text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200";
                                            fontClass = "font-black";
                                        } else if (ratio >= 0.25) {
                                            sizeClass = "text-sm sm:text-lg";
                                            colorClass = "text-slate-800 bg-white hover:bg-rose-50 border-slate-300";
                                            fontClass = "font-extrabold";
                                        }

                                        const isFiltered = selectedSymptomFilter === s.name;

                                        return (
                                            <button
                                                key={s.name}
                                                type="button"
                                                onClick={() => {
                                                    if (isFiltered) {
                                                        setSelectedSymptomFilter(null);
                                                    } else {
                                                        setSelectedSymptomFilter(s.name);
                                                        setIsSymptomRecentRecordsVisible(true);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-2 select-none ${sizeClass} ${fontClass} ${colorClass} ${
                                                    isFiltered 
                                                        ? 'ring-4 ring-rose-500/30 border-rose-500 bg-rose-500 text-white scale-105 shadow-md' 
                                                        : 'hover:scale-105 active:scale-95'
                                                }`}
                                                title={`點擊篩選「${s.name}」紀錄，累計 ${s.count} 次`}
                                            >
                                                <span>{s.name}</span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-inner leading-none ${
                                                    isFiltered ? 'bg-white text-rose-600' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    {s.count}次
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
    );
}
