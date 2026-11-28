import {View} from '../../utils/types';
import {uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function GreetingCard({vm}: {vm: HomeViewModel}) {
    const {greeting, setView, isLargeFont, setIsLargeFont} = vm;
    const ProfileIcon = uiIcons.profile;

    return (
        <header className="ds-home-greeting ds-page-lead">
            <button
                type="button"
                className="ds-home-avatar ds-control"
                aria-label="前往「我的」"
                onClick={() => setView(View.Me)}
            >
                <ProfileIcon size={22} strokeWidth={1.8} aria-hidden />
            </button>
            <div className="ds-home-greet-copy">
                <p className="ds-home-brand">DiaGuide HK</p>
                <h2 className="ds-home-hello">{greeting}</h2>
            </div>
            {setIsLargeFont && (
                <button
                    type="button"
                    onClick={() => setIsLargeFont(!isLargeFont)}
                    data-verify="font-toggle"
                    className="ds-shell-font-toggle ds-home-font ds-control"
                    title={isLargeFont ? '切換至標準字型' : '切換至老友大字'}
                    aria-label={isLargeFont ? '切換至標準字' : '切換至放大字'}
                >
                    <span>Aa {isLargeFont ? '放大' : '標準'}</span>
                </button>
            )}
        </header>
    );
}
