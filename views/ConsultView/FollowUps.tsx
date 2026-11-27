import type {ConsultViewModel} from './useConsultViewModel';
import {Icon} from '../../components/ui';
import {followUpMessage} from './consultText';

/** Suggested follow-up questions under the thread. */
export function FollowUps({vm}: {vm: ConsultViewModel}) {
    const {chatLoading, chatMessages, handleSendChatMessage} = vm;
    return (
        <>
            {/* 推薦的下一步深入追問（如果當前處於安全攔截或等待長者選擇偏好，則不展示干擾選項） */}
            {(() => {
                const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
                if (lastAssistantMsg?.activeNode === 3 || lastAssistantMsg?.activeNode === 1 || lastAssistantMsg?.safety?.blockLLM) return null;
                const lastFollowUps = lastAssistantMsg?.suggestedFollowUps || [];
                if (lastFollowUps.length > 0 && !chatLoading) {
                    return (
                        <div className="ds-consult-followups">
                            <p className="ds-consult-sec-title t-label">
                                <Icon name="insight" />
                                <span>推薦的下一步深入追問（點擊即可快捷提問）：</span>
                            </p>
                            <div className="ds-consult-followup-list">
                                {lastFollowUps.map((q: string, idx: number) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => handleSendChatMessage(followUpMessage(q))}
                                        data-verify="followup"
                                        className="ds-consult-followup ds-control"
                                    >
                                        <Icon name="consult" />
                                        <span className="t-body-strong">{q}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                }
                return null;
            })()}
        </>
    );
}
