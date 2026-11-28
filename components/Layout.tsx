import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {View} from '../utils/types';
import {scrollRoot} from './shell/scrollRoot';
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

/** R2-4: bring a focused field into the part of the screen the keyboard leaves,
 * and out from under a pinned action bar (sticky 儲存 / 下一步 bars). A block
 * marked data-keyboard-reveal (a field with its own 確定 / 取消 row) is
 * revealed whole. */
function revealField(focused: HTMLElement, vv: VisualViewport) {
    const field = (focused.closest('[data-keyboard-reveal]') as HTMLElement | null) ?? focused;
    field.scrollIntoView({block: 'nearest'});
    let scroller: HTMLElement | null = field.parentElement;
    while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
    if (scroller === document.documentElement || scroller === document.body) scroller = null;
    // R2-10: the document no longer scrolls; the page scroller is the shell
    // canvas (unless a layer has clipped it, then nothing moves behind it).
    if (!scroller) {
        const root = scrollRoot();
        if (root.contains(field) && /(auto|scroll)/.test(getComputedStyle(root).overflowY)) scroller = root;
    }
    const scrollBy = (dy: number) => scroller?.scrollBy(0, dy);
    // Covered by the keyboard (page-level fields; fixed layers already end at it).
    const limit = vv.offsetTop + vv.height - 16;
    let r = field.getBoundingClientRect();
    if (r.bottom > limit) { scrollBy(r.bottom - limit); r = field.getBoundingClientRect(); }
    // Covered by a pinned bar (sticky 儲存 / 下一步) inside the same scroller.
    const hit = document.elementFromPoint(r.left + 8, r.bottom - 4) as HTMLElement | null;
    if (!hit || field.contains(hit) || hit.contains(field)) return;
    let bar: HTMLElement | null = hit;
    while (bar && !['sticky', 'fixed'].includes(getComputedStyle(bar).position)) bar = bar.parentElement;
    if (bar && !bar.contains(field) && !bar.classList.contains('ds-shell-mic')) scrollBy(r.bottom - bar.getBoundingClientRect().top + 12);
}

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

    // S5: on-screen keyboard up → html[data-keyboard] (CSS fades the nav so it is
    // not pushed up over the field). Read from visualViewport; pinch-zoom (scale
    // ≠ 1) and a keyboard with no focused text field do not count.
    //
    // iOS fix (2026-11-28, real-device test of the P5 build): Safari does not
    // shrink the layout viewport; it pans the visual viewport (offsetTop) to
    // show the focused field, by a different amount on every tap. Detection
    // therefore uses only how much shorter the visual viewport is than the
    // page at rest (no offsetTop, with hysteresis), and while the 問 AI input
    // is focused (html[data-kb-chat]) the page scroller itself is laid over
    // the visual viewport (--ds-vv-top / --ds-vv-h). The pinned composer then
    // rests on the keyboard with plain sticky bottom: 0, wherever Safari has
    // panned to; no transform rides on top of Safari's own movement.
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const root = document.documentElement;
        const isTyping = (el: Element | null): el is HTMLElement => !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['button', 'checkbox', 'radio', 'file', 'range', 'submit'].includes((el as HTMLInputElement).type)) || (el as HTMLElement).isContentEditable);
        let base = window.innerHeight; // page height with no keyboard
        let open = false;
        let chat = false;
        let lastInset = 0;
        let lastOffsetTop = 0;
        const composer = () => document.querySelector<HTMLElement>('.ds-consult-composer');
        const update = () => {
            const el = document.activeElement;
            const typing = isTyping(el);
            if (!typing) base = window.innerHeight;
            else base = Math.max(base, window.innerHeight);
            const covered = base - vv.height;
            const zoomed = Math.abs(vv.scale - 1) >= 0.01;
            // Opens past 100px (any phone keyboard), stays open down to 60px
            // so an address-bar or accessory-bar change mid-typing cannot
            // flicker it closed.
            const nextOpen = typing && !zoomed && covered > (open ? 60 : 100);
            const nextChat = nextOpen && (el as HTMLElement).id === 'chat-input-box';
            // Composer's on-screen top before the change, for a one-shot glide.
            const box = chat !== nextChat ? composer() : null;
            const before = box ? box.getBoundingClientRect().top - lastOffsetTop : 0;
            open = nextOpen;
            chat = nextChat;
            root.toggleAttribute('data-keyboard', open);
            root.toggleAttribute('data-kb-chat', chat);
            if (chat) {
                root.style.setProperty('--ds-vv-top', `${Math.round(vv.offsetTop)}px`);
                root.style.setProperty('--ds-vv-h', `${Math.round(vv.height)}px`);
            } else {
                root.style.removeProperty('--ds-vv-top');
                root.style.removeProperty('--ds-vv-h');
            }
            // Round 2: how much of the layout viewport the keyboard covers, so
            // pinned bars (問 AI composer, sub-page action bar, voice button)
            // can sit on top of it instead of underneath.
            const inset = open ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
            root.style.setProperty('--ds-kb-inset', `${inset}px`);
            lastOffsetTop = vv.offsetTop;
            if (box && box.isConnected) {
                // The new place is already final (correct on the first frame);
                // only the way there is animated, and it always ends at none.
                const after = box.getBoundingClientRect().top - vv.offsetTop;
                const dy = Math.round(before - after);
                const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                if (!reduce && Math.abs(dy) > 2 && Math.abs(dy) < window.innerHeight * 0.8 && typeof box.animate === 'function') {
                    box.animate([{transform: `translateY(${dy}px)`}, {transform: 'none'}], {duration: 300, easing: 'cubic-bezier(0.32, 0.72, 0, 1)'});
                }
            }
            // R2-4: keyboard opened (or changed height) → the field being typed
            // into is brought above it, whether it sits in the page, a sub-page
            // or a sheet. 問 AI anchors its own composer (useChatAnchor).
            if (open && inset !== lastInset && el && el.id !== 'chat-input-box') {
                const field = el as HTMLElement;
                requestAnimationFrame(() => {
                    if (document.activeElement === field) revealField(field, vv);
                });
            }
            lastInset = inset;
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
        // During focusout the field is still document.activeElement: look
        // again next frame, so closing starts with the keyboard, not after it.
        let blurFrame = 0;
        const onFocusOut = () => {
            update();
            cancelAnimationFrame(blurFrame);
            blurFrame = requestAnimationFrame(update);
        };
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        document.addEventListener('focusin', update);
        document.addEventListener('focusout', onFocusOut);
        document.addEventListener('input', onInput);
        return () => {
            cancelAnimationFrame(growFrame);
            cancelAnimationFrame(blurFrame);
            document.removeEventListener('input', onInput);
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            document.removeEventListener('focusin', update);
            document.removeEventListener('focusout', onFocusOut);
            root.removeAttribute('data-keyboard');
            root.removeAttribute('data-kb-chat');
            root.style.removeProperty('--ds-kb-inset');
            root.style.removeProperty('--ds-vv-top');
            root.style.removeProperty('--ds-vv-h');
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
