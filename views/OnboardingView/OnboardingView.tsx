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
        <div className="min-h-[85vh] flex flex-col justify-center space-y-8 animate-soft pb-20 max-w-2xl mx-auto px-2">
            <WelcomeHeader vm={vm} />

            {/* 主要卡片區域 */}
            <div className="premium-card p-6 sm:p-10 bg-white shadow-xl shadow-[#4A6E85]/5 border border-slate-100/80 rounded-3xl relative">
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
