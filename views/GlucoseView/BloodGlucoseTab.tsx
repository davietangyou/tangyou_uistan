import type {GlucoseViewModel} from './useGlucoseViewModel';
import { PERIOD_OPTIONS, PREDEFINED_SYMPTOMS, SYMPTOM_DETAILS } from './constants';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceArea,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export function BloodGlucoseTab({vm}: {vm: GlucoseViewModel}) {
    const {
        abnormalRecordsCount,
        activeAccordion,
        addGlucoseRecord,
        bgStats,
        chartData,
        chartRange,
        currentPeriodInfo,
        customEndDate,
        customStartDate,
        customSymptomText,
        filteredRecentRecords,
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
        isRecentRecordsVisible,
        isRecordsExpanded,
        isTimePickerOpen,
        newGlucose,
        rangeTimeBounds,
        recordFilter,
        saveSuccessMessage,
        selectedCustomSymptoms,
        setActiveAccordion,
        setChartRange,
        setCustomEndDate,
        setCustomPresetDays,
        setCustomPresetThisMonth,
        setCustomStartDate,
        setCustomSymptomText,
        setGlucoseRecords,
        setIsPeriodPickerOpen,
        setIsRecentRecordsVisible,
        setIsRecordsExpanded,
        setIsTimePickerOpen,
        setNewGlucose,
        setRecordFilter,
        setSaveSuccessMessage,
        visibleRecords,
        voiceTarget
    } = vm;

    return (
                <div className="space-y-6 animate-soft">
                    {/* 溫馨提示 / 成功提示通知 */}
                    {saveSuccessMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
                            <span className="text-2xl">✅</span>
                            <div className="flex-grow">
                                <p className="font-black text-emerald-800 text-sm sm:text-base">{saveSuccessMessage}</p>
                                <p className="text-emerald-600 font-bold text-xs">數據已即時同步到下方的數據看板及走勢圖中！</p>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                    ✍️ 1. 登記血糖與狀況紀錄表單（即時時間、時段自選、血糖數值、生活情境）
                    ========================================================= */}
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 測量時間選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⏱️</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                            測量時間
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

                        {/* 🏷️ 2. 測量時段選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                        測量時段
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

                        {/* 🩸 3. 血糖數值輸入卡片 */}
                        <div className="bg-white border-2 border-[#2A9D8F]/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💧</span>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                                        血糖數值
                                    </h4>
                                </div>
                                {newGlucose.value && (
                                    <button
                                        type="button"
                                        onClick={() => setNewGlucose((prev: any) => ({ ...prev, value: '' }))}
                                        className="text-xs font-bold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                        ✕ 清除
                                    </button>
                                )}
                            </div>

                            {/* 血糖數值主要輸入行 */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 sm:px-6 sm:py-4">
                                <span className={`font-black text-slate-600 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                                    血糖數值
                                </span>

                                <div className="flex items-baseline gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        inputMode="decimal"
                                        placeholder="請輸入"
                                        value={newGlucose.value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setNewGlucose((prev: any) => ({ ...prev, value: '' }));
                                            } else {
                                                const num = parseFloat(val);
                                                if (!isNaN(num) && num < 0) {
                                                    setNewGlucose((prev: any) => ({ ...prev, value: '0' }));
                                                } else {
                                                    setNewGlucose((prev: any) => ({ ...prev, value: val }));
                                                }
                                            }
                                        }}
                                        className={`bg-transparent text-right font-black text-[#2A9D8F] outline-none placeholder:text-slate-300 w-32 sm:w-40 ${
                                            isLargeFont ? 'text-4xl' : 'text-3xl sm:text-4xl'
                                        }`}
                                    />
                                    <span className="font-black text-slate-400 text-xs sm:text-sm">
                                        mmol/L
                                    </span>
                                </div>
                            </div>

                            {/* 即時健康範圍警報提示 */}
                            {newGlucose.value && !isNaN(parseFloat(newGlucose.value)) && (() => {
                                const val = parseFloat(newGlucose.value);
                                if (val < 4.0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-900 shadow-sm">
                                            <span className="text-xl">⚠️</span>
                                            <div className="text-xs">
                                                <p className="font-black text-amber-850">低血糖警報 ({val} mmol/L)</p>
                                                <p className="font-bold text-amber-700">數值低於 4.0，請立即補充 15g 快速碳水化合物（如果汁或糖果），15分鐘後重測。</p>
                                            </div>
                                        </div>
                                    );
                                }
                                const isFasting = newGlucose.timeType === '空腹' || newGlucose.timeType === '餐前';
                                const limit = isFasting ? 7.0 : 10.0;
                                if (val > limit) {
                                    return (
                                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2 text-rose-900 shadow-sm">
                                            <span className="text-xl">🚨</span>
                                            <div className="text-xs">
                                                <p className="font-black text-rose-850">血糖偏高 ({val} mmol/L)</p>
                                                <p className="font-bold text-rose-700">超出標準範圍，建議飲用溫開水，並記錄下方飲食與運動細節。</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center gap-2 text-emerald-900 shadow-sm">
                                        <span className="text-lg">💚</span>
                                        <p className="font-bold text-xs text-emerald-800">
                                            血糖正常理想（{val} mmol/L），請繼續保持！
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ➕ 4. 測量血糖值的其他信息 */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="font-black text-slate-700 text-sm flex items-center gap-1.5">
                                    <span>📋</span>
                                    <span>測量血糖值的其他資訊</span>
                                </h4>
                            </div>

                            <div className="space-y-2">
                                {/* 🍽️ 1. 吃了什麼 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
                                                🍽️
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    吃了什麼
                                                </span>
                                                {newGlucose.dietNote && (
                                                    <span className="text-[11px] text-emerald-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已填：{newGlucose.dietNote}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'diet' ? null : 'diet')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.dietNote 
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'diet' ? '▲' : (newGlucose.dietNote ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'diet' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            {/* 快捷標籤 */}
                                            <div className="flex flex-wrap gap-1.5 pt-3">
                                                {['清淡少油', '多蔬菜/高纖', '白飯/澱粉主食', '茶餐廳/高油外賣', '低GI雜糧糙米', '水果甜點', '無糖茶飲', '少吃了一餐'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewGlucose((prev: any) => ({
                                                                ...prev,
                                                                dietNote: prev.dietNote ? `${prev.dietNote}、${tag}` : tag
                                                            }));
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                                    >
                                                        ＋ {tag}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="例如：半碗糙米飯、蒸肉餅、少油菜心"
                                                    value={newGlucose.dietNote || ''}
                                                    onChange={(e) => setNewGlucose((prev: any) => ({ ...prev, dietNote: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A9D8F] focus:bg-white rounded-xl py-2.5 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleVoiceInput('diet')}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center w-7 h-7 text-sm ${
                                                        isListening && voiceTarget === 'diet' ? 'bg-rose-500 text-white animate-pulse' : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    title="語音輸入食物"
                                                >
                                                    🎙️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 🏃 2. 做了什麼運動 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base">
                                                🏃
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    做了什麼運動
                                                </span>
                                                {newGlucose.exerciseNote && (
                                                    <span className="text-[11px] text-blue-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已填：{newGlucose.exerciseNote}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'exercise' ? null : 'exercise')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.exerciseNote 
                                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'exercise' ? '▲' : (newGlucose.exerciseNote ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'exercise' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            {/* 快捷標籤 */}
                                            <div className="flex flex-wrap gap-1.5 pt-3">
                                                {['散步 20-30分鐘', '深蹲/坐站 15-20次', '太極 / 八段錦', '彈力帶/啞鈴肌力', '靠牆俯臥撐/提踵', '慢跑 / 快走', '居家伸展操', '做家務 / 走樓梯', '今天未做運動'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewGlucose((prev: any) => ({
                                                                ...prev,
                                                                exerciseNote: prev.exerciseNote ? `${prev.exerciseNote}、${tag}` : tag
                                                            }));
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                                    >
                                                        ＋ {tag}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="例如：飯後公園散步 25 分鐘"
                                                    value={newGlucose.exerciseNote || ''}
                                                    onChange={(e) => setNewGlucose((prev: any) => ({ ...prev, exerciseNote: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A9D8F] focus:bg-white rounded-xl py-2.5 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleVoiceInput('exercise')}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center w-7 h-7 text-sm ${
                                                        isListening && voiceTarget === 'exercise' ? 'bg-rose-500 text-white animate-pulse' : 'text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                    title="語音輸入運動"
                                                >
                                                    🎙️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 🤒 3. 有什麼症狀 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-base">
                                                🤒
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    有什麼症狀
                                                </span>
                                                {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                                    <span className="text-[11px] text-rose-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已選 {newGlucose.symptoms.length} 個症狀（{newGlucose.symptoms.join('、')}）
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'symptoms' ? null : 'symptoms')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.symptoms && newGlucose.symptoms.length > 0
                                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'symptoms' ? '▲' : (newGlucose.symptoms && newGlucose.symptoms.length > 0 ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'symptoms' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
                                                {PREDEFINED_SYMPTOMS.map((symptomId) => {
                                                    const detail = SYMPTOM_DETAILS[symptomId] || { icon: '❓', name: symptomId };
                                                    const isSelected = newGlucose.symptoms?.includes(symptomId) || false;
                                                    return (
                                                        <button
                                                            key={symptomId}
                                                            type="button"
                                                            onClick={() => {
                                                                let next = [...(newGlucose.symptoms || [])];
                                                                if (next.includes(symptomId)) {
                                                                  next = next.filter(x => x !== symptomId);
                                                                } else {
                                                                  next.push(symptomId);
                                                                }
                                                                setNewGlucose((prev: any) => ({ ...prev, symptoms: next }));
                                                            }}
                                                            className={`p-2 rounded-xl border font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs ${
                                                                isSelected
                                                                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span>{detail.icon}</span>
                                                            <span className="truncate">{detail.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* 手動輸入其他症狀 */}
                                            <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                                <div className="relative flex-grow">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#2A9D8F] rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold"
                                                        placeholder="手動補充其他不適"
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
                                                        className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center w-6 h-6 text-sm ${
                                                            isListening && voiceTarget === 'symptom' ? 'bg-rose-500 text-white animate-pulse' : 'text-rose-500 hover:bg-rose-50'
                                                        }`}
                                                        title="語音錄音"
                                                    >
                                                        🎙️
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomSymptom}
                                                    className="bg-[#2A9D8F] text-white rounded-lg font-black px-3 py-1.5 text-xs hover:bg-[#238276] cursor-pointer"
                                                >
                                                    加入
                                                </button>
                                            </div>

                                            {selectedCustomSymptoms.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {selectedCustomSymptoms.map((sym) => (
                                                        <button
                                                            key={sym}
                                                            type="button"
                                                            onClick={() => handleRemoveCustomSymptom(sym)}
                                                            className="bg-rose-500 text-white hover:bg-rose-600 rounded-full flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <span>{sym}</span>
                                                            <span>×</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 🔘 5. 底部操作按鈕 */}
                        <div className="pt-5 border-t border-slate-200/80 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setNewGlucose({
                                        value: '',
                                        timeType: '空腹',
                                        symptoms: [],
                                        mealTag: undefined,
                                        dietNote: '',
                                        exerciseNote: '',
                                        customTimestamp: undefined,
                                        customDateStr: undefined
                                    });
                                    handleSetTime(new Date(), true);
                                    setActiveAccordion(null);
                                }}
                                className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-[#2A9D8F] text-[#2A9D8F] hover:bg-emerald-50/50 font-black text-sm transition-all cursor-pointer text-center"
                            >
                                清空重填
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!newGlucose.value) {
                                        alert('請先輸入測量的血糖值（例如：5.5）噢！');
                                        return;
                                    }
                                    if (!newGlucose.timeType) {
                                        setNewGlucose((prev: any) => ({ ...prev, timeType: '空腹' }));
                                    }
                                    addGlucoseRecord();
                                    setSaveSuccessMessage('🎉 血糖紀錄已成功儲存！');
                                    setTimeout(() => setSaveSuccessMessage(null), 4500);
                                    
                                    // 關閉展開項保持乾淨
                                    setActiveAccordion(null);
                                    setIsTimePickerOpen(false);
                                    setIsPeriodPickerOpen(false);
                                    handleSetTime(new Date(), true);
                                }}
                                className="flex-2 py-3.5 px-6 rounded-2xl bg-[#2A9D8F] hover:bg-[#238276] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                                <span>完成儲存</span>
                                <span>✓</span>
                            </button>
                        </div>
                    </div>

                    {/* =========================================================
                    📊 2. 數據分析看板 (一頁展示，無縫銜接於登記表單下方)
                    ========================================================= */}
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

                    {/* 📈 趨勢匯總圖：隨選取範圍即時變更 */}
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-10' : 'p-6 sm:p-8 space-y-6'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className={`font-black text-[#4A6E85] flex items-center gap-2 ${isLargeFont ? 'text-2xl' : 'text-lg'}`}>
                                    📈 血糖趨勢走勢
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                    {rangeTimeBounds.label} ({chartData.length} 個數據點)
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setChartRange(r.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            chartRange === r.id
                                                ? 'bg-[#4A6E85] text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isLargeFont ? 'h-[360px]' : 'h-[280px]'} w-full`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            fontSize={isLargeFont ? 13 : 10}
                                            fontWeight="600"
                                            tick={{ fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 'auto']} 
                                            fontSize={isLargeFont ? 13 : 10} 
                                            fontWeight="600" 
                                            axisLine={false} 
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-1.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="font-bold text-slate-400">{data.fullDate}</span>
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-black">{data.type}</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1.5 pt-1">
                                                                <span className="text-xl font-black text-[#4A6E85]">{data.value}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                                            </div>
                                                            {data.mealTag && (
                                                                <div className="text-slate-600 font-bold">🍱 {data.mealTag}</div>
                                                            )}
                                                            {data.symptoms && data.symptoms.length > 0 && (
                                                                <div className="text-rose-500 font-bold flex flex-wrap gap-1">
                                                                    <span>⚠️ 症狀：</span>
                                                                    <span>{data.symptoms.join(', ')}</span>
                                                                </div>
                                                            )}
                                                            {data.dietNote && (
                                                                <div className="text-slate-500 font-medium truncate max-w-[200px]">🍽️ {data.dietNote}</div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        { /* @ts-ignore */ }
                                        <ReferenceArea y1={4} y2={7} fill="#10B981" fillOpacity={0.08} />
                                        <ReferenceLine y={4} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '過低 (4)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="3 3" label={{ value: '餐前目標 (7)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={10} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '餐後上限 (10)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#F59E0B', fontWeight: 'bold' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#4A6E85" 
                                            strokeWidth={3.5} 
                                            dot={{ r: 4.5, fill: '#4A6E85', strokeWidth: 2.5, stroke: '#fff' }} 
                                            activeDot={{ r: 7, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">該區間暫無記錄</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={`flex justify-center flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-slate-100 ${isLargeFont ? 'text-sm' : 'text-[10px]'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-emerald-500 border-t-2 border-dashed border-emerald-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐前目標 (4-7)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐後上限 (10)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#4A6E85]"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>實際紀錄</span>
                            </div>
                        </div>
                    </div>

                    {/* 歷史紀錄 */}
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
                </div>
    );
}
