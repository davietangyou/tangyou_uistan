/**
 * R2-10: the app's page scroller. On iPhone Safari a scrolling document makes
 * the address / tool bars collapse and expand with every swipe, so the
 * document itself never scrolls: html / body are fixed at the viewport height
 * with overflow hidden, and the shell canvas (Layout, `data-scroll-root`) is
 * the one scroll container for the bottom-nav pages. Sub-pages and sheets keep
 * their own scrollers as before.
 *
 * Everything that used to read or move `window` scroll (tab scroll memory,
 * re-tap to top, 問 AI anchoring, the keyboard reveal, the first-setup step
 * jump) goes through here. Falls back to the document scroller before the
 * shell has mounted.
 */
export function scrollRoot(): HTMLElement {
    return document.querySelector<HTMLElement>('[data-scroll-root]') ?? (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** Largest scrollTop the page scroller can take. */
export function scrollRootMax(el: HTMLElement = scrollRoot()): number {
    return Math.max(0, el.scrollHeight - el.clientHeight);
}
