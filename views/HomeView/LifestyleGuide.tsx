import { View } from '../../utils/types';
import type { HomeViewModel } from './useHomeViewModel';

export function LifestyleGuide({vm}: {vm: HomeViewModel}) {
    const {
        glucoseRecords, setView, setConsultStep, profile, setProfile,
        isLargeFont, setIsLargeFont, greeting, isProfileEnriched,
        nextClinicDate, nextClinicQuestions,
        isEditingDate, setIsEditingDate, tempDate, setTempDate,
        dateReminderStatus, daysDiff, handleSaveDate,
    } = vm;
    return (
        <>
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
        </>
    );
}
