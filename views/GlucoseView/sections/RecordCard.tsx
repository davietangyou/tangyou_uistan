import type {GlucoseRecord} from '../../../utils/types';
import {glucoseStatus, type GlucoseStatus} from '../recordStatus';
import {DeleteRecordButton, StatusPill} from './recordUi';

const STATUS_TEXT: Record<Exclude<GlucoseStatus, 'none'>, string> = {
    low: '低血糖風險',
    high: '血糖偏高',
    normal: '正常範圍',
};

/** One glucose / symptom record. Status is always written out, never colour-only. */
export function RecordCard({record: r, showDetails, onDelete}: {record: GlucoseRecord; showDetails: boolean; onDelete: () => void}) {
    const status = glucoseStatus(r.value, r.timeType);
    const lead = (showDetails && r.mealTag ? [r.mealTag, r.timeType] : [r.timeType]).join(' · ');
    const details = showDetails && (r.dietNote || r.exerciseNote || r.illnessNote || r.medicationNote || r.bpSystolic || r.bpDiastolic || r.pulse || r.weight || r.mood);

    return (
        <article className={`ds-card ds-rec-card is-${status}`}>
            <div className="ds-rec-card-main">
                {status !== 'none' ? (
                    <div className="ds-rec-card-top">
                        <p className="ds-rec-value"><span className="t-h1">{r.value}</span><span className="ds-rec-unit">mmol/L</span></p>
                        <StatusPill tone={status}>{STATUS_TEXT[status]}</StatusPill>
                    </div>
                ) : (
                    <div className="ds-rec-card-top">
                        <StatusPill tone="info">身體症狀紀錄</StatusPill>
                    </div>
                )}

                {/* R2-5: the date and its time stay on one line (「2026/11/23 / 07:30」 split
                    in long lists); the text is unchanged. */}
                <p className="t-caption t-ink-2">{lead} · <span className="ds-rec-when">{r.date}</span></p>

                {r.symptoms && r.symptoms.length > 0 && (
                    <ul className="ds-rec-tags" aria-label="症狀">
                        {r.symptoms.map((sym, index) => (
                            <li key={index} className="ds-rec-tagchip">{sym}</li>
                        ))}
                    </ul>
                )}

                {details && (
                    <dl className="ds-rec-notes">
                        {r.dietNote && (<div><dt>飲食</dt><dd>{r.dietNote}</dd></div>)}
                        {r.exerciseNote && (<div><dt>運動</dt><dd>{r.exerciseNote}</dd></div>)}
                        {r.illnessNote && (<div><dt>狀況</dt><dd>{r.illnessNote}</dd></div>)}
                        {r.medicationNote && (<div><dt>用藥</dt><dd>{r.medicationNote}</dd></div>)}
                        {(r.bpSystolic || r.bpDiastolic || r.pulse) && (
                            <div><dt>血壓</dt><dd>{r.bpSystolic || '--'}/{r.bpDiastolic || '--'} mmHg {r.pulse ? `(心率 ${r.pulse} bpm)` : ''}</dd></div>
                        )}
                        {r.weight && (<div><dt>體重</dt><dd>{r.weight} kg</dd></div>)}
                        {r.mood && (<div><dt>心情</dt><dd>{r.mood}</dd></div>)}
                    </dl>
                )}
            </div>
            <DeleteRecordButton onClick={onDelete} />
        </article>
    );
}
