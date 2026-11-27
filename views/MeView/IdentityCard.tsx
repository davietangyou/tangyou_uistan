import type {UserProfile} from '../../utils/types';
import {Icon} from '../../components/ui';

/**
 * S5 (owner t20u): 「已完成 N/5」 identity card, as on 被仿侧「我的」.
 * Display only — counted at render time from which profile fields are already
 * filled; nothing new is stored and no profile logic changes.
 */
const GROUPS: ReadonlyArray<{label: string; done: (p: UserProfile) => boolean}> = [
    {label: '個人信息', done: (p) => Boolean(p.name?.trim() && p.age && p.gender && p.height && p.weight)},
    {label: '糖尿病相關信息', done: (p) => Boolean(p.diabetesType && p.diabetesType !== 'UNKNOWN')},
    {label: '長期疾病調查', done: (p) => (p.conditions || []).length > 0},
    {label: '家庭照顧支持', done: (p) => Boolean(p.hasCaregiverSupport || p.hasNoCaregiverSupport)},
    {label: '飲食與運動', done: (p) => Boolean(p.exerciseWeekly || (p.dietHabits || []).length > 0)},
];

export function profileCompletion(profile: UserProfile) {
    const missing = GROUPS.filter((g) => !g.done(profile)).map((g) => g.label);
    return {done: GROUPS.length - missing.length, total: GROUPS.length, missing};
}

export function IdentityCard({profile}: {profile: UserProfile}) {
    const {done, total, missing} = profileCompletion(profile);
    const complete = missing.length === 0;
    const facts = [profile.age ? `${profile.age} 歲` : '', profile.gender || ''].filter(Boolean).join(' · ');
    return (
        <section className="ds-pf-identity" aria-label="檔案完成度">
            <div className="ds-pf-identity-row">
                <span className="ds-pf-identity-avatar" aria-hidden><Icon name="profile" size={28} /></span>
                <div className="ds-pf-identity-text">
                    <p className="ds-pf-identity-name">{profile.name?.trim() || '未填寫稱呼'}</p>
                    <p className="t-body t-ink-2">{facts ? `${facts} · ` : ''}已完成 {done} / {total}</p>
                </div>
                <span className={`ds-pf-identity-badge${complete ? ' is-done' : ''}`}>{complete ? '已完成' : '進行中'}</span>
            </div>
            <div className="ds-pf-identity-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`已完成 ${done} / ${total}`}>
                <span style={{width: `${(done / total) * 100}%`}} />
            </div>
            {!complete && (
                <p className="t-caption t-ink-2">還未填寫：{missing.join('、')}</p>
            )}
        </section>
    );
}
