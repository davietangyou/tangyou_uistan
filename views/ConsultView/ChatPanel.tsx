import type {ConsultViewModel} from './useConsultViewModel';
import type {ChatMessage, ChatOptionComparison} from '../../utils/types';
import ReactMarkdown from 'react-markdown';
import {Icon} from '../../components/ui';
import {AnswerDetails} from './AnswerDetails';
import {Composer} from './Composer';
import {FollowUps} from './FollowUps';
import {PreferenceCard} from './PreferenceCard';
import {Shortcuts} from './Shortcuts';
import {UserBubble} from './UserBubble';
import {useChatAnchor} from './useChatAnchor';

/** Consult thread and composer. Most message cards, the follow-ups, composer and
 * shortcuts live in their own files next to this one (pure moves, Stage 11).
 * SafetyCard and AnswerSummary stay in this file: their locked copy is pinned
 * to ChatPanel.tsx by the verify locked-copy contract. */
export function ChatPanel({vm}: {vm: ConsultViewModel}) {
    const {chatLoading, chatMessages} = vm;
    const panelRef = useChatAnchor(chatMessages, chatLoading);

    return (
            <div ref={panelRef} className="ds-consult-panel">
                {/* S4b: disclaimer leads the page, quiet caption (moved from below the composer). */}
                <p className="ds-consult-disclaimer t-caption">
                    <Icon name="privacy" size={18} />
                    <span>專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準。所有對話僅供共同決策 (SDM) 及覆診前備忘，不作直接個體化臨床診斷。</span>
                </p>

                {/* 歡迎與對話歷史 */}
                <div className="ds-consult-thread">
                    {chatMessages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        
                        return (
                            <div key={msg.id || index} className={`ds-consult-msg ${isUser ? 'is-user' : 'is-ai'}`}>
                                <div className="ds-consult-sender t-caption">
                                    {isUser ? (
                                        <span>您</span>
                                    ) : (
                                        <>
                                            <span className="ds-consult-sender-mark"><Icon name="askAi" size={14} /></span>
                                            <span>AI小助手</span>
                                        </>
                                    )}
                                </div>

                                {/* 對話氣泡 / 訊息卡片 */}
                                {isUser ? (
                                    <UserBubble msg={msg} />
                                ) : (
                                    /* AI 整合式回應卡片 (Integrated Layout) */
                                    <div className="ds-consult-card">
                                        
                                        <SafetyCard msg={msg} />

                                        {/* 1. 溫暖同理開頭與親切點題 (Empathetic Opening) */}
                                        {msg.content && (
                                            <div className="ds-consult-sec ds-consult-md t-body">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({node, ...props}) => <p {...props} />,
                                                        strong: ({node, ...props}) => <strong {...props} />,
                                                        ul: ({node, ...props}) => <ul {...props} />,
                                                        li: ({node, ...props}) => <li {...props} />,
                                                    }}
                                                >
                                                    {msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n')}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        <PreferenceCard vm={vm} msg={msg} index={index} />

                                        <AnswerSummary vm={vm} msg={msg} />

                                        <AnswerDetails vm={vm} msg={msg} index={index} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* AI 正在推理中 */}
                    {chatLoading && (
                        <div className="ds-consult-loading" role="status" aria-live="polite">
                            <p className="t-body-strong ds-consult-loading-text">
                                <Icon name="loading" className="ds-consult-spin" />
                                <span>正在為您查詢控糖指引與醫學建議，請稍候...</span>
                            </p>
                            <div className="ds-consult-skeleton" aria-hidden="true">
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </div>

                <FollowUps vm={vm} />

                <Shortcuts vm={vm} />

                {/* S4b: composer last, sticky above the bottom bar (chat-app layout). */}
                <Composer vm={vm} />

            </div>
    );
}

/** Node 1 safety card (text-only contacts, no dial links), shown when the safety gate triggered. */
function SafetyCard({msg}: {msg: ChatMessage}) {
    return (
        <>
            {/* Node 1: 分級分類安全防護卡片（純文字聯絡資訊，不設一鍵撥號避免誤觸） */}
            {(msg.safety?.triggered || msg.safety?.isEmergency) && (() => {
                const safety = msg.safety;
                const isMental = safety.category === 'mental_health';
                const severity = safety.severity || (safety.isEmergency ? 'EMERGENCY' : 'CAUTION');

                // S4b: levels drawn from design tokens (consult.css .ds-consult-safety.is-*);
                // four distinguishable levels, emoji + badge text unchanged (G13).
                const theme = isMental
                    ? {
                          wrapper: 'is-mental',
                          box: '',
                          heading: '',
                          badge: '',
                          contactBg: '',
                          icon: '💛',
                          tag: '暖心支援'
                      }
                    : severity === 'EMERGENCY'
                    ? {
                          wrapper: 'is-emergency',
                          box: '',
                          heading: '',
                          badge: '',
                          contactBg: '',
                          icon: '🚨',
                          tag: '緊急安全警示'
                      }
                    : severity === 'URGENT'
                    ? {
                          wrapper: 'is-urgent',
                          box: '',
                          heading: '',
                          badge: '',
                          contactBg: '',
                          icon: '⚠️',
                          tag: '儘快求醫提醒'
                      }
                    : {
                          wrapper: 'is-caution',
                          box: '',
                          heading: '',
                          badge: '',
                          contactBg: '',
                          icon: '🛡️',
                          tag: '安全處理速查'
                      };

                const steps: string[] = Array.isArray(safety.actionSteps) ? safety.actionSteps : [];
                const contacts: { label: string; number: string; note?: string }[] = Array.isArray(safety.contacts) ? safety.contacts : [];

                return (
                    <div className={`ds-consult-safety ${theme.wrapper}`}>
                        <div className="ds-consult-safety-head">
                            <div className="ds-consult-safety-title">
                                <span className="ds-consult-safety-icon" aria-hidden="true">{theme.icon}</span>
                                <h4 className="t-title">
                                    {safety.title || '安全提醒'}
                                </h4>
                            </div>
                            <span className={`ds-consult-safety-badge t-caption ${theme.badge}`}>
                                {theme.tag}
                            </span>
                        </div>

                        {safety.message && (
                            <p className="t-body-strong">
                                {safety.message}
                            </p>
                        )}

                        {steps.length > 0 && (
                            <div className={`ds-consult-safety-steps ${theme.box}`}>
                                <p className={`t-body-strong ${theme.heading}`}>
                                    建議處理步驟：
                                </p>
                                <ol className="t-body">
                                    {steps.map((step, sIdx) => (
                                        <li key={sIdx}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {contacts.length > 0 && (
                            <div className="ds-consult-safety-contacts">
                                <div className="ds-consult-safety-grid">
                                    {contacts.map((c, cIdx) => (
                                        <div key={cIdx} className={`ds-consult-safety-contact ${theme.contactBg}`}>
                                            <span className="t-caption ds-consult-safety-contact-label">
                                                {c.label}
                                            </span>
                                            <span className="t-h2 ds-consult-safety-number">
                                                {c.number}
                                            </span>
                                            {c.note && (
                                                <span className="t-caption">
                                                    {c.note}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="t-caption ds-consult-safety-misdial">
                                    ℹ️ 為避免誤觸撥號，以上號碼僅作清晰展示；如情況危急，請立即請身邊家人協助或自行使用電話致電。
                                </p>
                            </div>
                        )}
                    </div>
                );
            })()}
        </>
    );
}

/** Structured comparison card and key takeaways of an AI answer. */
function AnswerSummary({vm, msg}: {vm: ConsultViewModel; msg: ChatMessage}) {
    const {renderBulletPoints} = vm;
    return (
        <>
            {/* 2. 結構化重點對比卡片 (直接展示，不隱藏於摺疊區) */}
            {(() => {
                const comparisonItems = msg.detailedVersion?.optionComparison?.length
                    ? msg.detailedVersion.optionComparison
                    : (msg.optionsComparison || []);
                if (msg.activeNode === 3 || msg.activeNode === 1 || msg.safety?.blockLLM || comparisonItems.length === 0) {
                    return null;
                }
                const isKnowledgeComparison = msg.comparisonKind === 'knowledge';
                return (
                    <div className="ds-consult-sec ds-consult-compare">
                        <p className="ds-consult-sec-title t-label">
                            <Icon name="compare" />
                            <span>
                                {isKnowledgeComparison
                                    ? '重點對比一覽'
                                    : '治療方案利弊考量（供覆診與醫生商討）'}
                            </span>
                        </p>
                        <div className="ds-consult-compare-list">
                            {comparisonItems.map((opt: ChatOptionComparison, optIdx: number) => (
                                <div key={optIdx} className="ds-consult-compare-item">
                                    <div className="ds-consult-compare-name">
                                        <span className="ds-consult-num t-caption">
                                            {optIdx + 1}
                                        </span>
                                        <span className="t-label">
                                            {opt.option}
                                        </span>
                                    </div>
                                    <div className="ds-consult-compare-cols">
                                        <div className="ds-consult-pros">
                                            <p className="t-body-strong">
                                                {isKnowledgeComparison ? '👍 主要優勢／特點' : '👍 優勢效益 (Pros)'}
                                            </p>
                                            {renderBulletPoints(opt.pros, true)}
                                        </div>
                                        <div className="ds-consult-cons">
                                            <p className="t-body-strong">
                                                {isKnowledgeComparison ? '⚠️ 注意事項／限制' : '⚠️ 顧慮隱憂 (Cons)'}
                                            </p>
                                            {renderBulletPoints(opt.cons, false)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* 3. 重點速覽 (Key Takeaways / Brief Version) - 簡潔緊湊的綠色重點列表 */}
            {msg.activeNode !== 3 && msg.activeNode !== 1 && !msg.safety?.blockLLM && msg.briefVersion?.takeHomeMessages && msg.briefVersion.takeHomeMessages.length > 0 && (
                <div className="ds-consult-sec ds-consult-brief">
                    <h4 className="ds-consult-sec-title t-label">
                        <Icon name="insight" />
                        <span>重點速覽</span>
                    </h4>

                    <ul className="ds-consult-brief-list">
                        {msg.briefVersion.takeHomeMessages.map((item: string, iIdx: number) => {
                            const normalizedItem = item.replace(/\\n/g, '\n');
                            return (
                                <li key={iIdx}>
                                    <span className="ds-consult-num t-caption">
                                        {iIdx + 1}
                                    </span>
                                    <span className="t-body ds-consult-brief-text">
                                        {normalizedItem.split(/\*\*(.*?)\*\*/g).map((part: string, pIdx: number) => {
                                            if (pIdx % 2 === 1) {
                                                return (
                                                    <strong key={pIdx}>
                                                        {part}
                                                    </strong>
                                                );
                                            }
                                            return part;
                                        })}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </>
    );
}
