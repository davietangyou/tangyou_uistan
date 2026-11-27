import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {RecordTimeRow} from './RecordTimeRow';
import {RecordPeriodRow} from './RecordPeriodRow';
import {GlucoseDetails} from './GlucoseDetails';
import {glucoseStatus} from '../recordStatus';
import {Icon, returnDialogFocusTo} from '../../../components/ui';

export function GlucoseEntryForm({vm, onSaved}: {vm: GlucoseViewModel; onSaved?: () => void}) {
    const {
        addGlucoseRecord,
        handleSetTime,
        newGlucose,
        setActiveAccordion,
        setIsPeriodPickerOpen,
        setIsTimePickerOpen,
        setNewGlucose,
        setSaveSuccessMessage
    } = vm;

    const liveStatus = newGlucose.value && !isNaN(parseFloat(newGlucose.value)) ? glucoseStatus(newGlucose.value, newGlucose.timeType) : null;
    const liveVal = liveStatus ? parseFloat(newGlucose.value) : 0;

    return (
        <section className="ds-card ds-rec-form" aria-label="登記血糖">
            <RecordTimeRow vm={vm} label="測量時間" />
            <RecordPeriodRow vm={vm} label="測量時段" />

            {/* 血糖數值 */}
            <div className="ds-rec-row ds-rec-value-row">
                <div className="ds-rec-row-head">
                    <label htmlFor="glucose-value-input" className="t-label">血糖數值</label>
                    {newGlucose.value && (
                        <button
                            type="button"
                            onClick={() => setNewGlucose((prev) => ({ ...prev, value: '' }))}
                            className="ds-btn ds-btn-ghost ds-control ds-rec-clear"
                        >
                            <Icon name="close" />
                            <span>清除</span>
                        </button>
                    )}
                </div>
                <div className="ds-rec-number">
                    <input
                        id="glucose-value-input"
                        data-verify="glucose-value"
                        type="number"
                        step="0.1"
                        min="0"
                        inputMode="decimal"
                        placeholder="請輸入"
                        value={newGlucose.value || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                setNewGlucose((prev) => ({ ...prev, value: '' }));
                            } else {
                                const num = parseFloat(val);
                                if (!isNaN(num) && num < 0) {
                                    setNewGlucose((prev) => ({ ...prev, value: '0' }));
                                } else {
                                    setNewGlucose((prev) => ({ ...prev, value: val }));
                                }
                            }
                        }}
                        className="ds-rec-number-input ds-control"
                    />
                    <span className="ds-rec-unit">mmol/L</span>
                </div>

                {liveStatus === 'low' && (
                    <div className="ds-rec-alert is-low" role="status">
                        <Icon name="warning" className="ds-rec-alert-icon" />
                        <div>
                            <p className="t-body-strong">低血糖警報 ({liveVal} mmol/L)</p>
                            <p className="t-body">數值低於 4.0，請立即補充 15g 快速碳水化合物（如果汁或糖果），15分鐘後重測。</p>
                        </div>
                    </div>
                )}
                {liveStatus === 'high' && (
                    <div className="ds-rec-alert is-high" role="status">
                        <Icon name="glucoseHigh" className="ds-rec-alert-icon" />
                        <div>
                            <p className="t-body-strong">血糖偏高 ({liveVal} mmol/L)</p>
                            <p className="t-body">超出標準範圍，建議飲用溫開水，並記錄下方飲食與運動細節。</p>
                        </div>
                    </div>
                )}
                {liveStatus === 'normal' && (
                    <div className="ds-rec-alert is-normal" role="status">
                        <Icon name="check" className="ds-rec-alert-icon" />
                        <p className="t-body-strong">血糖正常理想（{liveVal} mmol/L），請繼續保持！</p>
                    </div>
                )}
            </div>

            <GlucoseDetails vm={vm} />

            {/* 底部操作 */}
            <div className="ds-rec-actions">
                <button
                    type="button"
                    data-verify="glucose-save"
                    onClick={() => {
                        if (!newGlucose.value) {
                            alert('請先輸入測量的血糖值（例如：5.5）噢！');
                            // R2-8: after 「知道了」 the cursor is in the value field, ready to type.
                            returnDialogFocusTo(document.getElementById('glucose-value-input'));
                            return;
                        }
                        if (!newGlucose.timeType) {
                            setNewGlucose((prev) => ({ ...prev, timeType: '空腹' }));
                        }
                        addGlucoseRecord();
                        setSaveSuccessMessage('🎉 血糖紀錄已成功儲存！');
                        setTimeout(() => setSaveSuccessMessage(null), 4500);

                        // 關閉展開項保持乾淨
                        setActiveAccordion(null);
                        setIsTimePickerOpen(false);
                        setIsPeriodPickerOpen(false);
                        handleSetTime(new Date(), true);
                        // S4: back to the page, where the saved banner and the new record show.
                        onSaved?.();
                    }}
                    className="ds-btn ds-btn-primary ds-btn-block ds-control"
                >
                    <Icon name="check" />
                    <span>完成儲存</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setNewGlucose({
                            value: '',
                            timeType: '空腹',
                            symptoms: [],
                            mealTag: undefined,
                            dietNote: '',
                            exerciseNote: '',
                            customTimestamp: undefined,
                            customDateStr: undefined
                        });
                        handleSetTime(new Date(), true);
                        setActiveAccordion(null);
                    }}
                    className="ds-btn ds-btn-ghost ds-btn-block ds-control"
                >
                    <Icon name="reset" />
                    <span>清空重填</span>
                </button>
            </div>
        </section>
    );
}
