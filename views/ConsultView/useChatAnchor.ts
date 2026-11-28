import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';
import type {ChatMessage} from '../../utils/types';
import {scrollRoot, scrollRootMax} from '../../components/shell/scrollRoot';

/**
 * Round 2 (chat anchor): the conversation stays anchored at its newest message,
 * like a messaging app. Display-only — it only moves the page scroller
 * (R2-10: the shell canvas; the document itself never scrolls).
 *
 * "Anchored" means: scroll as far down as the thread allows while the newest
 * message (plus its follow-up chips) sits just above the pinned composer; if
 * that message is taller than the space, its first line is kept at the top
 * instead, so a long reply is read from the start rather than from its tail.
 *
 * Re-anchors when: the page is shown (tab entry; the page stays mounted),
 * the newest message or the waiting state changes (send, reply), the input is
 * focused, and the visual viewport resizes while typing (keyboard up / down).
 * A fresh chat (only the welcome line) is left at the top, where the tools are.
 */
export function useChatAnchor(messages: ChatMessage[], waiting: boolean) {
    const panel = useRef<HTMLDivElement>(null);

    // Has the thread been anchored at least once since it was mounted? Until
    // then every anchor is instant (R2-5: a long history used to glide through
    // the whole conversation on first entry).
    const settled = useRef(false);
    const anchor = useCallback((smooth = false) => {
        const root = panel.current;
        if (!root?.isConnected) return;
        if (!settled.current) smooth = false;
        settled.current = true;
        const items = root.querySelectorAll<HTMLElement>('.ds-consult-msg');
        const loadingEl = root.querySelector<HTMLElement>('.ds-consult-loading');
        if (items.length <= 1 && !loadingEl) return;
        const last = loadingEl ?? items[items.length - 1];
        const follow = loadingEl ? null : root.querySelector<HTMLElement>('.ds-consult-followups');
        const composer = root.querySelector<HTMLElement>('.ds-consult-composer');
        const vv = window.visualViewport;
        const scroller = scrollRoot(); // R2-10: the page scroller, not the window
        const y = scroller.scrollTop;
        const top = last.getBoundingClientRect().top + y;
        const bottom = (follow ?? last).getBoundingClientRect().bottom + y;
        const visibleTop = (vv?.offsetTop ?? 0) + 12;
        let bandBottom = window.innerHeight - 12;
        if (composer) {
            // Use the painted box (sticky), not style.bottom; minus any
            // keyboard glide still running, so we aim at where it rests.
            const t = getComputedStyle(composer).transform;
            const glide = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
            bandBottom = composer.getBoundingClientRect().top - glide - 12;
        }
        let target = bottom - bandBottom;
        if (bottom - top > bandBottom - visibleTop) target = top - visibleTop;
        const max = scrollRootMax(scroller);
        target = Math.max(0, Math.min(max, Math.round(target)));
        if (Math.abs(target - y) < 2) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollTo({top: target, behavior: smooth && !reduce ? 'smooth' : 'auto'});
    }, []);

    // Newest message / waiting state changed → follow it (smoothly).
    const newest = messages[messages.length - 1];
    const key = `${messages.length}:${newest?.id ?? ''}:${waiting ? 1 : 0}`;
    useLayoutEffect(() => {
        if (!settled.current) {
            anchor(false);
            return;
        }
        // let the new card lay out (markdown, details) before measuring
        const id = requestAnimationFrame(() => anchor(true));
        return () => cancelAnimationFrame(id);
    }, [key, anchor]);

    // Page shown again (tab entry) → land on the newest message, no animation.
    // Its tab tapped again while here → glide back to the newest message.
    // A layout effect, so it is listening before the tab-scroll memory (a
    // parent layout effect) announces the page on its very first mount.
    useLayoutEffect(() => {
        const onShown = (e: Event) => {
            if ((e as CustomEvent).detail !== 'CONSULT') return;
            anchor(false); // before the first paint: no flash of the oldest messages
            requestAnimationFrame(() => anchor(false)); // and once more after late layout
        };
        const onRetap = (e: Event) => {
            if ((e as CustomEvent).detail !== 'CONSULT') return;
            anchor(true);
        };
        window.addEventListener('ds:view-shown', onShown);
        window.addEventListener('ds:tab-retap', onRetap);
        return () => {
            window.removeEventListener('ds:view-shown', onShown);
            window.removeEventListener('ds:tab-retap', onRetap);
        };
    }, [anchor]);

    // R2-8: the waiting card grows (the long-wait note fades in) → keep it in
    // view, but only while the person is still looking at it (its top is on
    // screen), so someone who scrolled up to reread is not pulled back.
    useEffect(() => {
        if (!waiting || typeof ResizeObserver === 'undefined') return;
        const el = panel.current?.querySelector<HTMLElement>('.ds-consult-loading');
        if (!el) return;
        let h = el.offsetHeight;
        const ro = new ResizeObserver(() => {
            if (el.offsetHeight <= h) { h = el.offsetHeight; return; }
            h = el.offsetHeight;
            const r = el.getBoundingClientRect();
            if (r.top >= 0 && r.top < window.innerHeight) anchor(true);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [waiting, anchor]);

    // Typing: focus and keyboard resizes keep the newest message above the composer.
    useEffect(() => {
        const vv = window.visualViewport;
        let timer = 0;
        const typingHere = () => {
            const el = document.activeElement;
            return !!el && el.id === 'chat-input-box' && !!panel.current?.contains(el);
        };
        // The page scroller eases to the keyboard (240ms, Layout). While the
        // thread is followed to its end (reference: < 80px from the bottom)
        // the content rides up with it frame by frame instead of being
        // covered and then jumped; one anchor runs once it has settled.
        const scroller = scrollRoot();
        let following = true;
        const onScroll = () => {
            following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
        };
        let height = scroller.clientHeight;
        // Only a real thread rides (welcome / topic cards stay where they
        // are; riding there piled up scroll on every open).
        const hasThread = () => (panel.current?.querySelectorAll('.ds-consult-msg').length ?? 0) > 1 || !!panel.current?.querySelector('.ds-consult-loading');
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
            const next = scroller.clientHeight;
            if (next < height && following && typingHere() && hasThread()) scroller.scrollTop += height - next;
            height = next;
        });
        ro?.observe(scroller);
        scroller.addEventListener('scroll', onScroll, {passive: true});
        const later = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => { if (typingHere()) anchor(true); }, 300);
        };
        const onFocus = (e: FocusEvent) => {
            if ((e.target as HTMLElement | null)?.id !== 'chat-input-box') return;
            onScroll(); // where the reader is now, before the keyboard shrinks the view
            later();
        };
        document.addEventListener('focusin', onFocus);
        vv?.addEventListener('resize', later);
        return () => {
            window.clearTimeout(timer);
            ro?.disconnect();
            scroller.removeEventListener('scroll', onScroll);
            document.removeEventListener('focusin', onFocus);
            vv?.removeEventListener('resize', later);
        };
    }, [anchor]);

    return panel;
}
