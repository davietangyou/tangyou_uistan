/**
 * R2-8: long record lists read by day. A date header goes in front of the first
 * record of each calendar day, derived at render from the record's own
 * timestamp. Records are not re-sorted, filtered or changed — a header starts
 * wherever the day differs from the record before it, so the existing order is
 * kept exactly.
 */
import React from 'react';

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** 「今天 · 11月26日 (週四)」, 「昨天 · …」, 「11月23日 (週一)」, other years 「2025年12月30日 (週二)」. */
export function dayLabel(ts: number, now = new Date()): string {
    const d = new Date(ts);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const date = `${d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}年` : ''}${d.getMonth() + 1}月${d.getDate()}日 (週${WEEKDAY[d.getDay()]})`;
    if (dayKey(d) === dayKey(now)) return `今天 · ${date}`;
    if (dayKey(d) === dayKey(yesterday)) return `昨天 · ${date}`;
    return date;
}

export function withDayHeaders<T extends {id: string; timestamp: number}>(items: T[], render: (item: T) => React.ReactNode): React.ReactNode[] {
    const now = new Date();
    const out: React.ReactNode[] = [];
    let last = '';
    for (const item of items) {
        const valid = Number.isFinite(item.timestamp);
        const key = valid ? dayKey(new Date(item.timestamp)) : '';
        if (valid && key !== last) {
            out.push(<h3 key={`day-${key}-${item.id}`} className="t-label ds-rec-day">{dayLabel(item.timestamp, now)}</h3>);
        }
        last = key;
        out.push(render(item));
    }
    return out;
}
