import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {View} from '../utils/types';
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
const COMPACT_HEADER_VIEWS = new Set<View>([View.Home, View.SavedQuestions, View.Me, View.Onboarding]);

export const Layout: React.FC<LayoutProps> = ({children, isLargeFont, setIsLargeFont, view}) => {
    const isHome = view === View.Home;
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
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const root = document.documentElement;
        const update = () => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['button', 'checkbox', 'radio', 'file', 'range', 'submit'].includes((el as HTMLInputElement).type)) || el.isContentEditable);
            const open = typing && Math.abs(vv.scale - 1) < 0.01 && window.innerHeight - vv.height > 150;
            root.toggleAttribute('data-keyboard', open);
        };
        vv.addEventListener('resize', update);
        document.addEventListener('focusout', update);
        return () => {
            vv.removeEventListener('resize', update);
            document.removeEventListener('focusout', update);
            root.removeAttribute('data-keyboard');
        };
    }, []);

    return (
        <div className="ds-shell-canvas">
            <div className={`ds-shell-column min-h-screen flex flex-col ${isLargeFont ? 'large-font' : ''}`}>
                <header ref={headerRef} className={`ds-root ds-shell-header${isHome ? ' ds-shell-header-home' : ''}${isCompact ? ' ds-shell-header-compact' : ''}`}>
                    <div className="ds-shell-brand">
                        {isHome && <p className="ds-shell-eyebrow">DiaGuide HK</p>}
                        <h1 className={`ds-shell-title ${isHome ? 'ds-sr-only' : ''}`}>糖友導航</h1>
                    </div>
                    {setIsLargeFont && (
                        <button
                            type="button"
                            onClick={() => setIsLargeFont(!isLargeFont)}
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

                <footer className="ds-root ds-shell-footer">
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
