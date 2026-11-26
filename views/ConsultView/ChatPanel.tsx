import type {ConsultViewModel} from './useConsultViewModel';
import type {PreferenceQuestion, PreferenceOption, ChatOptionComparison} from '../../utils/types';
import ReactMarkdown from 'react-markdown';
import {UI_ICON_DEFAULTS, uiIcons, type UiIconName} from '../../components/ui';
import {
    SHORTCUT_QUESTIONS,
    PREFERENCE_SUBMITTED_MARKER,
    buildPreferenceSubmitMessage,
    countPreferenceAnswers,
    followUpMessage,
} from './consultText';

/** Display-only line icon for a shortcut chip (by position; the sent text is untouched). */
const SHORTCUT_ICONS: UiIconName[] = ['chart', 'warning', 'meal', 'medication', 'eye'];

/** Display-only line icon for a preference value category. */
const VALUE_CATEGORY_ICONS: Record<string, UiIconName> = {
    Effectiveness: 'effectiveness',
    Safety: 'privacy',
    "Administration/Pain": 'injection',
    Cost: 'cost',
    Convenience: 'convenience',
    "Quality of Life": 'qualityOfLife',
    Autonomy: 'autonomy',
    "Psychological Burden": 'support'
};

function Icon({name, size = UI_ICON_DEFAULTS.size, className}: {name: UiIconName; size?: number; className?: string}) {
    const Glyph = uiIcons[name];
    return <Glyph size={size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} className={className} aria-hidden="true" />;
}

/** Shortcut labels keep their emoji in consultText.ts; the chip shows a line icon instead. */
function shortcutLabelText(label: string) {
    return label.replace(/^[^\s]+\s+/, '');
}

export function ChatPanel({vm}: {vm: ConsultViewModel}) {
    const {
        attachedImage,
        chatInput,
        chatLoading,
        chatMessages,
        chatSavedQs,
        expandedDetailedSections,
        expandedDiscussionPoints,
        fileInputRef,
        handleSendChatMessage,
        isListening,
        isOtherSelected,
        otherCustomText,
        renderBulletPoints,
        saveDoctorQuestions,
        selectedPreferenceOptions,
        setAttachedImage,
        setChatInput,
        setChatSavedQs,
        setExpandedDetailedSections,
        setExpandedDiscussionPoints,
        setIsOtherSelected,
        setOtherCustomText,
        setSelectedPreferenceOptions,
        showToast,
        toggleVoiceInput
    } = vm;

    const canSend = !((!chatInput.trim() && !attachedImage) || chatLoading);

    return (
            <div className="ds-consult-panel">
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
                                    <div className="ds-consult-bubble t-body">
                                        {/* 附加圖片呈現 */}
                                        {msg.imageAttachment?.previewUrl && (
                                            <div className="ds-consult-bubble-photo">
                                                <img
                                                    src={msg.imageAttachment.previewUrl}
                                                    alt="藥物相片"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="ds-consult-bubble-photo-cap t-caption">
                                                    <Icon name="camera" size={16} />
                                                    <span>已附帶藥物 / 處方相片分析</span>
                                                </div>
                                            </div>
                                        )}

                                        {msg.content.includes(PREFERENCE_SUBMITTED_MARKER) ? (
                                            <div className="ds-consult-prefsent">
                                                <div className="ds-consult-prefsent-head t-body-strong">
                                                    <Icon name="target" size={18} />
                                                    <span>已確認我的控糖偏好考量：</span>
                                                </div>
                                                <div className="ds-consult-prefsent-chips">
                                                    {(() => {
                                                        const matches = [...msg.content.matchAll(/【(.*?)】/g)].map(m => m[1]);
                                                        if (matches.length === 0) return <span className="t-caption">（無選擇）</span>;
                                                        
                                                        return matches.map((keyword, kIdx) => {
                                                            const lines = msg.content.split('\n');
                                                            const matchingLine = lines.find((l: string) => l.includes(`【${keyword}】`)) || '';
                                                            const starsMatch = matchingLine.match(/重要程度：(⭐+)/);
                                                            const stars = starsMatch ? starsMatch[1] : '';
                                                            
                                                            return (
                                                                <span 
                                                                    key={kIdx} 
                                                                    className="ds-consult-prefsent-chip t-body-strong"
                                                                >
                                                                    <Icon name="check" size={16} />
                                                                    <span>{keyword}</span>
                                                                    {stars && (
                                                                        <span className="ds-consult-prefsent-stars t-caption">
                                                                            {stars}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ds-consult-md">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({node, ...props}) => <p {...props} />,
                                                        strong: ({node, ...props}) => <strong {...props} />,
                                                        ul: ({node, ...props}) => <ul {...props} />,
                                                        li: ({node, ...props}) => <li {...props} />,
                                                    }}
                                                >
                                                    {msg.content ? msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n') : ''}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* AI 整合式回應卡片 (Integrated Layout) */
                                    <div className="ds-consult-card">
                                        
                                        {/* Node 1: 分級分類安全防護卡片（純文字聯絡資訊，不設一鍵撥號避免誤觸） */}
                                        {(msg.safety?.triggered || msg.safety?.isEmergency) && (() => {
                                            const safety = msg.safety;
                                            const isMental = safety.category === 'mental_health';
                                            const severity = safety.severity || (safety.isEmergency ? 'EMERGENCY' : 'CAUTION');

                                            const theme = isMental
                                                ? {
                                                      wrapper: 'bg-indigo-50/90 border-b-2 border-indigo-300 text-indigo-950',
                                                      box: 'bg-white/95 border-indigo-100',
                                                      heading: 'text-indigo-900',
                                                      badge: 'bg-indigo-100 text-indigo-800',
                                                      contactBg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950',
                                                      icon: '💛',
                                                      tag: '暖心支援'
                                                  }
                                                : severity === 'EMERGENCY'
                                                ? {
                                                      wrapper: 'bg-rose-50 border-b-2 border-rose-500 text-rose-950',
                                                      box: 'bg-white/95 border-rose-200',
                                                      heading: 'text-rose-800',
                                                      badge: 'bg-rose-600 text-white',
                                                      contactBg: 'bg-rose-50 border-rose-200 text-rose-950',
                                                      icon: '🚨',
                                                      tag: '緊急安全警示'
                                                  }
                                                : severity === 'URGENT'
                                                ? {
                                                      wrapper: 'bg-orange-50 border-b-2 border-orange-400 text-orange-950',
                                                      box: 'bg-white/95 border-orange-200',
                                                      heading: 'text-orange-800',
                                                      // Stage 5: badge orange-500 → orange-700 (same family) so white text reaches 4.5:1.
                                                      badge: 'bg-orange-700 text-white',
                                                      contactBg: 'bg-orange-50 border-orange-200 text-orange-950',
                                                      icon: '⚠️',
                                                      tag: '儘快求醫提醒'
                                                  }
                                                : {
                                                      wrapper: 'bg-amber-50/85 border-b-2 border-amber-300 text-amber-950',
                                                      box: 'bg-white/95 border-amber-200/80',
                                                      heading: 'text-amber-900',
                                                      badge: 'bg-amber-200/90 text-amber-950',
                                                      contactBg: 'bg-amber-50/80 border-amber-200 text-amber-950',
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

                                        {/* Node 3: 偏好釐清卡片 (Value Preference Cards - 基於文獻與 PDA 標準維度) */}
                                        {msg.activeNode === 3 && msg.preferenceQuestions && msg.preferenceQuestions.length > 0 && (
                                            <div className="ds-consult-sec ds-consult-pref">
                                                {msg.preferenceQuestions.map((pq: PreferenceQuestion) => {
                                                    const msgId = msg.id || index.toString();
                                                    const pqSelections = selectedPreferenceOptions[msgId]?.[pq.id] || {};
                                                    const otherActive = isOtherSelected[msgId]?.[pq.id] || false;
                                                    
                                                    const hasSelection = Object.keys(pqSelections).length > 0 || (otherActive && (otherCustomText[msgId]?.[pq.id] || "").trim().length > 0);

                                                    return (
                                                        <div key={pq.id} className="ds-consult-pref-q">
                                                            <div className="ds-consult-pref-q-head">
                                                                <p className="t-label ds-consult-pref-q-text">{pq.questionText}</p>
                                                                <p className="t-caption ds-consult-pref-hint">
                                                                    點擊卡片即可直接選取您最看重的考量（可多選）
                                                                </p>
                                                                {hasSelection && (
                                                                    <span className="ds-consult-pref-count t-caption">
                                                                        <Icon name="check" size={16} />
                                                                        已選 {Object.keys(pqSelections).length + (otherActive && (otherCustomText[msgId]?.[pq.id] || "").trim().length > 0 ? 1 : 0)} 項
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="ds-consult-pref-opts">
                                                                {pq.options.map((opt: PreferenceOption, optIdx: number) => {
                                                                    const iconName = VALUE_CATEGORY_ICONS[opt.valueCategory] || 'insight';
                                                                    const isSelected = !!pqSelections[opt.label];
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            key={optIdx}
                                                                            aria-pressed={isSelected}
                                                                            onClick={() => {
                                                                                setSelectedPreferenceOptions(prev => {
                                                                                    const next = { ...prev };
                                                                                    const currentMsg = next[msgId] || {};
                                                                                    const currentPq = { ...(currentMsg[pq.id] || {}) };
                                                                                    if (isSelected) {
                                                                                        delete currentPq[opt.label];
                                                                                    } else {
                                                                                        currentPq[opt.label] = {
                                                                                            questionText: pq.questionText,
                                                                                            label: opt.label,
                                                                                            valueCategory: opt.valueCategory
                                                                                        };
                                                                                    }
                                                                                    next[msgId] = {
                                                                                        ...currentMsg,
                                                                                        [pq.id]: currentPq
                                                                                    };
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            className="ds-consult-opt ds-control"
                                                                        >
                                                                            <span className="ds-consult-opt-icon"><Icon name={iconName} /></span>
                                                                            <span className="ds-consult-opt-text">
                                                                                <span className="t-label">{opt.label}</span>
                                                                                {opt.description && (
                                                                                    <span className="t-caption ds-consult-opt-desc">{opt.description}</span>
                                                                                )}
                                                                            </span>
                                                                            <span className="ds-consult-opt-check"><Icon name="check" size={16} /></span>
                                                                        </button>
                                                                    );
                                                                })}

                                                                {/* "Other" Card */}
                                                                <button
                                                                    type="button"
                                                                    aria-pressed={otherActive}
                                                                    onClick={() => {
                                                                        setIsOtherSelected(prev => ({
                                                                            ...prev,
                                                                            [msgId]: {
                                                                                ...(prev[msgId] || {}),
                                                                                [pq.id]: !otherActive
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="ds-consult-opt ds-control"
                                                                >
                                                                    <span className="ds-consult-opt-icon"><Icon name="note" /></span>
                                                                    <span className="ds-consult-opt-text">
                                                                        <span className="t-label">其他個人考量 / 補充想法</span>
                                                                        <span className="t-caption ds-consult-opt-desc">若以上標準維度未涵蓋您的特別顧慮或生活習慣，請點選此項並自定義填寫</span>
                                                                    </span>
                                                                    <span className="ds-consult-opt-check"><Icon name="check" size={16} /></span>
                                                                </button>
                                                            </div>

                                                            {/* Custom text area displayed when "Other" is active */}
                                                            {otherActive && (
                                                                <div className="ds-consult-pref-other">
                                                                    <label className="t-body-strong" htmlFor={`pref-other-${msgId}-${pq.id}`}>
                                                                        請輸入您的具體想法或顧慮：
                                                                    </label>
                                                                    <textarea
                                                                        id={`pref-other-${msgId}-${pq.id}`}
                                                                        value={otherCustomText[msgId]?.[pq.id] || ""}
                                                                        onChange={(e) => {
                                                                            setOtherCustomText(prev => ({
                                                                                ...prev,
                                                                                [msgId]: {
                                                                                    ...(prev[msgId] || {}),
                                                                                    [pq.id]: e.target.value
                                                                                }
                                                                            }));
                                                                        }}
                                                                        rows={2}
                                                                        placeholder="例如：擔心與其他慢性病藥物相互作用、希望知道能否配合夜班作息等..."
                                                                        className="ds-consult-field t-body ds-control"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Submit Button Container */}
                                                <div className="ds-consult-pref-submit-row">
                                                    <p className="t-caption ds-consult-pref-hint">
                                                        選擇您最在意的 1～2 項考量後點擊確認，AI 將為您量身盤點方案利弊對比。
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const msgId = msg.id || index.toString();
                                                            const combinedMessage = buildPreferenceSubmitMessage(
                                                                msg.preferenceQuestions,
                                                                selectedPreferenceOptions[msgId] || {},
                                                                isOtherSelected[msgId] || {},
                                                                otherCustomText[msgId] || {}
                                                            );
                                                            if (combinedMessage === null) return;
                                                            handleSendChatMessage(combinedMessage);
                                                        }}
                                                        disabled={(() => {
                                                            const msgId = msg.id || index.toString();
                                                            return countPreferenceAnswers(
                                                                msg.preferenceQuestions,
                                                                selectedPreferenceOptions[msgId] || {},
                                                                isOtherSelected[msgId] || {},
                                                                otherCustomText[msgId] || {}
                                                            ) === 0;
                                                        })()}
                                                        className="ds-consult-primary ds-control"
                                                    >
                                                        <Icon name="check" />
                                                        <span>確認提交我的偏好考量</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

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
                                                                        {renderBulletPoints(opt.pros, true, "text-xs", "font-semibold")}
                                                                    </div>
                                                                    <div className="ds-consult-cons">
                                                                        <p className="t-body-strong">
                                                                            {isKnowledgeComparison ? '⚠️ 注意事項／限制' : '⚠️ 顧慮隱憂 (Cons)'}
                                                                        </p>
                                                                        {renderBulletPoints(opt.cons, false, "text-xs", "font-semibold")}
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
                                                                <div className="ds-consult-pros">{renderBulletPoints(opt.pros, true, "text-[11px]", "font-medium")}</div>
                                                                <div className="ds-consult-cons">{renderBulletPoints(opt.cons, false, "text-[11px]", "font-medium")}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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

                {/* 隱藏的檔案/相機輸入 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                                const base64Data = result.split(',')[1];
                                setAttachedImage({
                                    base64: base64Data,
                                    mimeType: file.type || 'image/jpeg',
                                    previewUrl: result,
                                    name: file.name
                                });
                            }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                    }}
                />

                {/* 對話輸入區域：文字框在上，工具列在下，不再互相覆蓋 */}
                <div className="ds-consult-composer">
                    {/* 已選相片預覽條 */}
                    {attachedImage && (
                        <div className="ds-consult-attach">
                            <img
                                src={attachedImage.previewUrl}
                                alt="預覽"
                                referrerPolicy="no-referrer"
                            />
                            <div className="ds-consult-attach-text">
                                <p className="t-body-strong">
                                    已選取藥物/處方相片
                                </p>
                                <p className="t-caption">
                                    點擊發送將自動辨識藥名、劑量並進行多模態問答
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAttachedImage(null)}
                                aria-label="移除相片"
                                title="移除相片"
                                className="ds-icon-btn ds-icon-btn-plain ds-control ds-consult-attach-remove"
                            >
                                <Icon name="close" />
                            </button>
                        </div>
                    )}

                    <label htmlFor="chat-input-box" className="ds-sr-only">輸入您的控糖疑問</label>
                    <textarea
                        id="chat-input-box"
                        className="ds-consult-input t-body ds-control"
                        rows={3}
                        placeholder={attachedImage ? "可補充您的提問（例如：我食呢隻藥成日胃唔舒服，有冇影響？）..." : "請在此輸入或直接使用語音，詢問您的控糖疑問..."}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChatMessage(chatInput);
                            }
                        }}
                    />
                    <div className="ds-consult-tools">
                        {/* 相機/相片上傳按鈕 */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="拍照或上傳相片/食物/藥物包裝"
                            aria-label="拍照或上傳相片"
                            className="ds-consult-tool ds-control"
                        >
                            <Icon name="camera" />
                        </button>

                        {/* 語音輸入按鈕 */}
                        <button
                            type="button"
                            onClick={toggleVoiceInput}
                            title={isListening ? "正在聆聽語音... 點擊結束" : "點擊開始語音輸入"}
                            aria-pressed={isListening}
                            className={`ds-consult-tool ds-consult-voice ds-control${isListening ? ' is-listening' : ''}`}
                        >
                            <Icon name={isListening ? 'stop' : 'mic'} />
                            <span className="t-label">
                                {isListening ? '錄音中... 點擊結束' : '語音輸入'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSendChatMessage(chatInput)}
                            disabled={(!chatInput.trim() && !attachedImage) || chatLoading}
                            className={`ds-consult-send ds-control${canSend ? '' : ' is-idle'}`}
                            title="發送提問"
                            aria-label="發送提問"
                        >
                            <Icon name="send" />
                            <span className="ds-consult-send-label">發送</span>
                        </button>
                    </div>
                </div>

                {/* 常用話題快捷按鍵 */}
                {chatMessages.length <= 1 && (
                    <div className="ds-consult-shortcuts">
                        <p className="t-label ds-consult-shortcuts-title">快捷提問：</p>
                        <div className="ds-consult-shortcut-list">
                            {SHORTCUT_QUESTIONS.map((topic, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => handleSendChatMessage(topic.text)}
                                    className="ds-consult-shortcut ds-control"
                                >
                                    <Icon name={SHORTCUT_ICONS[i] || 'consult'} />
                                    <span>{shortcutLabelText(topic.label)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="ds-consult-disclaimer t-caption">
                    <Icon name="privacy" size={18} />
                    <span>專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準。所有對話僅供共同決策 (SDM) 及覆診前備忘，不作直接個體化臨床診斷。</span>
                </p>
            </div>
    );
}
