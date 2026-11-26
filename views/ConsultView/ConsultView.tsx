import React from 'react';
import {View} from '../../utils/types';
import type {ConsultViewProps} from './types';
import {useConsultViewModel} from './useConsultViewModel';
import {ChatPanel} from './ChatPanel';
import {QuickMemoModal} from './QuickMemoModal';

export const ConsultView: React.FC<ConsultViewProps> = (props) => {
    const vm = useConsultViewModel(props);
    const {
        loading,
        isLargeFont,
        toastMessage,
        setView,
        setIsQuickMemoOpen,
        profile,
        chatMessages,
        handleClearChatHistory,
    } = vm;

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center space-y-10 animate-soft text-center">
            <div className="relative mx-auto">
                <div className="w-20 h-20 border-4 border-[#4A6E85]/10 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#4A6E85] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-3">
                <p className="text-[#4A6E85] text-xl font-black tracking-wider">正在為您細心整理資料...</p>
                <p className="text-slate-400 font-medium">請稍候，多智能體糖尿病健康建議即將送達</p>
            </div>
        </div>
    );

    return (
        <div className={`space-y-4 animate-soft relative ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            
            {/* 浮動提示 Toast (存入問題清單成功反饋) */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="flex items-center gap-2.5 bg-emerald-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/40 text-xs sm:text-sm font-black backdrop-blur-md">
                        <span>✨</span>
                        <span>{toastMessage}</span>
                        <button
                            onClick={() => setView(View.SavedQuestions)}
                            className="ml-2 underline text-emerald-200 hover:text-white cursor-pointer"
                        >
                            查看清單 ➔
                        </button>
                    </div>
                </div>
            )}

            {/* 頂部操作列：隨手記問診備忘 + 開啟新對話 */}
            <div className="flex items-center justify-between gap-2 max-w-xl mx-auto px-1 flex-wrap">
                <button
                    type="button"
                    onClick={() => setIsQuickMemoOpen(true)}
                    className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                    title="聊天時隨手記下想問醫生的問題"
                >
                    <span>📝</span>
                    <span>隨手記問診備忘</span>
                    <span className="bg-amber-200/80 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {(profile.savedDoctorQuestions || []).length}
                    </span>
                </button>

                {chatMessages.length > 1 && (
                    <button
                        type="button"
                        onClick={handleClearChatHistory}
                        className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                        title="清空對話紀錄並開啟新對話"
                    >
                        <span>🗑️</span>
                        <span>開啟新對話</span>
                    </button>
                )}
            </div>

            <ChatPanel vm={vm} />

            <QuickMemoModal vm={vm} />

        </div>
    );
};
