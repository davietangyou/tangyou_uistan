import type {OnboardingViewModel} from './useOnboardingViewModel';

export function StepIndicator({vm}: {vm: OnboardingViewModel}) {
    const {onboardingStep} = vm;
    return (
        <div className="ds-ob-step">
            {/* 步驟指示器 */}
            <span className="ds-ob-step-num" aria-hidden>{onboardingStep}</span>
            <h3 className="t-title ds-ob-step-title">
                {onboardingStep === 1 ? '第 1 步：基本資料與身材指標' : '第 2 步：長期疾病調查與詳情'}
            </h3>
            <span className="t-caption t-ink-2 ds-ob-step-total">
                共 2 步
            </span>
        </div>
    );
}
