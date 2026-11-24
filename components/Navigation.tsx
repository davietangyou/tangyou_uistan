/**
 * src/components/Navigation.tsx
 *
 * 底部導航欄組件
 */

import React from 'react';
import {View} from '../utils/types';

interface NavigationProps {
    view: View;
    setView: (view: View) => void;
    showDetailTab: boolean;
    showAdminTab: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({view, setView, showDetailTab, showAdminTab}) => {

    const navItems = [
        {v: View.Home, i: '🏠', l: '首頁', show: true},
        {v: View.Glucose, i: '🩸', l: '血糖紀錄', show: true},
        {v: View.SavedQuestions, i: '📝', l: '問題紀錄', show: true},
        {v: View.Me, i: '👤', l: '個人檔案', show: true},
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 px-6 pb-10 print:hidden">
            <div className="max-w-md mx-auto nav-blur bg-[#E8DED2]/90 rounded-[2.5rem] flex items-center justify-around px-8 py-3 shadow-[0_20px_50px_rgba(74,110,133,0.15)] ring-4 ring-white backdrop-blur-xl">
                {navItems
                    .filter(item => item.show)
                    .map(item => {
                        const isActive = view === item.v;

                        return (
                            <button
                                key={item.v}
                                onClick={() => setView(item.v)}
                                className={`flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100 grayscale'}`}
                            >
                                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-2xl transition-all duration-500 shadow-sm ${isActive ? 'bg-[#4A6E85] text-white shadow-[#4A6E85]/20 scale-105' : 'bg-white/50'}`}>
                                    {item.i}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${isActive ? 'text-[#4A6E85]' : 'text-slate-500'}`}>
                                    {item.l}
                                </span>
                            </button>
                        );
                    })}
            </div>
        </nav>
    );
};
