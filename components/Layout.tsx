import React from 'react';
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
 * 應用外殼（階段三）：頁頭、主內容、頁腳聲明。
 * 只有外殼子樹帶 .ds-root；<main> 內的業務視圖仍沿用舊樣式與 .large-font 規則，直到各自的階段換皮。
 * 首頁保留品牌標題；其餘頁面只留精簡品牌列。返回首頁一律經底部導航（不再有重複的 🏠 按鈕）。
 */
export const Layout: React.FC<LayoutProps> = ({children, isLargeFont, setIsLargeFont, view}) => {
    const isHome = view === View.Home;
    const FontIcon = uiIcons.fontSize;
    const PrivacyIcon = uiIcons.privacy;

    return (
        <div className="ds-shell-canvas">
            <div className={`min-h-screen flex flex-col max-w-lg mx-auto ${isLargeFont ? 'large-font' : ''}`}>
                <header className={`ds-root ds-shell-header animate-soft ${isHome ? 'ds-shell-header-home' : ''}`}>
                    <div className="ds-shell-brand">
                        {isHome && <p className="ds-shell-eyebrow">DiaGuide HK</p>}
                        <h1 className={`ds-shell-title ${isHome ? 't-h1' : 't-title'}`}>糖友導航</h1>
                    </div>
                    {setIsLargeFont && (
                        <button
                            type="button"
                            onClick={() => setIsLargeFont(!isLargeFont)}
                            className={`ds-shell-font-toggle ds-control ${isLargeFont ? 'ds-shell-font-toggle-on' : ''}`}
                            title={isLargeFont ? "切換至標準字型" : "切換至老友大字"}
                        >
                            <FontIcon size={22} strokeWidth={2} aria-hidden />
                            <span>{isLargeFont ? "標準字" : "放大字"}</span>
                        </button>
                    )}
                </header>

                <main className={`flex-grow ${isHome ? 'px-4' : 'px-6'}`}>
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
