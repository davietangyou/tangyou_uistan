import React from 'react';
import type {OnboardingViewProps} from './types';
import {useOnboardingViewModel} from './useOnboardingViewModel';
import {WelcomeHeader} from './WelcomeHeader';
import {StepIndicator} from './StepIndicator';
import {BasicsStep} from './BasicsStep';
import {ConditionsStep} from './ConditionsStep';
import {ProgressDots} from './ProgressDots';

export const OnboardingView: React.FC<OnboardingViewProps> = (props) => {
    const vm = useOnboardingViewModel(props);
    const {onboardingStep} = vm;

    return (
        <div className="ds-root ds-onboarding">
            <WelcomeHeader vm={vm} />

            {/* 主要卡片區域 */}
            <div className="ds-card ds-ob-card">
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
