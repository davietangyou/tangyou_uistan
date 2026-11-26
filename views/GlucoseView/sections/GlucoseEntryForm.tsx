import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PREDEFINED_SYMPTOMS, SYMPTOM_DETAILS } from '../constants';
import {RecordTimeRow} from './RecordTimeRow';
import {RecordPeriodRow} from './RecordPeriodRow';

// Stage 6 pure move from BloodGlucoseTab (lines 82-638); JSX copied verbatim.
export function GlucoseEntryForm({vm}: {vm: GlucoseViewModel}) {
    const {
        activeAccordion,
        addGlucoseRecord,
        customSymptomText,
        handleAddCustomSymptom,
        handleRemoveCustomSymptom,
        handleSetTime,
        handleVoiceInput,
        isLargeFont,
        isListening,
        newGlucose,
        selectedCustomSymptoms,
        setActiveAccordion,
        setCustomSymptomText,
        setIsPeriodPickerOpen,
        setIsTimePickerOpen,
        setNewGlucose,
        setSaveSuccessMessage,
        voiceTarget
    } = vm;

    return (
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 測量時間選擇行 */}
                        <RecordTimeRow vm={vm} label="測量時間" />

                        {/* 🏷️ 2. 測量時段選擇行 */}
                        <RecordPeriodRow vm={vm} label="測量時段" />

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
                                        onClick={() => setNewGlucose((prev) => ({ ...prev, value: '' }))}
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
                                                setNewGlucose((prev) => ({ ...prev, value: '' }));
                                            } else {
                                                const num = parseFloat(val);
                                                if (!isNaN(num) && num < 0) {
                                                    setNewGlucose((prev) => ({ ...prev, value: '0' }));
                                                } else {
                                                    setNewGlucose((prev) => ({ ...prev, value: val }));
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
                                                            setNewGlucose((prev) => ({
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
                                                    onChange={(e) => setNewGlucose((prev) => ({ ...prev, dietNote: e.target.value }))}
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
                                                            setNewGlucose((prev) => ({
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
                                                    onChange={(e) => setNewGlucose((prev) => ({ ...prev, exerciseNote: e.target.value }))}
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
                                                                setNewGlucose((prev) => ({ ...prev, symptoms: next }));
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
                                        setNewGlucose((prev) => ({ ...prev, timeType: '空腹' }));
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
    );
}
