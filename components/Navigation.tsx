/**
 * 底部導航欄組件（階段三外殼）
 *
 * 五個入口，標籤保持全稱：首頁 / 血糖紀錄 / 問 AI / 問題紀錄 / 個人檔案。
 * 「問 AI」與首頁「問問 AI」主卡相同：setView(View.Consult) 並把 consultStep 設為 'INPUT'。
 */

import React from 'react';
import {View, type ConsultStep} from '../utils/types';
import {UI_ICON_DEFAULTS, uiIcons, type UiIconName} from './ui/icons';

interface NavigationProps {
    view: View;
    setView: (view: View) => void;
    setConsultStep?: (step: ConsultStep) => void;
}

const NAV_ITEMS: ReadonlyArray<{v: View; icon: UiIconName; l: string}> = [
    {v: View.Home, icon: 'home', l: '首頁'},
    {v: View.Glucose, icon: 'glucose', l: '血糖紀錄'},
    {v: View.Consult, icon: 'consult', l: '問 AI'},
    {v: View.SavedQuestions, icon: 'savedQuestions', l: '問題紀錄'},
    {v: View.Me, icon: 'profile', l: '個人檔案'},
];

export const Navigation: React.FC<NavigationProps> = ({view, setView, setConsultStep}) => {
    return (
        <nav className="ds-root ds-shell-nav print:hidden" aria-label="主要導覽">
            <div className="ds-shell-nav-bar">
                {NAV_ITEMS.map((item) => {
                    const isActive = view === item.v;
                    const Icon = uiIcons[item.icon];
                    const isAi = item.v === View.Consult;

                    return (
                        <button
                            key={item.v}
                            type="button"
                            onClick={() => {
                                setView(item.v);
                                if (isAi) setConsultStep?.('INPUT');
                            }}
                            aria-current={isActive ? 'page' : undefined}
                            className={`ds-shell-tab ds-control${isAi ? ' ds-shell-tab-ai' : ''}`}
                        >
                            <span className="ds-shell-tab-icon" aria-hidden>
                                <Icon size={24} strokeWidth={isActive ? 2.25 : UI_ICON_DEFAULTS.strokeWidth} />
                            </span>
                            <span className="ds-shell-tab-label">{item.l}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
