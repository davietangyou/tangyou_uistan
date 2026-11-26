import type {MeViewModel} from './useMeViewModel';
import type {GroupProps} from './MeView';
import {EXERCISE_TYPE_OPTIONS} from './constants';
import {cx} from '../../components/ui';
import {FieldBlock, Icon, OptionTile, Pill, ProfileGroup} from '../ProfileShared/formParts';

// 每週運動狀態顯示（只影響顯示文字，儲存值 MET_150 / UNDER_150 / NONE 不變）
function weeklyStatus(v?: string): {text: string; tone: 'sage' | 'butter' | 'muted'} {
    if (v === 'MET_150') return {text: '達標 (≥150分/週)', tone: 'sage'};
    if (v === 'UNDER_150') return {text: '不足 (<150分/週)', tone: 'butter'};
    if (v === 'NONE') return {text: '幾乎無運動', tone: 'muted'};
    return {text: '未設定', tone: 'muted'};
}

export function LifestyleCard({vm, open, onToggle}: {vm: MeViewModel} & GroupProps) {
    const {
        calculateExerciseFromHabits,
        profile,
        setProfile
    } = vm;

    const status = weeklyStatus(profile.exerciseWeekly);
    const dietCount = (profile.dietHabits || []).length;
    const summary = `運動：${status.text}${dietCount ? ` · 飲食習慣 ${dietCount} 項` : ''}`;

    return (
        <ProfileGroup id="lifestyle" icon="meal" tone="sage" title="飲食與運動" summary={summary} open={open} onToggle={onToggle}>
            {/* 5. 生活飲食與每週運動 */}

            {/* 飲食習慣多選 */}
            <div className="ds-pf-field" role="group" aria-labelledby="me-diet-label">
                <span className="t-label" id="me-diet-label">日常飲食習慣 (可多選)：</span>
                <div className="ds-pf-options">
                    {[
                        { id: 'OUTSIDE_EATING', title: '經常出街食飯 (外食為主)' },
                        { id: 'REFINED_CARB', title: '主食偏好精製澱粉 (如白飯、麵包、河粉、粥)' },
                        { id: 'SUGARY_DRINK', title: '習慣飲含糖飲品 (如奶茶、凍檸茶、汽水)' },
                        { id: 'MIDNIGHT_SNACK', title: '有食宵夜或睡前點心習慣' },
                        { id: 'HOME_COOK', title: '飲食定時定量，家中自煮為主' }
                    ].map(opt => {
                        const isSelected = (profile.dietHabits || []).includes(opt.id);
                        return (
                            <OptionTile
                                key={opt.id}
                                multi
                                selected={isSelected}
                                onClick={() => {
                                    let current = [...(profile.dietHabits || [])];
                                    if (current.includes(opt.id)) {
                                        current = current.filter(x => x !== opt.id);
                                    } else {
                                        current.push(opt.id);
                                    }
                                    setProfile({ ...profile, dietHabits: current });
                                }}
                            >
                                {opt.title}
                            </OptionTile>
                        );
                    })}
                </div>
            </div>

            {/* 平時喜歡的食物 (自定義輸入) */}
            <FieldBlock label="平時喜歡的食物 (選填)：" htmlFor="me-foods">
                <input
                    id="me-foods"
                    type="text"
                    placeholder="例如: 叉燒飯、雲吞麵、芒果、奶茶、蒸魚、蛋撻等"
                    value={profile.favoriteFoods || ''}
                    onChange={e => setProfile({ ...profile, favoriteFoods: e.target.value })}
                    className="ds-field-control ds-control"
                />
            </FieldBlock>

            {/* 每週運動量計算器 (ADA 150 分鐘標準) */}
            <div className="ds-pf-field">
                <div className="ds-pf-field-head is-stack">
                    <span className="t-label">每週運動習慣 (參考 ADA 國際糖尿病標準)：</span>
                    <Pill tone={status.tone}>{status.text}</Pill>
                </div>

                {/* 運動習慣計算器：每週幾天 + 每次多久 + 運動強度確認 */}
                <div className="ds-pf-panel ds-pf-steps">
                    <div className="ds-pf-step" role="group" aria-labelledby="me-ex-days">
                        <div className="ds-pf-step-head">
                            <span className="t-body-strong" id="me-ex-days">1. 每週大約運動幾多日？</span>
                            <span className="t-caption ds-pf-step-value">
                                {profile.exerciseDaysPerWeek ? `每週 ${profile.exerciseDaysPerWeek} 日` : '請選擇'}
                            </span>
                        </div>
                        <div className="ds-pf-choices">
                            {[
                                { id: '0', label: '0 日' },
                                { id: '1-2', label: '1-2 日' },
                                { id: '3-4', label: '3-4 日' },
                                { id: '5+', label: '5 日以上' }
                            ].map(item => {
                                const isSel = profile.exerciseDaysPerWeek === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-pressed={isSel}
                                        onClick={() => {
                                            const nextDays = item.id;
                                            const nextMins = profile.exerciseMinutesPerSession || (item.id === '0' ? '0' : '30');
                                            const nextIntensity = profile.exerciseIntensity || 'MODERATE';
                                            const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                            setProfile({
                                                ...profile,
                                                exerciseDaysPerWeek: nextDays,
                                                exerciseMinutesPerSession: nextDays === '0' ? '0' : nextMins,
                                                exerciseIntensity: nextDays === '0' ? undefined : nextIntensity,
                                                exerciseWeekly: category
                                            });
                                        }}
                                        className={cx('ds-pf-choice ds-control', isSel && 'is-selected')}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {profile.exerciseDaysPerWeek && profile.exerciseDaysPerWeek !== '0' && (
                        <>
                            <div className="ds-pf-step" role="group" aria-labelledby="me-ex-mins">
                                <div className="ds-pf-step-head">
                                    <span className="t-body-strong" id="me-ex-mins">2. 每次運動大約持續幾耐？</span>
                                    <span className="t-caption ds-pf-step-value">
                                        {profile.exerciseMinutesPerSession ? `每次約 ${profile.exerciseMinutesPerSession} 分鐘` : '請選擇'}
                                    </span>
                                </div>
                                <div className="ds-pf-choices">
                                    {[
                                        { id: '15', label: '< 20 分鐘' },
                                        { id: '30', label: '約 30 分鐘' },
                                        { id: '45', label: '約 45 分鐘' },
                                        { id: '60+', label: '60 分鐘+' }
                                    ].map(item => {
                                        const isSel = profile.exerciseMinutesPerSession === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                aria-pressed={isSel}
                                                onClick={() => {
                                                    const nextDays = profile.exerciseDaysPerWeek || '3-4';
                                                    const nextMins = item.id;
                                                    const nextIntensity = profile.exerciseIntensity || 'MODERATE';
                                                    const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                                    setProfile({
                                                        ...profile,
                                                        exerciseDaysPerWeek: nextDays,
                                                        exerciseMinutesPerSession: nextMins,
                                                        exerciseWeekly: category
                                                    });
                                                }}
                                                className={cx('ds-pf-choice ds-control', isSel && 'is-selected')}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="ds-pf-step" role="group" aria-labelledby="me-ex-intensity">
                                <div className="ds-pf-step-head">
                                    <span className="t-body-strong" id="me-ex-intensity">3. 運動時的自覺強度？</span>
                                    <span className="t-caption ds-pf-step-value">
                                        {profile.exerciseIntensity === 'MODERATE' ? '中等' :
                                         profile.exerciseIntensity === 'LIGHT' ? '輕度' :
                                         profile.exerciseIntensity === 'VIGOROUS' ? '高強度' : '建議選擇'}
                                    </span>
                                </div>
                                <div className="ds-pf-choices is-three">
                                    {[
                                        { id: 'LIGHT', title: '輕度' },
                                        { id: 'MODERATE', title: '中等' },
                                        { id: 'VIGOROUS', title: '高強度' }
                                    ].map(item => {
                                        const isSel = (profile.exerciseIntensity || 'MODERATE') === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                aria-pressed={isSel}
                                                onClick={() => {
                                                    const nextIntensity = item.id as 'LIGHT' | 'MODERATE' | 'VIGOROUS';
                                                    const nextDays = profile.exerciseDaysPerWeek || '3-4';
                                                    const nextMins = profile.exerciseMinutesPerSession || '30';
                                                    const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                                    setProfile({
                                                        ...profile,
                                                        exerciseIntensity: nextIntensity,
                                                        exerciseWeekly: category
                                                    });
                                                }}
                                                className={cx('ds-pf-choice ds-control', isSel && 'is-selected')}
                                            >
                                                {item.title}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 中等強度運動實例導引 (精簡清晰版) */}
                                <div className="ds-pf-tip">
                                    <p className="t-body-strong ds-pf-tip-title">
                                        <Icon name="insight" size={20} />
                                        <span>常見中等強度運動實例：</span>
                                    </p>
                                    <p className="t-body">
                                        <strong>【有氧運動】</strong>
                                        快步走、太極拳 / 八段錦、單車 / 慢跑、游泳 / 水中健步、活力操、家務（拖地/擦窗）
                                    </p>
                                    <p className="t-body">
                                        <strong>【抗阻力肌力】</strong>
                                        深蹲 / 靠椅坐站、靠牆俯臥撐、站立提踵（踮腳尖）、彈力帶 / 啞鈴訓練
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 常做運動類型 (可多選) */}
            <div className="ds-pf-field" role="group" aria-labelledby="me-ex-types">
                <div className="ds-pf-field-head">
                    <span className="t-label" id="me-ex-types">平時常做的運動類型 (可多選)：</span>
                    <span className="t-caption t-ink-2">
                        {(profile.exerciseTypes || []).length > 0 ? `已選 ${(profile.exerciseTypes || []).length} 項` : '選填'}
                    </span>
                </div>
                <div className="ds-pf-options is-grid">
                    {EXERCISE_TYPE_OPTIONS.map(item => {
                        const isSelected = (profile.exerciseTypes || []).includes(item.id);
                        return (
                            <OptionTile
                                key={item.id}
                                multi
                                selected={isSelected}
                                onClick={() => {
                                    let current = [...(profile.exerciseTypes || [])];
                                    if (current.includes(item.id)) {
                                        current = current.filter(x => x !== item.id);
                                    } else {
                                        current.push(item.id);
                                    }
                                    setProfile({ ...profile, exerciseTypes: current });
                                }}
                            >
                                {item.label}
                            </OptionTile>
                        );
                    })}
                </div>

                {/* 自定義其他運動項目輸入框 */}
                {(profile.exerciseTypes || []).includes('OTHER') && (
                    <input
                        type="text"
                        placeholder="請輸入其他常做的運動項目（例如：乒乓球、廣場舞、跳繩、家務拖地等）"
                        aria-label="其他常做的運動項目"
                        value={profile.exerciseTypesOther || ''}
                        onChange={e => setProfile({ ...profile, exerciseTypesOther: e.target.value })}
                        className="ds-field-control ds-control"
                        autoFocus
                    />
                )}
            </div>
        </ProfileGroup>
    );
}
