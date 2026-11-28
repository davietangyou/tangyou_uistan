import type {ReactNode} from 'react';
import {View} from '../../utils/types';
import {uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

/**
 * 今日服藥 — read-only summary (owner decision 2026-11-28). Reads the
 * profile's medicationDetails and dia_reminders_v2 only; it never writes,
 * never marks anything as taken and does not touch the reminder rules.
 */
export function TodayMedicationCard({vm}: {vm: HomeViewModel}) {
    const {setView, medicationReminders, medications} = vm;
    const Pill = uiIcons.medication;

    let value: ReactNode;
    let note: string;
    if (medicationReminders.length > 0) {
        const nowHm = new Date().toTimeString().slice(0, 5);
        const next = medicationReminders.find((r) => r.time >= nowHm);
        value = (
            <>
                <span>{medicationReminders.length}</span>
                <span className="ds-home-tile-unit">次</span>
            </>
        );
        note = next ? `下一次 ${next.time} · ${next.name}` : '今日提醒時間已過';
    } else if (medications.length > 0) {
        value = (
            <>
                <span>{medications.length}</span>
                <span className="ds-home-tile-unit">種藥物</span>
            </>
        );
        note = '未設定服藥時間';
    } else {
        value = '未設定';
        note = '先加入藥物資料';
    }
    const isPhrase = medicationReminders.length === 0 && medications.length === 0;

    return (
        <section className="ds-home-tile ds-home-tile-sun" aria-label="今日服藥（唯讀）">
            <p className="ds-home-tile-kicker">
                <Pill size={18} strokeWidth={1.8} aria-hidden />
                今日服藥
            </p>
            <p className={`ds-home-tile-value${isPhrase ? ' ds-home-tile-phrase' : ''}`}>{value}</p>
            <p className="ds-home-tile-note">{note}</p>
            <button
                type="button"
                className="ds-home-tile-btn ds-control"
                onClick={() => setView(View.Me)}
            >
                管理藥物
            </button>
        </section>
    );
}
