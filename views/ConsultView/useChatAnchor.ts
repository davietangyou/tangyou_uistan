import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';
import type {ChatMessage} from '../../utils/types';

/**
 * Round 2 (chat anchor): the conversation stays anchored at its newest message,
 * like a messaging app. Display-only — it only moves the window scroll.
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

    const anchor = useCallback((smooth = false) => {
        const root = panel.current;
        if (!root?.isConnected) return;
        const items = root.querySelectorAll<HTMLElement>('.ds-consult-msg');
        const loadingEl = root.querySelector<HTMLElement>('.ds-consult-loading');
        if (items.length <= 1 && !loadingEl) return;
        const last = loadingEl ?? items[items.length - 1];
        const follow = loadingEl ? null : root.querySelector<HTMLElement>('.ds-consult-followups');
        const composer = root.querySelector<HTMLElement>('.ds-consult-composer');
        const vv = window.visualViewport;
        const y = window.scrollY;
        const top = last.getBoundingClientRect().top + y;
        const bottom = (follow ?? last).getBoundingClientRect().bottom + y;
        const visibleTop = (vv?.offsetTop ?? 0) + 12;
        let bandBottom = window.innerHeight - 12;
        if (composer) {
            const stuckAt = parseFloat(getComputedStyle(composer).bottom) || 0;
            bandBottom = window.innerHeight - stuckAt - composer.offsetHeight - 12;
        }
        let target = bottom - bandBottom;
        if (bottom - top > bandBottom - visibleTop) target = top - visibleTop;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target = Math.max(0, Math.min(max, Math.round(target)));
        if (Math.abs(target - y) < 2) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({top: target, behavior: smooth && !reduce ? 'smooth' : 'auto'});
    }, []);

    // Newest message / waiting state changed → follow it (smoothly).
    const newest = messages[messages.length - 1];
    const key = `${messages.length}:${newest?.id ?? ''}:${waiting ? 1 : 0}`;
    const firstRun = useRef(true);
    useLayoutEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            anchor(false);
            return;
        }
        // let the new card lay out (markdown, details) before measuring
        const id = requestAnimationFrame(() => anchor(true));
        return () => cancelAnimationFrame(id);
    }, [key, anchor]);

    // Page shown again (tab entry) → land on the newest message, no animation.
    // Its tab tapped again while here → glide back to the newest message.
    useEffect(() => {
        const onShown = (e: Event) => {
            if ((e as CustomEvent).detail !== 'CONSULT') return;
            requestAnimationFrame(() => anchor(false));
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

    // Typing: focus and keyboard resizes keep the newest message above the composer.
    useEffect(() => {
        const vv = window.visualViewport;
        let timer = 0;
        const typingHere = () => {
            const el = document.activeElement;
            return !!el && el.id === 'chat-input-box' && !!panel.current?.contains(el);
        };
        const later = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => { if (typingHere()) anchor(false); }, 120);
        };
        const onFocus = (e: FocusEvent) => {
            if ((e.target as HTMLElement | null)?.id === 'chat-input-box') later();
        };
        document.addEventListener('focusin', onFocus);
        vv?.addEventListener('resize', later);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('focusin', onFocus);
            vv?.removeEventListener('resize', later);
        };
    }, [anchor]);

    return panel;
}
