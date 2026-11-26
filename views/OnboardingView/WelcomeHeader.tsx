import type {OnboardingViewModel} from './useOnboardingViewModel';
import {Icon} from '../ProfileShared/formParts';

export function WelcomeHeader(_props: {vm: OnboardingViewModel}) {
    return (
        <header className="ds-ob-welcome">
            {/* 頂部歡迎區 */}
            <span className="ds-ob-welcome-icon" aria-hidden>
                <Icon name="glucose" size={32} />
            </span>
            <h2 className="t-h1">
                歡迎來到「糖友導航」
            </h2>
            <p className="t-body t-ink-2">
                首次使用只需填寫基本資料與長期疾病，即可量身打造個人化健康指引。
            </p>
        </header>
    );
}
