import type { HomeViewModel } from './useHomeViewModel';

export function GreetingCard({vm}: {vm: HomeViewModel}) {
    const {
        glucoseRecords, setView, setConsultStep, profile, setProfile,
        isLargeFont, setIsLargeFont, greeting, isProfileEnriched,
        nextClinicDate, nextClinicQuestions,
        isEditingDate, setIsEditingDate, tempDate, setTempDate,
        dateReminderStatus, daysDiff, handleSaveDate,
    } = vm;
    return (
        <>
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
        </>
    );
}
