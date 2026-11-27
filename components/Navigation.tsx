/**
 * 底部導航欄組件（階段三外殼）
 *
 * 五個入口。S5（業主 t20u）：標籤改為與被仿側同式的兩字：首頁 / 紀錄 / 問 AI / 問題 / 我的
 * （頁內標題仍是「血糖紀錄」「問題紀錄」「個人檔案」）。
 * 階段 S2：懸浮白色膠囊 + 一塊炭黑滑塊（全 app 唯一的「你在這裡」），切頁時滑塊平移 200ms；
 * 進入子頁時整條導航收起（見 shell.css 的 html[data-subpages]）。
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
    {v: View.Glucose, icon: 'glucose', l: '紀錄'},
    {v: View.Consult, icon: 'consult', l: '問 AI'},
    {v: View.SavedQuestions, icon: 'savedQuestions', l: '問題'},
    {v: View.Me, icon: 'profile', l: '我的'},
];

function returnToRest(v: View) {
    if (v === View.Consult) {
        window.dispatchEvent(new CustomEvent('ds:tab-retap', {detail: v}));
        return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});
}

export const Navigation: React.FC<NavigationProps> = ({view, setView, setConsultStep}) => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.v === view);
    const barStyle = {'--nav-index': Math.max(activeIndex, 0)} as React.CSSProperties;
    return (
        <nav className="ds-root ds-shell-nav print:hidden" aria-label="主要導覽">
            <div className={`ds-shell-nav-bar${activeIndex < 0 ? ' is-idle' : ''}`} style={barStyle}>
                <span className="ds-shell-nav-slider" aria-hidden />
                {NAV_ITEMS.map((item) => {
                    const isActive = view === item.v;
                    const Icon = uiIcons[item.icon];
                    const isAi = item.v === View.Consult;

                    return (
                        <button
                            key={item.v}
                            type="button"
                            onClick={() => {
                                // Round 2: tapping the tab you are already on takes the page
                                // back to its resting place, as in native apps: the top of
                                // the page; for 問 AI the newest message (useChatAnchor).
                                if (isActive) returnToRest(item.v);
                                setView(item.v);
                                if (isAi) setConsultStep?.('INPUT');
                            }}
                            aria-current={isActive ? 'page' : undefined}
                            className={`ds-shell-tab ds-control${isAi ? ' ds-shell-tab-ai' : ''}`}
                        >
                            <span className="ds-shell-tab-icon" aria-hidden>
                                <Icon size={24} strokeWidth={isActive ? 2 : UI_ICON_DEFAULTS.strokeWidth} />
                            </span>
                            <span className="ds-shell-tab-label">{item.l}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
