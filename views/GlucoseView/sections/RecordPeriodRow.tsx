import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PERIOD_OPTIONS } from '../constants';

// Stage 6 pure move from BloodGlucoseTab/SymptomTab (lines 154-209 / 135-190); JSX copied verbatim.
export function RecordPeriodRow({vm, label}: {vm: GlucoseViewModel; label: string}) {
    const {
        currentPeriodInfo,
        handleSelectPeriod,
        isLargeFont,
        isPeriodPickerOpen,
        newGlucose,
        setIsPeriodPickerOpen
    } = vm;

    return (
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                        {label}
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
    );
}
