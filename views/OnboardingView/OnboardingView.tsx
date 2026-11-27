import React, {useEffect, useRef} from 'react';
import type {OnboardingViewProps} from './types';
import {useOnboardingViewModel} from './useOnboardingViewModel';
import {WelcomeHeader} from './WelcomeHeader';
import {StepIndicator} from './StepIndicator';
import {BasicsStep} from './BasicsStep';
import {ConditionsStep} from './ConditionsStep';
import {ProgressDots} from './ProgressDots';
import {scrollRoot} from '../../components/shell/scrollRoot';

export const OnboardingView: React.FC<OnboardingViewProps> = (props) => {
    const vm = useOnboardingViewModel(props);
    const {onboardingStep} = vm;

    // Round 2: 下一步 / 上一步 are tapped at the bottom of a long step; the new
    // step used to open at that same scroll position (mid-list, its title and
    // first options out of sight). Bring the step card's top back into view.
    const cardRef = useRef<HTMLDivElement>(null);
    const shownStep = useRef(onboardingStep);
    useEffect(() => {
        if (shownStep.current === onboardingStep) return;
        shownStep.current = onboardingStep;
        const card = cardRef.current;
        if (!card) return;
        const root = scrollRoot();
        const top = card.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 12;
        if (root.scrollTop > top) root.scrollTo(0, Math.max(0, top));
    }, [onboardingStep]);

    return (
        <div className="ds-root ds-onboarding">
            <WelcomeHeader vm={vm} />

            {/* 主要卡片區域 */}
            <div ref={cardRef} className="ds-card ds-ob-card">
                <StepIndicator vm={vm} />

                {/* ===================== STEP 1: 如何稱呼您、年齡、性別、身高、體重、BMI ===================== */}
                {onboardingStep === 1 ? (
                    <BasicsStep vm={vm} />
                ) : (
                    /* ===================== STEP 2: 長期疾病問卷與詳情 ===================== */
                    <ConditionsStep vm={vm} />
                )}
            </div>

            <ProgressDots vm={vm} />
        </div>
    );
};
