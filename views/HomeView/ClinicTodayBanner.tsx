import { View } from '../../utils/types';
import type { HomeViewModel } from './useHomeViewModel';

export function ClinicTodayBanner({vm}: {vm: HomeViewModel}) {
    const {
        glucoseRecords, setView, setConsultStep, profile, setProfile,
        isLargeFont, setIsLargeFont, greeting, isProfileEnriched,
        nextClinicDate, nextClinicQuestions,
        isEditingDate, setIsEditingDate, tempDate, setTempDate,
        dateReminderStatus, daysDiff, handleSaveDate,
    } = vm;
    return (
        <>
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
        </>
    );
}
