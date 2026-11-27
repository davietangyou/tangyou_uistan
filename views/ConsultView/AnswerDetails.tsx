import type {ConsultViewModel} from './useConsultViewModel';
import type {ChatMessage, ChatOptionComparison} from '../../utils/types';
import ReactMarkdown from 'react-markdown';
import {Icon} from '../../components/ui';

/** Detailed explanation and doctor-question disclosures, plus the legacy comparison fallback. */
export function AnswerDetails({vm, msg, index}: {vm: ConsultViewModel; msg: ChatMessage; index: number}) {
    const {chatSavedQs, expandedDetailedSections, expandedDiscussionPoints, renderBulletPoints, saveDoctorQuestions, setChatSavedQs, setExpandedDetailedSections, setExpandedDiscussionPoints, showToast} = vm;
    return (
        <>
            {/* 4. 詳細說明 (Detailed Version) - 輕量摺疊（僅在非偏好詢問階段且有文字解說時展示） */}
            {msg.activeNode !== 3 && msg.activeNode !== 1 && !msg.safety?.blockLLM && msg.detailedVersion?.generalExplanation && msg.detailedVersion.generalExplanation.trim().length > 0 && (
                <div className="ds-consult-fold">
                    <button
                        type="button"
                        aria-expanded={!!expandedDetailedSections[msg.id || index.toString()]}
                        onClick={() => {
                            const msgId = msg.id || index.toString();
                            setExpandedDetailedSections(prev => ({
                                ...prev,
                                [msgId]: !prev[msgId]
                            }));
                        }}
                        className="ds-consult-disclosure ds-control"
                    >
                        <span className="ds-consult-disclosure-label">
                            <Icon name="info" />
                            <span className="t-label">詳細說明</span>
                        </span>
                        <span className="ds-consult-disclosure-state t-caption">
                            {expandedDetailedSections[msg.id || index.toString()] ? '收合' : '點擊查看'}
                            <Icon name="expand" size={18} className="ds-consult-chevron" />
                        </span>
                    </button>

                    {expandedDetailedSections[msg.id || index.toString()] && (
                        <div className="ds-consult-fold-body ds-consult-md t-body">
                            <ReactMarkdown
                                components={{
                                    p: ({children}) => <p>{children}</p>,
                                    ul: ({children}) => <ul>{children}</ul>,
                                    ol: ({children}) => <ol>{children}</ol>,
                                    li: ({children}) => <li>{children}</li>,
                                    strong: ({children}) => <strong>{children}</strong>,
                                }}
                            >
                                {msg.detailedVersion.generalExplanation.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n')}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {/* 4. 下次覆診問醫生的問題 (Doctor Questions) - 智能按需展示（僅在非偏好詢問階段展示） */}
            {msg.activeNode !== 3 && msg.detailedVersion?.suggestedDiscussionPoints && msg.detailedVersion.suggestedDiscussionPoints.length > 0 && (
                <div className="ds-consult-fold">
                    <button
                        type="button"
                        aria-expanded={!!expandedDiscussionPoints[msg.id || index.toString()]}
                        onClick={() => {
                            const msgId = msg.id || index.toString();
                            setExpandedDiscussionPoints(prev => ({
                                ...prev,
                                [msgId]: !prev[msgId]
                            }));
                        }}
                        className="ds-consult-disclosure ds-control"
                    >
                        <span className="ds-consult-disclosure-label">
                            <Icon name="savedQuestions" />
                            <span className="t-label">想同醫生商討？點擊查看參考問題</span>
                        </span>
                        <span className="ds-consult-disclosure-state t-caption">
                            <span className="ds-consult-count">{msg.detailedVersion.suggestedDiscussionPoints.length} 題</span>
                            <Icon name="expand" size={18} className="ds-consult-chevron" />
                        </span>
                    </button>

                    {expandedDiscussionPoints[msg.id || index.toString()] && (
                        <div className="ds-consult-fold-body ds-consult-doctor">
                            <p className="t-caption ds-consult-doctor-hint">
                                點擊「+ 保存到備忘」，問題將自動加入您的專屬「問題紀錄」清單：
                            </p>
                            {msg.detailedVersion.suggestedDiscussionPoints.map((q: string, qIdx: number) => {
                                const isSaved = chatSavedQs[msg.id + "-det-" + qIdx] || false;
                                return (
                                    <div key={qIdx} className="ds-consult-doctor-q">
                                        <p className="t-body">
                                            {q}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isSaved) return;
                                                saveDoctorQuestions([q]);
                                                setChatSavedQs(prev => ({ ...prev, [msg.id + "-det-" + qIdx]: true }));
                                                showToast("已存入「問題紀錄」清單 🔖");
                                            }}
                                            aria-disabled={isSaved || undefined}
                                            className={`ds-consult-save ds-control${isSaved ? ' is-saved' : ''}`}
                                        >
                                            <Icon name={isSaved ? 'check' : 'add'} size={18} />
                                            <span>{isSaved ? "已保存" : "保存到備忘"}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Legacy fallback - optionsComparison & doctorQuestions if present on legacy data */}
            {msg.activeNode !== 3 && (!msg.briefVersion && !msg.detailedVersion) && msg.optionsComparison && msg.optionsComparison.length > 0 && (
                <div className="ds-consult-sec ds-consult-compare">
                    <p className="ds-consult-sec-title t-label">方案利弊對照盤：</p>
                    <div className="ds-consult-compare-list">
                        {msg.optionsComparison.map((opt: ChatOptionComparison, optIdx: number) => (
                            <div key={optIdx} className="ds-consult-compare-item">
                                <p className="t-label">{opt.option}</p>
                                <div className="ds-consult-compare-cols">
                                    <div className="ds-consult-pros">{renderBulletPoints(opt.pros, true)}</div>
                                    <div className="ds-consult-cons">{renderBulletPoints(opt.cons, false)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
