import type {HomeViewModel} from './useHomeViewModel';

export function GreetingCard({vm}: {vm: HomeViewModel}) {
    const {greeting} = vm;
    return (
        <header className="ds-home-greeting ds-page-lead">
            <h2 className="t-h1">{greeting}</h2>
        </header>
    );
}
