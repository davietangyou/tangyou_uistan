import type {GlucoseViewModel} from '../useGlucoseViewModel';
import { PREDEFINED_SYMPTOMS } from '../constants';
import {RecordTimeRow} from './RecordTimeRow';
import {RecordPeriodRow} from './RecordPeriodRow';
import {VoiceButton} from './recordUi';
import {Icon} from '../../../components/ui';

export function SymptomEntryForm({vm, onSaved}: {vm: GlucoseViewModel; onSaved?: () => void}) {
    const {
        addGlucoseRecord,
        customSymptomText,
        handleAddCustomSymptom,
        handleRemoveCustomSymptom,
        handleVoiceInput,
        isListening,
        newGlucose,
        selectedCustomSymptoms,
        setCustomSymptomText,
        setNewGlucose,
        setSaveSuccessMessage
    } = vm;

    const count = newGlucose.symptoms ? newGlucose.symptoms.length : 0;

    return (
        <section className="ds-card ds-rec-form" aria-label="登記症狀">
            <RecordTimeRow vm={vm} label="紀錄時間" />
            <RecordPeriodRow vm={vm} label="紀錄時段" />

            {/* 身體症狀選擇（可多選） */}
            <div className="ds-rec-row">
                <div className="ds-rec-row-head">
                    <h3 className="t-label">身體症狀選擇（可多選）</h3>
                    {count > 0 && (
                        <span className="ds-rec-pill is-caution">已選 {count} 個</span>
                    )}
                </div>

                <div className="ds-rec-checklist">
                    {PREDEFINED_SYMPTOMS.map((symptomName) => {
                        const isSelected = newGlucose.symptoms?.includes(symptomName) || false;
                        return (
                            <button
                                key={symptomName}
                                type="button"
                                onClick={() => {
                                    let next = [...(newGlucose.symptoms || [])];
                                    if (next.includes(symptomName)) {
                                        next = next.filter(x => x !== symptomName);
                                    } else {
                                        next.push(symptomName);
                                    }
                                    setNewGlucose({ ...newGlucose, symptoms: next });
                                }}
                                aria-pressed={isSelected}
                                className="ds-rec-check ds-control"
                            >
                                <span className="ds-rec-checkbox" aria-hidden>{isSelected && <Icon name="check" size={18} />}</span>
                                <span>{symptomName}</span>
                            </button>
                        );
                    })}
                </div>

                {count > 0 && (
                    <button
                        type="button"
                        onClick={() => setNewGlucose({ ...newGlucose, symptoms: [] })}
                        className="ds-btn ds-btn-ghost ds-control ds-rec-clear"
                    >
                        <Icon name="close" />
                        <span>清除全部</span>
                    </button>
                )}
            </div>

            {/* 其他症狀自訂添加 */}
            <div className="ds-rec-row ds-rec-subpanel">
                <div className="ds-rec-row-head">
                    <h3 className="t-label">其他症狀自訂添加（支援多項或語音）</h3>
                    {isListening && (
                        <span className="ds-rec-pill is-low" role="status">正在聆聽語音...</span>
                    )}
                </div>
                <div className="ds-rec-inline">
                    <input
                        type="text"
                        aria-label="其他自訂症狀"
                        className="ds-field-control ds-control"
                        placeholder="輸入其他自訂症狀（如：胃脹、胸悶、腰痠，支援逗號或空格）"
                        value={customSymptomText}
                        onChange={(e) => setCustomSymptomText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSymptom();
                            }
                        }}
                    />
                    <VoiceButton live={isListening} onClick={() => handleVoiceInput('symptom')} title="點擊語音輸入" />
                </div>
                <button type="button" onClick={handleAddCustomSymptom} className="ds-btn ds-btn-secondary ds-control">
                    添加
                </button>

                {selectedCustomSymptoms.length > 0 && (
                    <div className="ds-rec-added">
                        <p className="t-caption t-ink-2">已添加自訂症狀（點擊 ✕ 移除）：</p>
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
                    </div>
                )}
            </div>

            {/* 儲存症狀紀錄 */}
            <div className="ds-rec-actions">
                <button
                    type="button"
                    onClick={() => {
                        if (!newGlucose.timeType) {
                            alert('請先選擇「測量時段」噢！');
                            return;
                        }
                        if (!newGlucose.symptoms || newGlucose.symptoms.length === 0) {
                            alert('請至少勾選或添加一項症狀噢！');
                            return;
                        }
                        const originalVal = newGlucose.value;
                        newGlucose.value = '';
                        addGlucoseRecord();
                        setSaveSuccessMessage('🎉 身體症狀紀錄儲存成功！');
                        setTimeout(() => setSaveSuccessMessage(null), 4500);
                        // S4: back to the page, where the saved banner and the new record show.
                        onSaved?.();
                    }}
                    disabled={!(newGlucose.symptoms && newGlucose.symptoms.length > 0)}
                    className="ds-btn ds-btn-primary ds-btn-block ds-control ds-rec-save"
                >
                    <span>儲存症狀紀錄</span>
                    <span className="ds-rec-save-count">已選 {count} 個症狀</span>
                </button>
            </div>
        </section>
    );
}
