import React, {useEffect, useRef, useState} from 'react';
import type {OnboardingViewProps} from './types';
import {useOnboardingViewModel} from './useOnboardingViewModel';
import {WelcomeHeader} from './WelcomeHeader';
import {BasicsStep} from './BasicsStep';
import {ConditionsStep} from './ConditionsStep';
import {Icon} from '../../components/ui';
import {View} from '../../utils/types';
import {scrollRoot} from '../../components/shell/scrollRoot';

const SETUP_TOTAL = 2;

export const OnboardingView: React.FC<OnboardingViewProps> = (props) => {
    const vm = useOnboardingViewModel(props);
    const {onboardingStep, setOnboardingStep, setView, profile} = vm;
    const [hasStarted, setHasStarted] = useState(false);
    const canContinue = Boolean(profile.age && profile.gender);

    // Round 2: 下一步 / 上一步 are tapped at the bottom of a long step; the new
    // step used to open at that same scroll position (mid-list, its title and
    // first options out of sight). Bring the step card's top back into view.
    const cardRef = useRef<HTMLDivElement>(null);
    const shownStep = useRef(onboardingStep);
    useEffect(() => {
        if (shownStep.current === onboardingStep) return;
        shownStep.current = onboardingStep;
        const root = scrollRoot();
        root.scrollTo(0, 0);
        const card = cardRef.current;
        if (!card) return;
        const top = card.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 12;
        if (root.scrollTop > top) root.scrollTo(0, Math.max(0, top));
    }, [onboardingStep]);

    if (!hasStarted) {
        return <WelcomeHeader vm={vm} onStart={() => setHasStarted(true)} />;
    }

    const leaveToHome = () => setView(View.Home);

    return (
        <div className="ds-root ds-onboarding is-setup">
            <header className="ds-ob-setup-head">
                <div className="ds-ob-progress">
                    <div className="ds-ob-progress-title">
                        <span>初次見面，認識一下您</span>
                        <span className="ds-ob-progress-count">{onboardingStep} / {SETUP_TOTAL}</span>
                    </div>
                    <div
                        className="ds-ob-progress-track"
                        role="progressbar"
                        aria-label="首次資料設定進度"
                        aria-valuenow={onboardingStep}
                        aria-valuemin={1}
                        aria-valuemax={SETUP_TOTAL}
                    >
                        <div style={{width: `${(onboardingStep / SETUP_TOTAL) * 100}%`}} />
                    </div>
                </div>
                <div className="ds-ob-setup-row">
                    <button
                        type="button"
                        disabled={onboardingStep === 1}
                        onClick={() => setOnboardingStep(1)}
                        aria-label="返回上一步"
                        className="ds-ob-setup-back ds-control"
                    >
                        <Icon name="back" size={24} />
                    </button>
                    <h2 className="ds-ob-setup-title">
                        {onboardingStep === 1 ? '基本資料' : '長期疾病'}
                    </h2>
                </div>
            </header>

            <div ref={cardRef} className="ds-ob-setup-body">
                {onboardingStep === 1 ? (
                    <BasicsStep vm={vm} />
                ) : (
                    <ConditionsStep vm={vm} />
                )}
            </div>

            <footer className="ds-ob-setup-bar">
                {onboardingStep === 1 ? (
                    <>
                        <button
                            type="button"
                            disabled={!canContinue}
                            onClick={() => setOnboardingStep(2)}
                            data-verify="ob-next"
                            className="ds-btn ds-btn-primary ds-btn-block ds-control ds-ob-next"
                        >
                            下一步
                        </button>
                        {canContinue && (
                            <button
                                type="button"
                                onClick={leaveToHome}
                                data-verify="ob-later"
                                className="ds-ob-later ds-control"
                            >
                                稍後填寫
                            </button>
                        )}
                        {!canContinue && (
                            <p className="t-caption t-ink-2 ds-ob-gate-hint">請先填寫年齡及選擇性別</p>
                        )}
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={leaveToHome}
                            data-verify="ob-finish"
                            className="ds-btn ds-btn-primary ds-btn-block ds-control ds-ob-finish"
                        >
                            完成，進入糖友導航
                        </button>
                        <button
                            type="button"
                            onClick={leaveToHome}
                            data-verify="ob-later"
                            className="ds-ob-later ds-control"
                        >
                            稍後填寫
                        </button>
                    </>
                )}
            </footer>
        </div>
    );
};
