import type {MeViewModel} from './useMeViewModel';
import type {GroupProps} from './MeView';
import { COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList } from '../../utils/constants';
import {FieldBlock, Icon, OptionTile, ProfileGroup} from '../ProfileShared/formParts';

export function ConditionsCard({vm, open, onToggle}: {vm: MeViewModel} & GroupProps) {
    const {
        handleUpdateConditionDetail,
        hasOtherCondition,
        profile,
        toggleConditionLocal
    } = vm;

    const selected = profile.conditions || [];
    const summary = selected.includes('NONE')
        ? '我沒有任何長期疾病'
        : selected.length === 0
            ? '未選擇'
            : selected.map(id => (id === 'OT' && profile.otherConditions ? profile.otherConditions : conditionsList.find(c => c.id === id)?.label || id)).join('、');

    return (
        <ProfileGroup id="conditions" icon="records" tone="lavender" title="長期疾病調查（維持最少 6 個月）" summary={summary} open={open} onToggle={onToggle}>
            {/* 3. 長期慢性狀況與共病 */}
            <p className="t-caption t-ink-2">點擊直接切換與編輯</p>

            {/* 1. 沒有長期疾病獨立按鈕 */}
            <OptionTile tone="ink" selected={Boolean(profile.conditions?.includes('NONE'))} onClick={() => toggleConditionLocal('NONE')}>
                我沒有任何長期疾病（維持最少 6 個月）
            </OptionTile>

            {/* 2. 常見長期疾病 */}
            <div className="ds-pf-field" role="group" aria-labelledby="me-common-cond">
                <span className="t-label" id="me-common-cond">常見長期疾病：</span>
                <div className="ds-pf-options is-grid">
                    {COMMON_CONDITIONS.map(item => (
                        <OptionTile key={item.id} multi selected={Boolean(profile.conditions?.includes(item.id))} onClick={() => toggleConditionLocal(item.id)}>
                            {item.label}
                        </OptionTile>
                    ))}
                </div>
            </div>

            {/* 3. 其他長期疾病 */}
            <div className="ds-pf-field" role="group" aria-labelledby="me-other-cond">
                <span className="t-label" id="me-other-cond">其他長期疾病：</span>
                <div className="ds-pf-options is-grid">
                    {OTHER_CONDITIONS.map(item => (
                        <OptionTile key={item.id} multi selected={Boolean(profile.conditions?.includes(item.id))} onClick={() => toggleConditionLocal(item.id)}>
                            {item.label}
                        </OptionTile>
                    ))}
                </div>
            </div>

            {/* 當勾選「其他」時，可自訂名稱 */}
            {hasOtherCondition && (
                <div className="ds-pf-panel">
                    <FieldBlock label="請輸入其他慢性狀況名稱：" htmlFor="me-other-name">
                        <input
                            id="me-other-name"
                            type="text"
                            placeholder="例如：痛風、前列腺增生、骨質疏鬆等"
                            className="ds-field-control ds-control"
                            value={profile.otherConditions || ''}
                            onChange={e => handleUpdateConditionDetail('OT', 'specificName', e.target.value)}
                        />
                    </FieldBlock>
                </div>
            )}

            {/* 4. 已選疾病詳細資料編輯列表（病齡與備註詳情） */}
            {(() => {
                const activeConditions = (profile.conditions || []).filter(c => c !== 'NONE' && c !== 'DM');
                if (activeConditions.length === 0) return null;

                return (
                    <div className="ds-pf-field">
                        <span className="t-label">已選疾病詳情（病齡與補充資料）：</span>
                        <ul className="ds-pf-details">
                            {activeConditions.map(condId => {
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
                                                onClick={() => toggleConditionLocal(condId)}
                                                className="ds-btn ds-btn-ghost ds-control ds-pf-remove"
                                                aria-label={`移除${label}`}
                                            >
                                                <Icon name="close" size={20} />
                                                <span>移除</span>
                                            </button>
                                        </div>

                                        <div className="ds-pf-grid">
                                            {/* 患病多少年 */}
                                            <FieldBlock label="患病多少年？" htmlFor={`me-years-${condId}`}>
                                                <div className="ds-pf-suffix">
                                                    <input
                                                        id={`me-years-${condId}`}
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
                                            <FieldBlock label="詳情（如有）" htmlFor={`me-detail-${condId}`}>
                                                <input
                                                    id={`me-detail-${condId}`}
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
                );
            })()}
        </ProfileGroup>
    );
}
