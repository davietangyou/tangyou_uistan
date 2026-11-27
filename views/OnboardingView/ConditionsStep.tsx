import {COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList} from '../../utils/constants';
import {DiabetesType} from '../../utils/types';
import type {OnboardingViewModel} from './useOnboardingViewModel';
import {FieldBlock, OptionTile, Pill} from '../ProfileShared/formParts';
import {Icon, SheetSelect} from '../../components/ui';
import {ONBOARDING_DIABETES_TYPE_OPTIONS} from '../../domain/options';

export function ConditionsStep({vm}: {vm: OnboardingViewModel}) {
    const {
        profile,
        setProfile,
        toggleCondition,
        handleUpdateConditionDetail,
        selectedConditions,
        isNoneSelected,
        isDiabetesSelected,
        nonDiabetesSelected,
    } = vm;
    return (
        <div className="ds-ob-body">
            {/* 1. 長期疾病選擇 */}
            <div className="ds-pf-field">
                <h4 className="t-body-strong ds-ob-question" id="ob-cond-question">
                    你有沒有下列項目中的一項或多於一項長期疾病，維持最少 6 個月的時間？
                </h4>
                <p className="t-caption t-ink-2">
                    點選符合您的項目（可多選），如無請選擇「沒有長期疾病」。
                </p>
            </div>

            {/* 沒有長期疾病選項 */}
            <OptionTile tone="ink" selected={isNoneSelected} onClick={() => toggleCondition('NONE')}>
                【沒有長期疾病】
            </OptionTile>

            {/* 常見長期疾病 分組 */}
            <div className="ds-pf-field" role="group" aria-labelledby="ob-common-cond">
                <span className="t-label" id="ob-common-cond">
                    【常見長期疾病】
                </span>
                <div className="ds-pf-options is-grid">
                    {COMMON_CONDITIONS.map(item => (
                        <OptionTile key={item.id} multi selected={Boolean(profile.conditions?.includes(item.id))} onClick={() => toggleCondition(item.id)}>
                            {item.label}
                        </OptionTile>
                    ))}
                </div>
            </div>

            {/* 其他長期疾病 分組 */}
            <div className="ds-pf-field" role="group" aria-labelledby="ob-other-cond">
                <span className="t-label" id="ob-other-cond">
                    【其他長期疾病】
                </span>
                <div className="ds-pf-options is-grid">
                    {OTHER_CONDITIONS.map(item => (
                        <OptionTile key={item.id} multi selected={Boolean(profile.conditions?.includes(item.id))} onClick={() => toggleCondition(item.id)}>
                            {item.label}
                        </OptionTile>
                    ))}
                </div>
            </div>

            {/* 若選了「其他 (OT)」，提供自訂疾病輸入框 */}
            {profile.conditions?.includes('OT') && (
                <div className="ds-pf-panel">
                    <FieldBlock label="請輸入其他長期疾病名稱：" htmlFor="ob-other-name">
                        <input
                            id="ob-other-name"
                            type="text"
                            placeholder="例如：痛風、前列腺增生、骨質疏鬆等"
                            className="ds-field-control ds-control"
                            value={profile.otherConditions || ''}
                            onChange={e => {
                                const val = e.target.value;
                                setProfile({ ...profile, otherConditions: val });
                                handleUpdateConditionDetail('OT', 'specificName', val);
                            }}
                        />
                    </FieldBlock>
                </div>
            )}

            {/* ===================== 2. 選擇完相應疾病後的詢問詳情 ===================== */}
            {selectedConditions.length > 0 && (
                <section className="ds-ob-details" aria-labelledby="ob-details-title">
                    <div className="ds-pf-field-head is-stack">
                        <h4 className="t-title" id="ob-details-title">已選疾病之具體情況</h4>
                        <Pill tone="sage">已選擇 {selectedConditions.length} 項疾病</Pill>
                    </div>

                    {/* 1. 糖尿病專屬詢問 (若選了糖尿病 DM) */}
                    {isDiabetesSelected && (
                        <div className="ds-pf-panel ds-ob-dm">
                            <div className="ds-pf-bmi-head">
                                <span className="t-body-strong ds-ob-dm-title">
                                    <Icon name="glucose" size={20} />
                                    <span>糖尿病管理情況</span>
                                </span>
                                <Pill tone="mist">重點追蹤</Pill>
                            </div>

                            {/* 糖尿病類型 */}
                            <FieldBlock label="1. 糖尿病類型：" htmlFor="ob-dm-type">
                                <SheetSelect
                                    sheetTitle="糖尿病類型"
                                    mode="list"
                                    id="ob-dm-type"
                                    className="ds-field-control ds-control"
                                    value={profile.diabetesType || 'TYPE_2'}
                                    onChange={e => setProfile({ ...profile, diabetesType: e.target.value as DiabetesType })}
                                >
                                    {ONBOARDING_DIABETES_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </SheetSelect>
                            </FieldBlock>

                            {/* 是否正在注射胰島素 */}
                            <div className="ds-pf-field" role="group" aria-labelledby="ob-insulin">
                                <span className="t-label" id="ob-insulin">2. 是否正在注射胰島素？</span>
                                <div className="ds-pf-options is-two">
                                    {[
                                        { value: true, label: '是，正在注射胰島素' },
                                        { value: false, label: '否，未注射胰島素' }
                                    ].map(opt => (
                                        <OptionTile
                                            key={opt.label}
                                            selected={profile.isInsulinUser === opt.value}
                                            onClick={() => setProfile({ ...profile, isInsulinUser: opt.value })}
                                        >
                                            {opt.label}
                                        </OptionTile>
                                    ))}
                                </div>
                            </div>

                            {/* 是否有家人/照顧者日常協助管理糖尿病 */}
                            <div className="ds-pf-field" role="group" aria-labelledby="ob-caregiver">
                                <span className="t-label" id="ob-caregiver">3. 是否有家人/照顧者日常協助管理糖尿病？</span>
                                <div className="ds-pf-options is-two">
                                    {[
                                        { value: true, label: '有家人或照顧者日常協助' },
                                        { value: false, label: '自己獨立管理與照顧' }
                                    ].map(opt => (
                                        <OptionTile
                                            key={opt.label}
                                            selected={profile.hasCaregiverSupport === opt.value}
                                            onClick={() => setProfile({
                                                ...profile,
                                                hasCaregiverSupport: opt.value,
                                                hasNoCaregiverSupport: !opt.value
                                            })}
                                        >
                                            {opt.label}
                                        </OptionTile>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. 其他已選疾病的詢問：患病多少年、詳情（如有） */}
                    {nonDiabetesSelected.length > 0 && (
                        <div className="ds-pf-field">
                            <span className="t-label">
                                其他已選疾病情況：
                            </span>
                            <ul className="ds-pf-details">
                                {nonDiabetesSelected.map(condId => {
                                    const matchDef = conditionsList.find(c => c.id === condId);
                                    const label = condId === 'OT' && profile.otherConditions
                                        ? `其他（${profile.otherConditions}）`
                                        : matchDef?.label || condId;
                                    const currentDetail = profile.conditionDetails?.[condId] || {};
                                    const currentYears = condId === 'HT' && profile.hypertensionYears
                                        ? profile.hypertensionYears
                                        : currentDetail.years || '';

                                    return (
                                        <li key={condId} className="ds-pf-detail">
                                            <div className="ds-pf-detail-head">
                                                <span className="t-body-strong">{label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCondition(condId)}
                                                    className="ds-btn ds-btn-ghost ds-control ds-pf-remove"
                                                    aria-label={`取消選擇${label}`}
                                                >
                                                    <Icon name="close" size={20} />
                                                    <span>取消選擇</span>
                                                </button>
                                            </div>

                                            <div className="ds-pf-grid">
                                                {/* 患病多少年 */}
                                                <FieldBlock label="患病多少年？" htmlFor={`ob-years-${condId}`}>
                                                    <div className="ds-pf-suffix">
                                                        <input
                                                            id={`ob-years-${condId}`}
                                                            type="number"
                                                            placeholder="如 3"
                                                            className="ds-field-control ds-control"
                                                            value={currentYears}
                                                            onChange={e => handleUpdateConditionDetail(condId, 'years', e.target.value)}
                                                        />
                                                        <span className="t-body t-ink-2" aria-hidden>年</span>
                                                    </div>
                                                </FieldBlock>

                                                {/* 詳情（如有） */}
                                                <FieldBlock label="詳情（如有）" htmlFor={`ob-detail-${condId}`}>
                                                    <input
                                                        id={`ob-detail-${condId}`}
                                                        type="text"
                                                        placeholder="例如：服藥控制中、定期專科覆診等"
                                                        className="ds-field-control ds-control"
                                                        value={currentDetail.specificName || ''}
                                                        onChange={e => handleUpdateConditionDetail(condId, 'specificName', e.target.value)}
                                                    />
                                                </FieldBlock>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {/* 溫馨提醒：完成後會同步到個人檔案 */}
            <div className="ds-pf-tip">
                <p className="t-body-strong ds-pf-tip-title">
                    <Icon name="insight" size={20} />
                    <span>資料將同步到【個人檔案】</span>
                </p>
                <p className="t-body">
                    首次設定已完成！其餘糖尿病專科用藥清單、飲食運動偏好及就診安排，可隨時在「個人檔案」中進一步完善。
                </p>
            </div>

        </div>
    );
}
