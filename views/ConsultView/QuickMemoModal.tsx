import type {ConsultViewModel} from './useConsultViewModel';
import {View} from '../../utils/types';

export function QuickMemoModal({vm}: {vm: ConsultViewModel}) {
    const {
        isQuickMemoOpen,
        isQuickMemoListening,
        profile,
        quickMemoInput,
        saveDoctorQuestions,
        setIsQuickMemoOpen,
        setQuickMemoInput,
        setView,
        showToast,
        toggleQuickMemoVoice
    } = vm;

    if (!isQuickMemoOpen) return null;

    return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-soft">
                    <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center text-lg font-black shadow-xs">
                                    📝
                                </span>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                        隨手記下想問醫生的問題
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-bold">
                                        聊天時想起任何疑惑，隨時寫下，覆診時自動匯出！
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsQuickMemoOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 常用提問靈感 Chips */}
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-black text-slate-400">💡 常見問診靈感（點擊填入）：</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    "想向醫生請教服藥時間可否配合生活作息調整？",
                                    "最近服藥後有些腸胃不適，是否有替代方案？",
                                    "想諮詢下次化驗是否需要加驗糖化血色素或腎功能？",
                                    "平時血糖波動較大，是否適合使用連續血糖儀 (CGM)？"
                                ].map((preset, pIdx) => (
                                    <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => setQuickMemoInput(preset)}
                                        className="text-left text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer leading-relaxed"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 輸入框與語音按鈕 */}
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={quickMemoInput}
                                    onChange={(e) => setQuickMemoInput(e.target.value)}
                                    placeholder="在此輸入您想問醫生的問題（例如：想問下醫生呢隻藥會唔會令我頭暈...）"
                                    rows={3}
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all resize-none"
                                />
                                <button
                                    type="button"
                                    onClick={toggleQuickMemoVoice}
                                    className={`absolute right-3 bottom-3.5 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                                        isQuickMemoListening 
                                            ? "bg-rose-500 text-white animate-pulse" 
                                            : "bg-slate-200 hover:bg-amber-200 text-slate-700 hover:text-amber-950"
                                    }`}
                                >
                                    <span>🎤</span>
                                    <span>{isQuickMemoListening ? "正在聆聽..." : "語音輸入"}</span>
                                </button>
                            </div>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsQuickMemoOpen(false);
                                    setView(View.SavedQuestions);
                                }}
                                className="text-xs font-bold text-[#4A6E85] hover:underline cursor-pointer"
                            >
                                查看全部已存問題 ({(profile.savedDoctorQuestions || []).length}) ➔
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickMemoOpen(false)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!quickMemoInput.trim()) return;
                                        saveDoctorQuestions([quickMemoInput.trim()]);
                                        setQuickMemoInput('');
                                        setIsQuickMemoOpen(false);
                                        showToast("已存入「問題紀錄」清單 🔖");
                                    }}
                                    disabled={!quickMemoInput.trim()}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                        quickMemoInput.trim()
                                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md active:scale-95"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    ✓ 保存到問診清單
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
    );
}
