import { View } from '../../utils/types';
import type { HomeViewModel } from './useHomeViewModel';

export function ClinicCard({vm}: {vm: HomeViewModel}) {
    const {
        glucoseRecords, setView, setConsultStep, profile, setProfile,
        isLargeFont, setIsLargeFont, greeting, isProfileEnriched,
        nextClinicDate, nextClinicQuestions,
        isEditingDate, setIsEditingDate, tempDate, setTempDate,
        dateReminderStatus, daysDiff, handleSaveDate,
    } = vm;
    return (
        <>
            {/* 🩺【下次問診清單與問診時間卡片】 */}
            <div className="premium-card bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-white border border-emerald-500/20 p-3.5 sm:p-4.5 rounded-2xl space-y-3 shadow-xs">
                {/* 卡片標題與問診時間 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/15 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🩺</span>
                        <div>
                            <h3 className={`font-black text-emerald-900 ${isLargeFont ? 'text-lg' : 'text-xs sm:text-sm'}`}>
                                下次問診清單
                            </h3>
                            <span className="text-[10px] text-emerald-700 font-bold">
                                覆診時拿給醫生看，溝通更精準省時
                            </span>
                        </div>
                    </div>

                    {/* 日期與提醒標籤 */}
                    <div className="flex items-center gap-2">
                        {isEditingDate ? (
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="date"
                                    value={tempDate}
                                    onChange={e => setTempDate(e.target.value)}
                                    className="border border-emerald-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 bg-white"
                                />
                                <button
                                    onClick={handleSaveDate}
                                    className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black cursor-pointer shadow-xs"
                                >
                                    保存
                                </button>
                                <button
                                    onClick={() => {
                                        setTempDate(nextClinicDate);
                                        setIsEditingDate(false);
                                    }}
                                    className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                                >
                                    取消
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                {nextClinicDate ? (
                                    <div className="flex items-center gap-1 bg-white/80 border border-emerald-200 px-2 py-1 rounded-xl shadow-2xs">
                                        <span className="text-xs">📅</span>
                                        <span className="text-[11px] font-black text-emerald-900">
                                            {nextClinicDate}
                                        </span>
                                        {dateReminderStatus === 'TODAY' && (
                                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md ml-1">
                                                今日！
                                            </span>
                                        )}
                                        {dateReminderStatus === 'FUTURE' && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-md ml-1">
                                                還有 {daysDiff} 日
                                            </span>
                                        )}
                                        {dateReminderStatus === 'PAST' && (
                                            <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-1.5 py-0.2 rounded-md ml-1">
                                                已過期
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-400 font-bold bg-white/60 px-2 py-0.5 rounded-lg border border-slate-200">
                                        未設定日期
                                    </span>
                                )}

                                <button
                                    onClick={() => {
                                        setTempDate(nextClinicDate || new Date().toISOString().split('T')[0]);
                                        setIsEditingDate(true);
                                    }}
                                    className="text-[10px] text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 font-black px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                                    title="設定/修改問診日期"
                                >
                                    ✏️ {nextClinicDate ? '改期' : '設日期'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 問診問題列表 */}
                {nextClinicQuestions.length === 0 ? (
                    <div className="bg-white/80 p-3.5 rounded-xl border border-dashed border-emerald-200 text-center space-y-1.5">
                        <p className={`text-slate-500 font-black ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                            📝 目前尚未挑選下次問診問題
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                            可在「問題紀錄」的【AI 總結】中挑選重點問題，隨時同步至此清單！
                        </p>
                        <button
                            onClick={() => setView(View.SavedQuestions)}
                            className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1 rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all inline-block mt-1"
                        >
                            前往挑選問診問題 ➔
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {nextClinicQuestions.map((q, qIdx) => (
                                <div
                                    key={qIdx}
                                    className="p-2 sm:p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs flex items-start gap-2"
                                >
                                    <span className="w-4.5 h-4.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {qIdx + 1}
                                    </span>
                                    <p className={`text-slate-800 font-extrabold leading-snug break-words ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                                        {q}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] text-emerald-700 font-bold">
                                共挑選 {nextClinicQuestions.length} 題
                            </span>
                            <button
                                onClick={() => setView(View.SavedQuestions)}
                                className="text-[10px] text-[#4A6E85] font-black hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                                <span>管理/增減問題</span>
                                <span>➔</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
