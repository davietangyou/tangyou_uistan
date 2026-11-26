import {getBmiEvaluation} from '../../utils/constants';
import type {OnboardingViewModel} from './useOnboardingViewModel';
import {BmiScale, FieldBlock, Icon, OptionTile, Pill, UnitSwitch, bmiTone} from '../ProfileShared/formParts';

export function BasicsStep({vm}: {vm: OnboardingViewModel}) {
    const {
        profile,
        setProfile,
        setOnboardingStep,
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
    } = vm;
    const canContinue = Boolean(profile.age && profile.gender);
    return (
        <div className="ds-ob-body">
            {/* 1. 如何稱呼您 */}
            <FieldBlock label="如何稱呼您？" htmlFor="ob-name">
                <input
                    id="ob-name"
                    type="text"
                    placeholder="例如：陳生、張太、Uncle John"
                    className="ds-field-control ds-control ds-ob-big-input"
                    value={profile.name || ''}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                />
            </FieldBlock>

            {/* 2. 年齡 & 3. 性別 */}
            <div className="ds-pf-grid">
                <FieldBlock
                    label={<>年齡 <span className="ds-ob-required" aria-hidden>*</span></>}
                    htmlFor="ob-age"
                    hint="（會自動隨著使用更新）"
                >
                    <input
                        id="ob-age"
                        type="number"
                        inputMode="numeric"
                        placeholder="例如：68"
                        required
                        className="ds-field-control ds-control ds-ob-big-input"
                        value={profile.age || ''}
                        onChange={e => setProfile({...profile, age: e.target.value})}
                    />
                </FieldBlock>

                <div className="ds-pf-field" role="group" aria-labelledby="ob-gender-label">
                    <span className="t-label" id="ob-gender-label">
                        性別 <span className="ds-ob-required" aria-hidden>*</span>
                    </span>
                    <div className="ds-pf-options ds-ob-genders">
                        {['男', '女', '其他'].map(g => (
                            <OptionTile
                                key={g}
                                selected={profile.gender === g}
                                onClick={() => setProfile({...profile, gender: g})}
                                className="ds-ob-gender"
                            >
                                {g}
                            </OptionTile>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. 身高、5. 體重、6. BMI 自動生成 */}
            <div className="ds-pf-panel ds-ob-body-panel">
                <div className="ds-pf-field-head is-stack">
                    <span className="t-body-strong">身材指標與 BMI 自動計算</span>
                    <span className="t-caption t-ink-2">填寫身高體重即刻自動算出</span>
                </div>

                <div className="ds-ob-metrics">
                    {/* 身高 */}
                    <FieldBlock label="身高 (cm)" htmlFor="ob-height">
                        <input
                            id="ob-height"
                            type="number"
                            inputMode="numeric"
                            placeholder="如 165"
                            className="ds-field-control ds-control"
                            value={profile.height || ''}
                            onChange={e => handleHeightChange(e.target.value)}
                        />
                    </FieldBlock>

                    {/* 體重與單位 */}
                    <FieldBlock label="體重" htmlFor="ob-weight">
                        <input
                            id="ob-weight"
                            type="number"
                            inputMode="decimal"
                            placeholder={profile.weightUnit === 'lb' ? '如 132' : '如 60'}
                            className="ds-field-control ds-control"
                            value={profile.weight || ''}
                            onChange={e => handleWeightChange(e.target.value)}
                        />
                        <UnitSwitch
                            label="體重單位"
                            value={(profile.weightUnit || 'kg') as 'kg' | 'lb'}
                            options={(['kg', 'lb'] as const).map(u => ({unit: u, label: u === 'kg' ? '公斤' : '磅'}))}
                            onChange={(u) => handleWeightUnitChange(u)}
                        />
                    </FieldBlock>

                    {/* BMI 自動生成 */}
                    <div className="ds-ob-bmi-tile" aria-live="polite">
                        <span className="t-label">BMI (自動生成)</span>
                        <span className="ds-ob-bmi-value">
                            <span className="t-h2">{profile.bmi || '--'}</span>
                            {profile.bmi && (
                                <span className="t-caption t-ink-2">kg/m²</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* BMI 指標提示條 (依年齡自動適配：一般成人 vs 長者糖友指引) */}
                {profile.bmi && (() => {
                    const evalResult = getBmiEvaluation(profile.bmi, profile.age);
                    if (!evalResult) return null;

                    return (
                        <div className="ds-pf-bmi">
                            <div className="ds-pf-bmi-head">
                                <div className="ds-pf-field-head is-stack">
                                    <span className="t-body-strong">BMI 評估：</span>
                                    <span className="t-caption t-ink-2">
                                        {evalResult.isElderly ? '參考長者糖友專屬指引' : '參考香港華人成人標準'}
                                    </span>
                                </div>
                                <Pill tone={bmiTone(evalResult.colorClass)}>{evalResult.category}</Pill>
                            </div>

                            {/* 視覺進度條 */}
                            {evalResult.isElderly ? (
                                <BmiScale
                                    segments={[
                                        { width: '25%', title: '偏輕 (<20.0)' },
                                        { width: '45%', title: '長者黃金保護區間 (20.0-26.9)' },
                                        { width: '15%', title: '長者微重 (27.0-29.9)' },
                                        { width: '15%', title: '長者肥胖 (≥30.0)' },
                                    ]}
                                    labels={[
                                        { text: '< 20 偏輕' },
                                        { text: '20.0 - 26.9 長者保護區', strong: true },
                                        { text: '27-29.9 微重' },
                                        { text: '≥ 30 肥胖' },
                                    ]}
                                />
                            ) : (
                                <BmiScale
                                    segments={[
                                        { width: '23%', title: '過輕 (<18.5)' },
                                        { width: '30%', title: '適中 (18.5-22.9)' },
                                        { width: '17%', title: '過重 (23.0-24.9)' },
                                        { width: '30%', title: '肥胖 (≥25.0)' },
                                    ]}
                                    labels={[
                                        { text: '< 18.5 過輕' },
                                        { text: '18.5 - 22.9 理想', strong: true },
                                        { text: '23 - 24.9 過重' },
                                        { text: '≥ 25 肥胖' },
                                    ]}
                                />
                            )}

                            <p className="t-body ds-pf-bmi-note">
                                {evalResult.description}
                            </p>
                        </div>
                    );
                })()}
            </div>

            {/* 下一步按鈕 */}
            <div className="ds-ob-actions">
                <button
                    type="button"
                    disabled={!profile.age || !profile.gender}
                    onClick={() => setOnboardingStep(2)}
                    className="ds-btn ds-btn-primary ds-btn-block ds-control ds-ob-next"
                >
                    <span>下一步：長期疾病狀況</span>
                    <Icon name="forward" />
                </button>
                {!canContinue && (
                    <p className="t-caption t-ink-2 ds-ob-gate-hint">請先填寫年齡及選擇性別</p>
                )}
            </div>
        </div>
    );
}
