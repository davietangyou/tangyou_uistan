import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {View} from '../utils/types';
import {installFocusModality, installTapFocus, isTyping, keyboardGeometry, KEYBOARD_LAYERS, revealField} from './shell/keyboard';
import {uiIcons} from './ui/icons';

// 全局免責聲明（鎖定級文案，不可改字）。只在「 · 」處斷行，讓分隔點留在行尾。
const DISCLAIMER = 'AI 輔助衛教工具 · 數據加密守護 · 非醫療診斷';
const DISCLAIMER_SEGMENTS = DISCLAIMER.split(' · ');

interface LayoutProps {
    children: React.ReactNode;
    isLargeFont?: boolean;
    setIsLargeFont?: (val: boolean) => void;
    view?: View;
}

/**
 * 應用外殼（階段三；階段 S2 同一設計師換皮）：頁頭、主內容、頁腳聲明。
 * 主分頁沒有可見的頁面標題（底部導航已說明「你在哪」）：頂部只留一行安靜的品牌眉標與字號切換膠囊，
 * 跟著內容一起捲走，首屏留給內容。首頁的品牌名「糖友導航」只對讀屏可見（DOM 文字保留）。
 * 返回首頁一律經底部導航。
 */
// S4: pages whose first heading shares the top row with the font toggle (one
// row of chrome). Each page marks that heading with `.ds-page-lead`.
const COMPACT_HEADER_VIEWS = new Set<View>([View.SavedQuestions, View.Me, View.Onboarding]);

export const Layout: React.FC<LayoutProps> = ({children, isLargeFont, setIsLargeFont, view}) => {
    const isHome = view === View.Home;
    const isOnboarding = view === View.Onboarding;
    const isCompact = view !== undefined && COMPACT_HEADER_VIEWS.has(view);
    const FontIcon = uiIcons.fontSize;
    const PrivacyIcon = uiIcons.privacy;
    const headerRef = useRef<HTMLElement>(null);

    // 把頁頭實際高度交給 CSS（階段十二起），供需要避讓頁頭的樣式使用。
    useLayoutEffect(() => {
        const header = headerRef.current;
        if (!header || typeof ResizeObserver === 'undefined') return;
        const root = document.documentElement;
        const update = () => root.style.setProperty('--shell-header-h', `${header.offsetHeight}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(header);
        return () => observer.disconnect();
    }, []);

    // Round 5: keyboard (Tab) focus vs tap focus, for the quiet field frame.
    useEffect(() => installFocusModality(), []);

    // S5: on-screen keyboard up → html[data-keyboard] (CSS fades the nav so it is
    // not pushed up over the field). Read from visualViewport; pinch-zoom (scale
    // ≠ 1) and a keyboard with no focused text field do not count.
    //
    // Keyboard (2026-11-28, aligned with the reference app's inputViewport):
    // the page frame (body, pinned) is measured, its visible part is
    // min(frame bottom, visualViewport.height) − frame top, and Safari's pan
    // (offsetTop) is not used to detect it. Open past 120px covered, stays open while
    // anything is covered. While the 問 AI input is focused the page scroller
    // takes that visible height (html[data-kb-canvas], --ds-canvas-h) with a
    // 240ms height transition, so the composer (sticky at its bottom) moves
    // with the keyboard. A tap on blank page closes the keyboard.
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const root = document.documentElement;
        const canvas = () => document.querySelector<HTMLElement>('[data-scroll-root]');
        let open = false;
        let chat = false;
        let lastInset = 0;
        let frameW = 0;
        let frameH = 0;
        let release = 0;
        let settle = 0;
        let lastField: Element | null = null;
        const update = () => {
            const el = document.activeElement;
            const typing = isTyping(el);
            const frame = document.body.getBoundingClientRect();
            const resized = frame.width !== frameW || frame.height !== frameH;
            frameW = frame.width;
            frameH = frame.height;
            // Beyond the reference: its surface ends at visualViewport.height, so
            // when Safari pans (offsetTop) the gap left above the keyboard is
            // exactly that pan. Ending at the visual viewport's bottom in page
            // terms (offsetTop + height) keeps the top still (no shift, no
            // flash; the pan just hides it) and the bottom on the keyboard.
            const {layoutHeight, covered, inset: keyboardInset, zoomed} = keyboardGeometry(frame, vv);
            open = typing && !zoomed && (open ? covered > 1 : covered > 120);
            // Round 4: every field on the page itself (not in a sub-page, sheet
            // or dialog) gets the canvas treatment 問 AI has; fields in those
            // layers get the layer's own padding (--ds-kb-inset, CSS).
            const inLayer = open && !!(el as HTMLElement).closest(KEYBOARD_LAYERS);
            const box = canvas();
            const pageField = open && !inLayer && !!box?.contains(el);
            const nextChat = pageField && !!(el as HTMLElement).closest('.ds-consult');
            root.toggleAttribute('data-keyboard', open);
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            root.style.setProperty('--ds-kb-motion', resized || reduce ? '0ms' : 'var(--ds-kb-duration, 240ms)');
            if (pageField) {
                window.clearTimeout(release);
                if (!root.hasAttribute('data-kb-canvas')) {
                    // Start from the full frame in px so the height can animate.
                    root.style.setProperty('--ds-canvas-h', `${Math.round(frame.height)}px`);
                    root.setAttribute('data-kb-canvas', '');
                    void box?.offsetHeight;
                }
                root.style.setProperty('--ds-canvas-h', `${Math.round(layoutHeight)}px`);
            } else if (chat || root.hasAttribute('data-kb-canvas')) {
                // Grow back to the full frame, then hand sizing back to inset: 0.
                root.style.setProperty('--ds-canvas-h', `${Math.round(frame.height)}px`);
                window.clearTimeout(release);
                release = window.setTimeout(() => {
                    if (root.hasAttribute('data-kb-chat') || root.hasAttribute('data-kb-page')) return;
                    root.removeAttribute('data-kb-canvas');
                    root.style.removeProperty('--ds-canvas-h');
                }, reduce ? 0 : 320);
            }
            chat = nextChat;
            root.toggleAttribute('data-kb-chat', chat);
            root.toggleAttribute('data-kb-page', pageField);
            // Round 2: how much of the layout viewport the keyboard covers, so
            // pinned bars (問 AI composer, sub-page action bar, voice button)
            // can sit on top of it instead of underneath.
            const inset = open ? keyboardInset : 0;
            root.style.setProperty('--ds-kb-inset', `${inset}px`);
            // Round 4: what the user can actually see while it is up (Safari's
            // pan hides the top of a layer), so sheets and dialogs fit in it.
            if (open) root.style.setProperty('--ds-kb-visible', `${Math.round(vv.height)}px`);
            else root.style.removeProperty('--ds-kb-visible');
            if (hud) {
                if (open && !wasOpenForHud) { peak.n++; peak.y = 0; peak.top = 0; peak.canvas = 0; }
                if (open) {
                    peak.y = Math.max(peak.y, window.scrollY);
                    peak.top = Math.max(peak.top, vv.offsetTop);
                    peak.canvas = Math.max(peak.canvas, Math.round(box?.scrollTop ?? 0));
                } else if (peak.y || peak.top || peak.canvas || peak.n) {
                    lastPeak = `last open #${peak.n}: max scrollY ${Math.round(peak.y)} offsetTop ${Math.round(peak.top)} canvasScroll ${peak.canvas}`;
                }
                wasOpenForHud = open;
                hud.style.transform = `translateY(${Math.round(vv.offsetTop)}px)`;
            }
            if (hud) hud.textContent = `inner ${window.innerHeight} client ${root.clientHeight} frame ${Math.round(frame.top)}/${Math.round(frame.height)}\nvv ${Math.round(vv.height)} top ${Math.round(vv.offsetTop)} scale ${vv.scale.toFixed(2)} scrollY ${Math.round(window.scrollY)}\ncovered ${Math.round(covered)} open ${open} chat ${chat} canvas ${Math.round(box?.getBoundingClientRect().bottom ?? 0)} scroll ${Math.round(box?.scrollTop ?? 0)}\n${lastPeak}`;
            // R2-4: keyboard opened (or changed height) → the field being typed
            // into is brought above it, whether it sits in the page, a sub-page
            // or a sheet. 問 AI anchors its own composer (useChatAnchor).
            // Round 4: also when focus moves to another field with the keyboard
            // up (tap or the accessory bar's ∧ ∨), and once more after the
            // 240ms height change, when the scroller can scroll that far.
            if (open && el && el.id !== 'chat-input-box' && (inset !== lastInset || el !== lastField)) {
                const field = el as HTMLElement;
                requestAnimationFrame(() => {
                    if (document.activeElement === field) revealField(field, vv);
                });
                window.clearTimeout(settle);
                settle = window.setTimeout(() => {
                    if (document.activeElement === field && root.hasAttribute('data-keyboard')) revealField(field, vv, true);
                }, 280);
            }
            lastInset = inset;
            lastField = open ? el : null;
        };
        // ?kbdebug: live numbers on a real phone (nothing is shown otherwise).
        let hud: HTMLElement | null = null;
        const peak = {n: 0, y: 0, top: 0, canvas: 0};
        let lastPeak = '';
        let wasOpenForHud = false;
        if (/[?&]kbdebug\b/.test(window.location.search)) {
            hud = document.createElement('pre');
            hud.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);left:4px;right:4px;z-index:9999;margin:0;padding:4px 6px;font:11px/1.3 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.72);border-radius:6px;pointer-events:none;white-space:pre-wrap';
            document.body.appendChild(hud);
        }
        // Like rAF-coalesced focus changes in the reference; viewport events
        // are applied at once.
        let pending = 0;
        const schedule = () => {
            if (!pending) pending = requestAnimationFrame(() => { pending = 0; update(); });
        };
        const updateNow = () => {
            cancelAnimationFrame(pending);
            pending = 0;
            update();
        };
        // R2-9: a growing text box (two-line question fields grow with what is
        // typed) keeps itself and its 確定 / 取消 above the keyboard.
        let growFrame = 0;
        const onInput = (e: Event) => {
            const field = e.target as HTMLElement | null;
            if (!field || field.tagName !== 'TEXTAREA' || field.id === 'chat-input-box' || !root.hasAttribute('data-keyboard')) return;
            cancelAnimationFrame(growFrame);
            growFrame = requestAnimationFrame(() => {
                if (document.activeElement === field) revealField(field, vv);
            });
        };
        // Reference: a still tap on blank page (not a control, no text being
        // selected) while typing closes the keyboard.
        const interactive = 'input,textarea,select,button,a,label,summary,[role="button"],[role="link"],[role="slider"],[role="checkbox"],[role="radio"],[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"])';
        const appRoot = document.getElementById('root');
        const blank = (t: EventTarget | null) => t instanceof Element && !!appRoot?.contains(t) && !t.closest(interactive);
        let tap: {id: number; x: number; y: number; field: HTMLElement; moved: boolean} | null = null;
        const onDown = (e: PointerEvent) => {
            const f = document.activeElement;
            tap = e.isPrimary && e.button === 0 && blank(e.target) && isTyping(f) ? {id: e.pointerId, x: e.clientX, y: e.clientY, field: f, moved: false} : null;
        };
        const onMove = (e: PointerEvent) => {
            if (tap?.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) tap.moved = true;
        };
        const onCancel = () => { tap = null; };
        const onUp = (e: PointerEvent) => {
            const t = tap;
            tap = null;
            if (!t || t.id !== e.pointerId || t.moved || !blank(e.target) || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8 || !window.getSelection()?.isCollapsed || document.activeElement !== t.field) return;
            t.field.blur();
        };
        for (const type of ['focusin', 'focusout', 'input']) document.addEventListener(type, schedule);
        document.addEventListener('input', onInput);
        // The document never scrolls (R2-10). If Safari scrolls it anyway to
        // reveal a field while the keyboard is up, put it back so the frame
        // (and the composer on the keyboard) stays where the layout put it.
        const onWindowScroll = () => {
            if (open && (window.scrollY !== 0 || root.scrollTop !== 0)) window.scrollTo(0, 0);
            updateNow();
        };
        vv.addEventListener('resize', updateNow);
        vv.addEventListener('scroll', updateNow);
        window.addEventListener('resize', updateNow);
        window.addEventListener('scroll', onWindowScroll, {passive: true});
        const removeTapFocus = installTapFocus();
        document.addEventListener('pointerdown', onDown, true);
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', onUp, true);
        document.addEventListener('pointercancel', onCancel, true);
        update();
        return () => {
            cancelAnimationFrame(growFrame);
            cancelAnimationFrame(pending);
            window.clearTimeout(release);
            for (const type of ['focusin', 'focusout', 'input']) document.removeEventListener(type, schedule);
            document.removeEventListener('input', onInput);
            vv.removeEventListener('resize', updateNow);
            vv.removeEventListener('scroll', updateNow);
            window.removeEventListener('resize', updateNow);
            window.removeEventListener('scroll', onWindowScroll);
            document.removeEventListener('pointerdown', onDown, true);
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('pointerup', onUp, true);
            document.removeEventListener('pointercancel', onCancel, true);
            removeTapFocus();
            window.clearTimeout(settle);
            hud?.remove();
            for (const a of ['data-keyboard', 'data-kb-chat', 'data-kb-page', 'data-kb-canvas']) root.removeAttribute(a);
            for (const v of ['--ds-kb-inset', '--ds-kb-visible', '--ds-canvas-h', '--ds-kb-motion']) root.style.removeProperty(v);
        };
    }, []);

    return (
        <div className="ds-shell-canvas" data-scroll-root>
            <div className={`ds-shell-column min-h-screen flex flex-col ${isLargeFont ? 'large-font' : ''}`}>
                <header ref={headerRef} className={`ds-root ds-shell-header${isHome || isOnboarding ? ' ds-shell-header-home ds-shell-header-absorbed' : ''}${isCompact && !isOnboarding ? ' ds-shell-header-compact' : ''}`}>
                    <div className="ds-shell-brand">
                        {isHome && <p className="ds-shell-eyebrow">DiaGuide HK</p>}
                        <h1 className={`ds-shell-title ${isHome ? 'ds-sr-only' : ''}`}>糖友導航</h1>
                    </div>
                    {setIsLargeFont && !isHome && !isOnboarding && (
                        <button
                            type="button"
                            onClick={() => setIsLargeFont(!isLargeFont)}
                            data-verify="font-toggle"
                            className="ds-shell-font-toggle ds-control"
                            title={isLargeFont ? "切換至標準字型" : "切換至老友大字"}
                        >
                            <FontIcon size={20} strokeWidth={2} aria-hidden />
                            <span>{isLargeFont ? "標準字" : "放大字"}</span>
                        </button>
                    )}
                </header>

                <main className="ds-shell-main flex-grow">
                    {children}
                </main>

                <footer className={`ds-root ds-shell-footer${isHome || isOnboarding ? " ds-shell-footer-home" : ""}`}>
                    <p className="t-caption ds-shell-disclaimer">
                        <PrivacyIcon size={16} strokeWidth={2} aria-hidden />
                        <span>
                            {DISCLAIMER_SEGMENTS.map((segment, i) => (
                                <React.Fragment key={segment}>
                                    {i > 0 && ' '}
                                    <span className="ds-shell-disclaimer-seg">
                                        {segment}{i < DISCLAIMER_SEGMENTS.length - 1 && ' ·'}
                                    </span>
                                </React.Fragment>
                            ))}
                        </span>
                    </p>
                </footer>
            </div>
        </div>
    );
};
