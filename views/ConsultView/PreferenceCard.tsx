import type {ConsultViewModel} from './useConsultViewModel';
import type {ChatMessage, PreferenceQuestion, PreferenceOption} from '../../utils/types';
import {Icon, type UiIconName} from '../../components/ui';
import {buildPreferenceSubmitMessage, countPreferenceAnswers} from './consultText';

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

/** Node 3 value-preference cards with the "other" field and the submit row. */
export function PreferenceCard({vm, msg, index}: {vm: ConsultViewModel; msg: ChatMessage; index: number}) {
    const {handleSendChatMessage, isOtherSelected, otherCustomText, selectedPreferenceOptions, setIsOtherSelected, setOtherCustomText, setSelectedPreferenceOptions} = vm;
    return (
        <>
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
        </>
    );
}
