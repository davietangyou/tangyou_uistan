import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PREDEFINED_SYMPTOMS, SYMPTOM_DETAILS } from '../constants';
import {VoiceButton} from './recordUi';
import type {UiIconName} from '../../../components/ui';
import {Icon} from '../../../components/ui';

// Quick tags are written into dietNote / exerciseNote verbatim — do not edit their text.
const DIET_TAGS = ['清淡少油', '多蔬菜/高纖', '白飯/澱粉主食', '茶餐廳/高油外賣', '低GI雜糧糙米', '水果甜點', '無糖茶飲', '少吃了一餐'];
const EXERCISE_TAGS = ['散步 20-30分鐘', '深蹲/坐站 15-20次', '太極 / 八段錦', '彈力帶/啞鈴肌力', '靠牆俯臥撐/提踵', '慢跑 / 快走', '居家伸展操', '做家務 / 走樓梯', '今天未做運動'];

function DetailToggle({icon, title, summary, open, filled, onClick}: {icon: UiIconName; title: string; summary?: string; open: boolean; filled: boolean; onClick: () => void}) {
    // The open/add cue sits right after the title, not at the far edge, so the floating mic never hides it.
    return (
        <button type="button" onClick={onClick} aria-expanded={open} className={`ds-rec-toggle ds-control${filled ? ' is-filled' : ''}`}>
            <span className="ds-rec-toggle-icon"><Icon name={filled && !open ? 'check' : icon} /></span>
            <span className="ds-rec-toggle-body">
                <span className="ds-rec-toggle-title">
                    <span className="t-label">{title}</span>
                    <Icon name={open ? 'expand' : 'add'} size={20} className={open ? 'ds-rec-chevron is-open' : 'ds-rec-chevron'} />
                </span>
                {summary && <span className="t-caption ds-rec-toggle-summary">{summary}</span>}
            </span>
        </button>
    );
}

/** 測量血糖值的其他資訊: diet, exercise and symptom panels of the glucose form. */
export function GlucoseDetails({vm}: {vm: GlucoseViewModel}) {
    const {activeAccordion, customSymptomText, handleAddCustomSymptom, handleRemoveCustomSymptom, handleVoiceInput, isListening, newGlucose, selectedCustomSymptoms, setActiveAccordion, setCustomSymptomText, setNewGlucose, voiceTarget} = vm;
    const symptomCount = newGlucose.symptoms ? newGlucose.symptoms.length : 0;

    return (
        <div className="ds-rec-details">
            <h3 className="t-label t-ink-2">測量血糖值的其他資訊</h3>

            <div className="ds-rec-detail">
                <DetailToggle
                    icon="meal"
                    title="吃了什麼"
                    summary={newGlucose.dietNote ? `已填：${newGlucose.dietNote}` : undefined}
                    open={activeAccordion === 'diet'}
                    filled={Boolean(newGlucose.dietNote)}
                    onClick={() => setActiveAccordion(activeAccordion === 'diet' ? null : 'diet')}
                />
                {activeAccordion === 'diet' && (
                    <div className="ds-rec-panel">
                        <div className="ds-cluster">
                            {DIET_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        setNewGlucose((prev) => ({
                                            ...prev,
                                            dietNote: prev.dietNote ? `${prev.dietNote}、${tag}` : tag
                                        }));
                                    }}
                                    className="ds-chip ds-control ds-rec-tag"
                                >
                                    <Icon name="add" size={18} />
                                    <span>{tag}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ds-rec-inline">
                            <input
                                type="text"
                                aria-label="吃了什麼"
                                placeholder="例如：半碗糙米飯、蒸肉餅、少油菜心"
                                value={newGlucose.dietNote || ''}
                                onChange={(e) => setNewGlucose((prev) => ({ ...prev, dietNote: e.target.value }))}
                                className="ds-field-control ds-control"
                            />
                            <VoiceButton live={isListening && voiceTarget === 'diet'} onClick={() => handleVoiceInput('diet')} title="語音輸入食物" />
                        </div>
                    </div>
                )}
            </div>

            <div className="ds-rec-detail">
                <DetailToggle
                    icon="exercise"
                    title="做了什麼運動"
                    summary={newGlucose.exerciseNote ? `已填：${newGlucose.exerciseNote}` : undefined}
                    open={activeAccordion === 'exercise'}
                    filled={Boolean(newGlucose.exerciseNote)}
                    onClick={() => setActiveAccordion(activeAccordion === 'exercise' ? null : 'exercise')}
                />
                {activeAccordion === 'exercise' && (
                    <div className="ds-rec-panel">
                        <div className="ds-cluster">
                            {EXERCISE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        setNewGlucose((prev) => ({
                                            ...prev,
                                            exerciseNote: prev.exerciseNote ? `${prev.exerciseNote}、${tag}` : tag
                                        }));
                                    }}
                                    className="ds-chip ds-control ds-rec-tag"
                                >
                                    <Icon name="add" size={18} />
                                    <span>{tag}</span>
                                </button>
                            ))}
                        </div>
                        <div className="ds-rec-inline">
                            <input
                                type="text"
                                aria-label="做了什麼運動"
                                placeholder="例如：飯後公園散步 25 分鐘"
                                value={newGlucose.exerciseNote || ''}
                                onChange={(e) => setNewGlucose((prev) => ({ ...prev, exerciseNote: e.target.value }))}
                                className="ds-field-control ds-control"
                            />
                            <VoiceButton live={isListening && voiceTarget === 'exercise'} onClick={() => handleVoiceInput('exercise')} title="語音輸入運動" />
                        </div>
                    </div>
                )}
            </div>

            <div className="ds-rec-detail">
                <DetailToggle
                    icon="symptom"
                    title="有什麼症狀"
                    summary={symptomCount > 0 ? `已選 ${symptomCount} 個症狀（${newGlucose.symptoms!.join('、')}）` : undefined}
                    open={activeAccordion === 'symptoms'}
                    filled={symptomCount > 0}
                    onClick={() => setActiveAccordion(activeAccordion === 'symptoms' ? null : 'symptoms')}
                />
                {activeAccordion === 'symptoms' && (
                    <div className="ds-rec-panel">
                        <div className="ds-rec-checklist">
                            {PREDEFINED_SYMPTOMS.map((symptomId) => {
                                const detail = SYMPTOM_DETAILS[symptomId] || { icon: '❓', name: symptomId };
                                const isSelected = newGlucose.symptoms?.includes(symptomId) || false;
                                return (
                                    <button
                                        key={symptomId}
                                        type="button"
                                        onClick={() => {
                                            let next = [...(newGlucose.symptoms || [])];
                                            if (next.includes(symptomId)) {
                                              next = next.filter(x => x !== symptomId);
                                            } else {
                                              next.push(symptomId);
                                            }
                                            setNewGlucose((prev) => ({ ...prev, symptoms: next }));
                                        }}
                                        aria-pressed={isSelected}
                                        className="ds-rec-check ds-control"
                                    >
                                        <span className="ds-rec-checkbox" aria-hidden>{isSelected && <Icon name="check" size={18} />}</span>
                                        <span>{detail.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="ds-rec-inline">
                            <input
                                type="text"
                                aria-label="手動補充其他不適"
                                className="ds-field-control ds-control"
                                placeholder="手動補充其他不適"
                                value={customSymptomText}
                                onChange={(e) => setCustomSymptomText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomSymptom();
                                    }
                                }}
                            />
                            <VoiceButton live={isListening && voiceTarget === 'symptom'} onClick={() => handleVoiceInput('symptom')} title="語音錄音" />
                        </div>
                        <button type="button" onClick={handleAddCustomSymptom} className="ds-btn ds-btn-secondary ds-control">
                            加入
                        </button>

                        {selectedCustomSymptoms.length > 0 && (
                            <div className="ds-cluster">
                                {selectedCustomSymptoms.map((sym) => (
                                    <button
                                        key={sym}
                                        type="button"
                                        onClick={() => handleRemoveCustomSymptom(sym)}
                                        aria-label={`移除 ${sym}`}
                                        className="ds-chip ds-chip-selected ds-control"
                                    >
                                        <span>{sym}</span>
                                        <Icon name="close" size={18} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
