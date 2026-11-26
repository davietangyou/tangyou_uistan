import type {OnboardingViewModel} from './useOnboardingViewModel';

export function ProgressDots({vm}: {vm: OnboardingViewModel}) {
    const {onboardingStep} = vm;
    return (
        <>
            {/* 底部小圓點導航指示 */}
            <div className="flex justify-center">
                <div className="flex gap-2 items-center">
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${onboardingStep === 1 ? 'w-8 bg-[#4A6E85]' : 'w-2.5 bg-slate-200'}`}></div>
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${onboardingStep === 2 ? 'w-8 bg-[#4A6E85]' : 'w-2.5 bg-slate-200'}`}></div>
                </div>
            </div>
        </>
    );
}
