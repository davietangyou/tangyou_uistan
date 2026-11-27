import type {OnboardingViewModel} from './useOnboardingViewModel';

/** Quiet first screen: brand, title, one line of purpose, then 開始使用. */
export function WelcomeHeader({onStart}: {vm?: OnboardingViewModel; onStart: () => void}) {
    return (
        <div className="ds-root ds-onboarding is-welcome">
            <main className="ds-ob-welcome" aria-labelledby="welcome-title">
                <p className="ds-ob-welcome-brand">DiaGuide HK</p>
                <h2 id="welcome-title" className="ds-ob-welcome-title">
                    歡迎使用
                    <br />
                    <span>糖友導航</span>
                </h2>
                <p className="ds-ob-welcome-desc">
                    記錄日常健康，
                    <br />
                    輕鬆準備覆診。
                </p>
                <button
                    type="button"
                    onClick={onStart}
                    data-verify="ob-welcome-start"
                    className="ds-ob-welcome-start ds-control"
                >
                    開始使用
                </button>
            </main>
        </div>
    );
}
