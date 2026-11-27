import {useEffect, useLayoutEffect, useRef} from 'react';

/**
 * Stage 12: each bottom-nav tab keeps its own scroll position, like a native
 * tab bar. The page (window) is still the only scroller; switching tabs
 * restores the position last seen on that tab, or the top on a first visit.
 */
export function useTabScrollMemory(view: string) {
    const positions = useRef<Record<string, number>>({});
    const current = useRef(view);

    useEffect(() => {
        const onScroll = () => {
            positions.current[current.current] = window.scrollY;
        };
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useLayoutEffect(() => {
        if (current.current === view) return;
        current.current = view;
        window.scrollTo(0, positions.current[view] ?? 0);
    }, [view]);
}
