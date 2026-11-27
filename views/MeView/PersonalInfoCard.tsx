import type {MeViewModel} from './useMeViewModel';
import type {GroupProps} from './MeView';
import { getBmiEvaluation } from '../../utils/constants';
import {BmiScale, FieldBlock, Pill, ProfileGroup, UnitSwitch, bmiTone} from '../ProfileShared/formParts';
import {SheetSelect} from '../../components/ui';
import {GENDER_OPTIONS} from '../../domain/options';

export function PersonalInfoCard({vm, open, onToggle}: {vm: MeViewModel} & GroupProps) {
    const {
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
        profile,
        setProfile
    } = vm;

    const summary = [
        profile.name,
        profile.age ? `${profile.age} 歲` : '',
        profile.gender || '男',
        profile.bmi ? `BMI ${profile.bmi}` : '',
    ].filter(Boolean).join(' · ');

    return (
        <ProfileGroup id="personal" icon="profile" tone="sage" title="個人信息" summary={summary} open={open} onToggle={onToggle}>
            {/* 1. 個人信息 */}
            <p className="t-caption t-ink-2">直接點擊即可修改</p>

            {/* 姓名稱呼 */}
            <FieldBlock label="姓名 / 點樣稱呼您？" htmlFor="me-name">
                <input
                    id="me-name"
                    type="text"
                    placeholder="例如：陳生、張太"
                    className="ds-field-control ds-control"
                    value={profile.name || ''}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
            </FieldBlock>

            {/* 年齡、性別、身高、體重 */}
            <div className="ds-pf-grid">
                <FieldBlock label="年齡 (歲)" htmlFor="me-age">
                    <input
                        id="me-age"
                        type="number"
                        inputMode="numeric"
                        placeholder="例如: 68"
                        className="ds-field-control ds-control ds-pf-short"
                        value={profile.age || ''}
                        onChange={e => setProfile({ ...profile, age: e.target.value })}
                    />
                </FieldBlock>
                <FieldBlock label="性別" htmlFor="me-gender">
                    <SheetSelect
                        sheetTitle="性別"
                        triggerClassName="ds-pf-short"
                        id="me-gender"
                        className="ds-field-control ds-control ds-pf-short"
                        value={profile.gender || '男'}
                        onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    >
                        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </SheetSelect>
                </FieldBlock>
                <FieldBlock label="身高 (cm)" htmlFor="me-height">
                    <input
                        id="me-height"
                        type="number"
                        placeholder="例如: 165"
                        className="ds-field-control ds-control ds-pf-short"
                        value={profile.height || ''}
                        onChange={e => handleHeightChange(e.target.value)}
                    />
                </FieldBlock>
                <FieldBlock label="體重" htmlFor="me-weight">
                    <input
                        id="me-weight"
                        type="number"
                        placeholder={profile.weightUnit === 'lb' ? '例如: 132 磅' : '例如: 60 公斤'}
                        className="ds-field-control ds-control ds-pf-short"
                        value={profile.weight || ''}
                        onChange={e => handleWeightChange(e.target.value)}
                    />
                    <UnitSwitch
                        label="體重單位"
                        value={(profile.weightUnit || 'kg') as 'kg' | 'lb'}
                        options={[
                            { unit: 'kg', label: '公斤 (kg)' },
                            { unit: 'lb', label: '磅 (lb)' }
                        ]}
                        onChange={(unit) => handleWeightUnitChange(unit as 'kg' | 'lb')}
                    />
                </FieldBlock>
            </div>

            {/* 即時 BMI 指數與標尺視覺條 (智能適配長者糖友 vs 成人標準) */}
            {profile.bmi && (() => {
                const evalResult = getBmiEvaluation(profile.bmi, profile.age);
                if (!evalResult) return null;

                const bmiValue = parseFloat(profile.bmi || '0');
                const minBmi = evalResult.isElderly ? 16 : 15;
                const maxBmi = evalResult.isElderly ? 34 : 30;
                const percentage = ((bmiValue - minBmi) / (maxBmi - minBmi)) * 100;
                const bmiPosition = Math.min(Math.max(percentage, 2), 98);
                const tone = bmiTone(evalResult.colorClass);

                return (
                    <div className="ds-pf-bmi">
                        <div className="ds-pf-bmi-head">
                            <div className="ds-pf-bmi-value">
                                <span className="t-label">BMI 指數：</span>
                                <span className="t-h2">{profile.bmi}</span>
                            </div>
                            <Pill tone={tone}>{evalResult.category}</Pill>
                        </div>
                        {evalResult.isElderly ? (
                            <Pill tone="butter">長者糖友指引 (≥65歲)</Pill>
                        ) : (
                            <span className="t-caption t-ink-2">(香港華人成人標準)</span>
                        )}

                        {/* 標尺指標 */}
                        <BmiScale
                            markerPercent={bmiValue > 0 ? bmiPosition : undefined}
                            segments={evalResult.isElderly ? [
                                { width: '22%', title: '偏輕 (<20.0)' },
                                { width: '39%', title: '長者黃金保護區 (20.0-26.9)' },
                                { width: '17%', title: '微重 (27.0-29.9)' },
                                { width: '22%', title: '肥胖 (≥30.0)' },
                            ] : [
                                { width: '23.3%', title: '過輕 (<18.5)' },
                                { width: '29.3%', title: '適中 (18.5-22.9)' },
                                { width: '13.3%', title: '過重 (23.0-24.9)' },
                                { width: '34.1%', title: '肥胖 (≥25.0)' },
                            ]}
                        />

                        {/* 指引提示文案 */}
                        <p className="t-body ds-pf-bmi-note">{evalResult.description}</p>
                    </div>
                );
            })()}
        </ProfileGroup>
    );
}
