import type {OnboardingViewModel} from './useOnboardingViewModel';

export function StepIndicator({vm}: {vm: OnboardingViewModel}) {
    const {onboardingStep} = vm;
    return (
        <>
                {/* 步驟指示器 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#4A6E85] text-white font-black text-sm flex items-center justify-center">
                            {onboardingStep}
                        </span>
                        <span className="font-black text-slate-700 text-base sm:text-lg">
                            {onboardingStep === 1 ? '第 1 步：基本資料與身材指標' : '第 2 步：長期疾病調查與詳情'}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        共 2 步
                    </span>
                </div>
        </>
    );
}
