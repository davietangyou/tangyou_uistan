import React from 'react';
import {View} from '../utils/types';

interface LayoutProps {
    children: React.ReactNode;
    onReset?: () => void;
    isLargeFont?: boolean;
    setIsLargeFont?: (val: boolean) => void;
    view?: View;
}

export const Layout: React.FC<LayoutProps> = ({children, onReset, isLargeFont, setIsLargeFont, view}) => {
    const isHome = view === View.Home;

    return (
        <div className={`min-h-screen flex flex-col max-w-lg mx-auto bg-[#FBFBFA] ${isLargeFont ? 'large-font' : ''}`}>
            <header className={`${isHome ? 'p-4 pb-0' : 'p-6 pb-2'} space-y-3 animate-soft`}>
                <div className="flex justify-between items-center">
                    <div className="space-y-1 min-w-0">
                        <p className="text-[#7FA0B4] text-xs font-black tracking-[0.2em] uppercase">DiaGuide HK</p>
                        <h1 className={`${isHome ? 'text-2.5xl sm:text-3.5xl' : 'text-3.5xl'} font-black text-[#4A6E85] tracking-tight`}>糖友導航</h1>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {setIsLargeFont && (
                            <button
                                onClick={() => setIsLargeFont(!isLargeFont)}
                                className={`flex items-center gap-1 active:scale-95 border rounded-full px-2.5 py-1.5 transition-all cursor-pointer shadow-xs ${
                                    isLargeFont 
                                        ? 'bg-[#4A6E85] text-white border-[#4A6E85] font-black' 
                                        : 'bg-white text-[#4A6E85] border-slate-200/80 hover:bg-slate-50 font-bold'
                                }`}
                                title={isLargeFont ? "切換至標準字型" : "切換至老友大字"}
                            >
                                <span className="text-sm">👵🏻</span>
                                <span className="text-[11px] tracking-wide">
                                    {isLargeFont ? "標準字" : "放大字"}
                                </span>
                            </button>
                        )}
                        {onReset && (
                            <button
                                onClick={onReset}
                                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-base hover:bg-slate-50 active:scale-95 transition-all shadow-xs border border-slate-200/60 cursor-pointer"
                            >
                                🏠
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className={`flex-grow ${isHome ? 'px-4' : 'px-6'}`}>
                {children}
            </main>

            <footer className={`px-6 ${isHome ? 'pt-2 pb-24' : 'pt-8 pb-36'} text-center space-y-3`}>
                <p className="text-[#2C3E50] text-[10px] font-black tracking-widest uppercase opacity-30">
                    AI 輔助衛教工具 · 數據加密守護 · 非醫療診斷
                </p>
            </footer>
        </div>
    );
};
