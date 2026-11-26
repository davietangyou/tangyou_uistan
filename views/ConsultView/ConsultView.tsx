import React from 'react';
import {View} from '../../utils/types';
import {UI_ICON_DEFAULTS, uiIcons} from '../../components/ui';
import type {ConsultViewProps} from './types';
import {useConsultViewModel} from './useConsultViewModel';
import {ChatPanel} from './ChatPanel';
import {QuickMemoModal} from './QuickMemoModal';

export const ConsultView: React.FC<ConsultViewProps> = (props) => {
    const vm = useConsultViewModel(props);
    const {
        loading,
        toastMessage,
        setView,
        setIsQuickMemoOpen,
        profile,
        chatMessages,
        handleClearChatHistory,
    } = vm;

    const NoteIcon = uiIcons.note;
    const NewChatIcon = uiIcons.newChat;
    const LoadingIcon = uiIcons.loading;
    const Chevron = uiIcons.forward;

    if (loading) return (
        <div className="ds-root ds-consult ds-consult-busy" role="status" aria-live="polite">
            <LoadingIcon size={48} strokeWidth={1.75} className="ds-consult-spin ds-consult-busy-icon" aria-hidden="true" />
            <p className="t-title">正在為您細心整理資料...</p>
            <p className="t-body t-ink-2">請稍候，多智能體糖尿病健康建議即將送達</p>
        </div>
    );

    return (
        <div className="ds-root ds-consult">
            {/* Screen-reader page heading (the visible page uses the nav tab as its title) */}
            <h2 className="ds-sr-only">AI 控糖問答</h2>

            {/* 浮動提示 Toast (存入問題清單成功反饋) */}
            {toastMessage && (
                <div className="ds-consult-toast" role="status" aria-live="polite">
                    <span className="t-body-strong">{toastMessage}</span>
                    <button
                        type="button"
                        onClick={() => setView(View.SavedQuestions)}
                        className="ds-consult-toast-action ds-control"
                    >
                        <span>查看清單</span>
                        <Chevron size={18} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* 頂部操作列：隨手記問診備忘 + 開啟新對話 */}
            <div className="ds-consult-bar">
                <button
                    type="button"
                    onClick={() => setIsQuickMemoOpen(true)}
                    className="ds-consult-memo ds-control"
                    title="聊天時隨手記下想問醫生的問題"
                >
                    <NoteIcon size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden="true" />
                    <span>隨手記問診備忘</span>
                    <span className="ds-consult-memo-count t-caption">
                        {(profile.savedDoctorQuestions || []).length}
                    </span>
                </button>

                {chatMessages.length > 1 && (
                    <button
                        type="button"
                        onClick={handleClearChatHistory}
                        className="ds-consult-newchat ds-control"
                        title="清空對話紀錄並開啟新對話"
                    >
                        <NewChatIcon size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden="true" />
                        <span>開啟新對話</span>
                    </button>
                )}
            </div>

            <ChatPanel vm={vm} />

            <QuickMemoModal vm={vm} />

        </div>
    );
};
