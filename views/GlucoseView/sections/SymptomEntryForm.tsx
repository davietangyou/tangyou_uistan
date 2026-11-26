import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PREDEFINED_SYMPTOMS } from '../constants';
import {RecordTimeRow} from './RecordTimeRow';
import {RecordPeriodRow} from './RecordPeriodRow';

// Stage 6 pure move from SymptomTab (lines 63-369); JSX copied verbatim.
export function SymptomEntryForm({vm}: {vm: GlucoseViewModel}) {
    const {
        addGlucoseRecord,
        customSymptomText,
        handleAddCustomSymptom,
        handleRemoveCustomSymptom,
        handleVoiceInput,
        isLargeFont,
        isListening,
        newGlucose,
        selectedCustomSymptoms,
        setCustomSymptomText,
        setNewGlucose,
        setSaveSuccessMessage
    } = vm;

    return (
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 紀錄時間選擇行 */}
                        <RecordTimeRow vm={vm} label="紀錄時間" />

                        {/* 🏷️ 2. 紀錄時段選擇行 */}
                        <RecordPeriodRow vm={vm} label="紀錄時段" />

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
    );
}
