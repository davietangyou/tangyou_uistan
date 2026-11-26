import { View } from '../../utils/types';
import type { HomeViewModel } from './useHomeViewModel';

export function AskAiButton({vm}: {vm: HomeViewModel}) {
    const {
        glucoseRecords, setView, setConsultStep, profile, setProfile,
        isLargeFont, setIsLargeFont, greeting, isProfileEnriched,
        nextClinicDate, nextClinicQuestions,
        isEditingDate, setIsEditingDate, tempDate, setTempDate,
        dateReminderStatus, daysDiff, handleSaveDate,
    } = vm;
    return (
        <>
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
        </>
    );
}
