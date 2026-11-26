import type {OnboardingViewModel} from './useOnboardingViewModel';
import {cx} from '../../components/ui';

export function ProgressDots({vm}: {vm: OnboardingViewModel}) {
    const {onboardingStep} = vm;
    return (
        <div className="ds-ob-dots" aria-hidden>
            {/* 底部小圓點導航指示 */}
            <span className={cx('ds-ob-dot', onboardingStep === 1 && 'is-current')} />
            <span className={cx('ds-ob-dot', onboardingStep === 2 && 'is-current')} />
        </div>
    );
}
