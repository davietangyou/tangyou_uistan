import {useEffect, useLayoutEffect, useRef} from 'react';
import {scrollRoot} from './shell/scrollRoot';

/**
 * Stage 12: each bottom-nav tab keeps its own scroll position, like a native
 * tab bar. The page scroller (R2-10: the shell canvas, no longer the window)
 * is shared by the tabs; switching tabs restores the position last seen on
 * that tab, or the top on a first visit.
 */
export function useTabScrollMemory(view: string) {
    const positions = useRef<Record<string, number>>({});
    const current = useRef(view);

    useEffect(() => {
        const root = scrollRoot();
        const onScroll = () => {
            positions.current[current.current] = root.scrollTop;
        };
        root.addEventListener('scroll', onScroll, {passive: true});
        return () => root.removeEventListener('scroll', onScroll);
    }, []);

    useLayoutEffect(() => {
        if (current.current === view) return;
        current.current = view;
        scrollRoot().scrollTo(0, positions.current[view] ?? 0);
        // Round 2: let a page that anchors its own scroll (問 AI → newest
        // message) adjust once it is back in the document.
        window.dispatchEvent(new CustomEvent('ds:view-shown', {detail: view}));
    }, [view]);
}
