import type {GlucoseViewModel} from './useGlucoseViewModel';
import { PERIOD_OPTIONS, PREDEFINED_SYMPTOMS } from './constants';

export function SymptomTab({vm}: {vm: GlucoseViewModel}) {
    const {
        addGlucoseRecord,
        currentPeriodInfo,
        customSymptomText,
        filteredSymptomGlucoseRecords,
        formattedTime,
        glucoseRecords,
        handleAddCustomSymptom,
        handleRemoveCustomSymptom,
        handleSelectPeriod,
        handleSetTime,
        handleVoiceInput,
        isLargeFont,
        isListening,
        isLiveTime,
        isPeriodPickerOpen,
        isSymptomRecentRecordsVisible,
        isTimePickerOpen,
        newGlucose,
        saveSuccessMessage,
        selectedCustomSymptoms,
        selectedSymptomFilter,
        setCustomSymptomText,
        setGlucoseRecords,
        setIsPeriodPickerOpen,
        setIsSymptomRecentRecordsVisible,
        setIsTimePickerOpen,
        setNewGlucose,
        setSaveSuccessMessage,
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
                <div className="space-y-6 animate-soft">
                    {/* 溫馨提示 / 成功提示通知 */}
                    {saveSuccessMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
                            <span className="text-2xl">✅</span>
                            <div className="flex-grow">
                                <p className="font-black text-emerald-800 text-sm sm:text-base">{saveSuccessMessage}</p>
                                <p className="text-emerald-600 font-bold text-xs">數據已即時同步到下方的數據看板及字雲中！</p>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                    ✍️ 1. 症狀紀錄表單（與血糖紀錄一致的設計：紀錄時間、紀錄時段、症狀選擇）
                    ========================================================= */}
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 紀錄時間選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⏱️</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                            紀錄時間
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

                        {/* 🏷️ 2. 紀錄時段選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                        紀錄時段
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsPeriodPickerOpen(!isPeriodPickerOpen)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-300 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span>{currentPeriodInfo.icon}</span>
                                    <span>{currentPeriodInfo.label}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {isPeriodPickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時段選擇九宮格 */}
                            {isPeriodPickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-2.5 animate-soft">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {PERIOD_OPTIONS.map((item) => {
                                            const isSelected = 
                                                (item.mealTag 
                                                    ? newGlucose.timeType === item.timeType && newGlucose.mealTag === item.mealTag 
                                                    : newGlucose.timeType === item.timeType);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectPeriod(item)}
                                                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${
                                                        isSelected
                                                            ? 'bg-[#2A9D8F] border-[#2A9D8F] text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl">{item.icon}</span>
                                                        {isSelected && <span className="text-xs">✓</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs sm:text-sm">{item.label}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🤒 3. 身體症狀選擇卡片（純文字無 emoji，可多選 + 其他症狀自訂添加） */}
                        <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤒</span>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                                        身體症狀選擇（可多選）
                                    </h4>
                                    {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                        <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                            已選 {newGlucose.symptoms.length} 個
                                        </span>
                                    )}
                                </div>

                                {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setNewGlucose({ ...newGlucose, symptoms: [] })}
                                        className="text-xs font-bold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                        ✕ 清除全部
                                    </button>
                                )}
                            </div>

                            {/* 預設症狀列表（純文字關鍵詞標籤，無解釋） */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {PREDEFINED_SYMPTOMS.map((symptomName) => {
                                    const isSelected = newGlucose.symptoms?.includes(symptomName) || false;
                                    return (
                                        <button
                                            key={symptomName}
                                            type="button"
                                            onClick={() => {
                                                let next = [...(newGlucose.symptoms || [])];
                                                if (next.includes(symptomName)) {
                                                    next = next.filter(x => x !== symptomName);
                                                } else {
                                                    next.push(symptomName);
                                                }
                                                setNewGlucose({ ...newGlucose, symptoms: next });
                                            }}
                                            className={`p-3 rounded-xl border-2 font-black transition-all flex items-center justify-between cursor-pointer active:scale-95 text-left ${
                                                isLargeFont ? 'text-base p-4' : 'text-xs sm:text-sm'
                                            } ${
                                                isSelected
                                                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                            }`}
                                            style={{ minHeight: '46px' }}
                                        >
                                            <span className="font-extrabold">{symptomName}</span>
                                            <div className={`rounded-md flex items-center justify-center transition-all flex-shrink-0 ml-1 ${
                                                isLargeFont ? 'w-5 h-5 border-2' : 'w-4 h-4 border'
                                            } ${
                                                isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <span className="text-[10px] font-black">✓</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ✍️ 其他症狀自定義添加（手動打字 / 語音輸入） */}
                            <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`font-black text-slate-700 text-xs sm:text-sm flex items-center gap-1.5`}>
                                        ✍️ 其他症狀自訂添加（支援多項或語音）
                                    </span>
                                    {isListening && (
                                        <span className="text-rose-500 font-extrabold flex items-center gap-1 animate-pulse text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                            正在聆聽語音...
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            className={`w-full bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/15 transition-all outline-none rounded-xl ${
                                                isLargeFont ? 'py-3.5 pl-4 pr-10 text-base font-bold' : 'py-2.5 pl-3.5 pr-10 text-xs font-bold'
                                            }`}
                                            placeholder="輸入其他自訂症狀（如：胃脹、胸悶、腰痠，支援逗號或空格）"
                                            value={customSymptomText}
                                            onChange={(e) => setCustomSymptomText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomSymptom();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleVoiceInput('symptom')}
                                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                                isLargeFont ? 'w-8 h-8 text-base' : 'w-7 h-7 text-xs'
                                            } ${
                                                isListening 
                                                    ? 'bg-rose-500 text-white animate-pulse' 
                                                    : 'hover:bg-rose-50 text-rose-500'
                                            }`}
                                            title="點擊語音輸入"
                                        >
                                            🎙️
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSymptom}
                                        className={`bg-[#4A6E85] text-white rounded-xl font-black hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                                            isLargeFont ? 'px-6 py-3 text-sm' : 'px-4 py-2.5 text-xs'
                                        }`}
                                    >
                                        添加
                                    </button>
                                </div>

                                {selectedCustomSymptoms.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        <p className="font-black text-slate-500 text-xs">
                                            已添加自訂症狀（點擊 ✕ 移除）：
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCustomSymptoms.map((sym) => (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    onClick={() => handleRemoveCustomSymptom(sym)}
                                                    className="font-black bg-rose-500 text-white hover:bg-rose-600 rounded-full flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-xs px-3 py-1"
                                                >
                                                    <span>{sym}</span>
                                                    <span className="text-[10px] bg-white text-rose-500 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                                                        ×
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 💾 4. 儲存症狀紀錄按鈕 */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!newGlucose.timeType) {
                                        alert('請先選擇「測量時段」噢！');
                                        return;
                                    }
                                    if (!newGlucose.symptoms || newGlucose.symptoms.length === 0) {
                                        alert('請至少勾選或添加一項症狀噢！');
                                        return;
                                    }
                                    const originalVal = newGlucose.value;
                                    newGlucose.value = '';
                                    addGlucoseRecord();
                                    setSaveSuccessMessage('🎉 身體症狀紀錄儲存成功！');
                                    setTimeout(() => setSaveSuccessMessage(null), 4500);
                                }}
                                disabled={!(newGlucose.symptoms && newGlucose.symptoms.length > 0)}
                                className={`w-full sm:w-2/3 bg-rose-500 text-white font-black shadow-md hover:bg-rose-600 active:scale-98 transition-all disabled:opacity-35 flex items-center justify-center gap-2 rounded-2xl cursor-pointer ${
                                    isLargeFont ? 'py-4 text-xl' : 'py-3 text-base'
                                }`}
                            >
                                <span>💾 儲存症狀紀錄</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                    已選 {newGlucose.symptoms ? newGlucose.symptoms.length : 0} 個症狀
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* =========================================================
                    📊 2. 症狀視覺字雲與頻次統計
                    ========================================================= */}
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

                    {/* 歷史紀錄 (預設收起，下拉點擊才顯示詳細紀錄) */}
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
                </div>
    );
}
