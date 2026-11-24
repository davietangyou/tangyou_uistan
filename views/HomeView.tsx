import React, { useState } from 'react';
import {GlucoseRecord, View, UserProfile} from '../utils/types';

interface HomeViewProps {
    glucoseRecords: GlucoseRecord[];
    setView: (view: View) => void;
    setConsultStep: (step: 'INPUT' | 'CLARIFY' | 'RESULT') => void;
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    isLargeFont?: boolean;
    setIsLargeFont?: (val: boolean) => void;

    // 允许传入其他来自 useAppLogic 的 props
    [key: string]: any;
}

export const HomeView: React.FC<HomeViewProps> = ({glucoseRecords, setView, setConsultStep, profile, setProfile, isLargeFont, setIsLargeFont}) => {
    const hour = new Date().getHours();
    const userName = profile?.name || "老友記";
    let timeGreeting = "你好";
    
    if (hour >= 5 && hour < 12) timeGreeting = "早安";
    else if (hour >= 12 && hour < 18) timeGreeting = "午安";
    else if (hour >= 18 || hour < 5) timeGreeting = "晚安";

    const greeting = `${userName}，${timeGreeting}`;

    // 檢查生活檔案是否已完善
    const isProfileEnriched = !!(profile.clinicType || (profile.dietHabits && profile.dietHabits.length > 0));

    // 下次問診相關狀態
    const nextClinicDate = profile.nextClinicDate || '';
    const nextClinicQuestions = profile.nextClinicQuestions || [];

    // 日期提醒計算 (檢查是否為當日或即將到來)
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [tempDate, setTempDate] = useState(nextClinicDate);

    // 計算就診提醒狀態
    let dateReminderStatus: 'TODAY' | 'FUTURE' | 'PAST' | 'NONE' = 'NONE';
    let daysDiff = 0;

    if (nextClinicDate) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (nextClinicDate === todayStr) {
            dateReminderStatus = 'TODAY';
        } else {
            const targetDate = new Date(nextClinicDate + 'T00:00:00');
            const currentDate = new Date(todayStr + 'T00:00:00');
            const diffTime = targetDate.getTime() - currentDate.getTime();
            daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0) {
                dateReminderStatus = 'FUTURE';
            } else if (daysDiff < 0) {
                dateReminderStatus = 'PAST';
            }
        }
    }

    // 儲存修改的問診日期
    const handleSaveDate = () => {
        setProfile({
            ...profile,
            nextClinicDate: tempDate
        });
        setIsEditingDate(false);
    };

    return (
        <div className={`space-y-3.5 animate-soft pb-20 ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            {/* 頂部簡報：個人問候與最新血糖 */}
            <section className={`premium-card transition-all duration-300 bg-white border border-slate-100/60 shadow-xs relative ${isLargeFont ? 'p-5 ring-4 ring-[#4A6E85]/5' : 'p-3.5 sm:p-4.5'}`}>
                <div className="relative z-10 flex flex-row items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h2 className={`font-black text-[#4A6E85] tracking-tight ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                            {greeting}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`font-extrabold text-[#7FA0B4] uppercase tracking-wider ${isLargeFont ? 'text-[10px]' : 'text-[8px] sm:text-[9px]'}`}>
                                最後檢測：
                            </span>
                            <span className={`font-black text-[#4A6E85] ${isLargeFont ? 'text-xs' : 'text-[9px] sm:text-[11px]'}`}>
                                {glucoseRecords[0] ? `${glucoseRecords[0].date}` : '未有紀錄'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                        <span className={`font-extrabold text-[#7FA0B4] uppercase tracking-wider block ${isLargeFont ? 'text-xs' : 'text-[8px] sm:text-[9px]'}`}>
                            最近血糖
                        </span>
                        <p className={`font-black text-[#2C3E50] tracking-tighter flex items-baseline gap-0.5 ${isLargeFont ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>
                            {glucoseRecords[0] ? glucoseRecords[0].value : '--'}
                            <span className={`font-black text-slate-400 ${isLargeFont ? 'text-xs' : 'text-[10px]'}`}>
                                mmol/L
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* 🔔 當日問診高亮提醒橫幅 (如果是當日) */}
            {dateReminderStatus === 'TODAY' && (
                <div className="bg-rose-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-rose-600 flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">⏰</span>
                        <div>
                            <p className="font-black text-xs sm:text-sm tracking-wide">
                                【今日就診提醒】今日係您預定的問診覆診日！
                            </p>
                            <p className="text-[10px] sm:text-xs text-rose-100 font-bold">
                                記得帶齊血糖紀錄與下方挑選好的「問診清單」俾醫生睇呀！
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setView(View.SavedQuestions)}
                        className="bg-white text-rose-600 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer active:scale-95"
                    >
                        查看清單
                    </button>
                </div>
            )}

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

            {/* 溫馨引導：如未完善生活就醫習慣，引導至「我的」 */}
            {!isProfileEnriched && (
                <div 
                    onClick={() => setView(View.Me)}
                    className="bg-[#4A6E85]/5 hover:bg-[#4A6E85]/10 border border-[#4A6E85]/20 p-3 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">💡</span>
                        <span className="font-bold text-slate-700 text-xs truncate">
                            已建立基礎資料！點此可在「我的」進一步完善就醫與生活習慣
                        </span>
                    </div>
                    <span className="font-black text-[#4A6E85] shrink-0 text-xs flex items-center gap-0.5">
                        <span>去完善</span>
                        <span>➔</span>
                    </span>
                </div>
            )}

            {/* 核心操作：問問 AI */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <button
                    onClick={() => {
                        setView(View.Consult);
                        setConsultStep('INPUT');
                    }}
                    className={`premium-card bg-[#4A6E85] border border-[#4A6E85]/10 flex flex-col items-center justify-center text-center gap-2 shadow-md shadow-[#4A6E85]/15 hover:bg-[#3D5B70] hover:scale-[1.01] transition-all active:scale-95 group cursor-pointer ${isLargeFont ? 'p-5' : 'p-3.5 sm:p-4.5'}`}
                    id="btn-home-ask-ai"
                >
                    <div className={`bg-white/15 rounded-2xl flex items-center justify-center shadow-inner border border-white/15 shrink-0 group-hover:scale-110 transition-transform ${isLargeFont ? 'w-12 h-12 text-2xl' : 'w-8.5 h-8.5 text-base sm:w-10 sm:h-10 sm:text-lg'}`}>
                        🤖
                    </div>
                    <div>
                        <span className={`font-black text-white block ${isLargeFont ? 'text-lg' : 'text-xs sm:text-sm'}`}>
                            問問 AI
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
};
