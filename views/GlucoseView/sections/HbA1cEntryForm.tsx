import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {hba1cEntryTier} from '../recordStatus';
import {Icon} from '../../../components/ui';

export function HbA1cEntryForm({vm}: {vm: GlucoseViewModel}) {
    const {addHbA1cRecord, newHbA1c, setNewHbA1c} = vm;

    const hasVal = Boolean(newHbA1c.value && !isNaN(parseFloat(newHbA1c.value)));
    const val = hasVal ? parseFloat(newHbA1c.value) : 0;
    const tier = hasVal ? hba1cEntryTier(val) : null;

    return (
        <section className="ds-card ds-rec-form" aria-labelledby="hba1c-entry-title">
            <h2 id="hba1c-entry-title" className="t-title">紀錄糖化血紅素 (HbA1c) 數值</h2>

            <div className="ds-rec-row ds-rec-value-row">
                <label htmlFor="hba1c-value-input" className="t-label">糖化血紅素數值</label>
                <div className="ds-rec-number">
                    <input
                        id="hba1c-value-input"
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        className="ds-rec-number-input ds-control"
                        placeholder="6.0"
                        value={newHbA1c.value}
                        onChange={e => setNewHbA1c({...newHbA1c, value: e.target.value})}
                    />
                    <span className="ds-rec-unit">%</span>
                </div>

                {tier === 'excellent' && (
                    <div className="ds-rec-alert is-normal" role="status">
                        <Icon name="check" className="ds-rec-alert-icon" />
                        <p className="t-body-strong">太棒了！糖化血紅素控制在非糖尿病/非常理想的範圍。</p>
                    </div>
                )}
                {tier === 'good' && (
                    <div className="ds-rec-alert is-info" role="status">
                        <Icon name="check" className="ds-rec-alert-icon" />
                        <p className="t-body-strong">控制滿意！一般長者糖化血紅素控制在 7.0% 以下為良好。</p>
                    </div>
                )}
                {tier === 'fair' && (
                    <div className="ds-rec-alert is-high" role="status">
                        <Icon name="warning" className="ds-rec-alert-icon" />
                        <p className="t-body-strong">控制尚可。部分高齡或有併發症長者目標可放寬至 8.0% 以下，請遵循醫囑。</p>
                    </div>
                )}
                {tier === 'high' && (
                    <div className="ds-rec-alert is-low" role="status">
                        <Icon name="glucoseHigh" className="ds-rec-alert-icon" />
                        <div>
                            <p className="t-body-strong">數值偏高 ({val}%)</p>
                            <p className="t-body">糖化血紅素較高，請配合醫生調整藥物與飲食方案噢。</p>
                        </div>
                    </div>
                )}
            </div>

            <label className="ds-rec-date">
                <span className="t-label">選擇檢查/抽血日期：</span>
                <input
                    type="date"
                    className="ds-field-control ds-control"
                    value={newHbA1c.date}
                    onChange={e => setNewHbA1c({...newHbA1c, date: e.target.value})}
                />
            </label>

            <div className="ds-rec-actions">
                <button
                    type="button"
                    onClick={() => {
                        if (newHbA1c.value) {
                            addHbA1cRecord();
                        }
                    }}
                    disabled={!newHbA1c.value}
                    className="ds-btn ds-btn-primary ds-btn-block ds-control ds-rec-save"
                >
                    <Icon name="check" />
                    <span>儲存糖化血紅素</span>
                </button>
            </div>
        </section>
    );
}
