/**
 * Stage 6 shared display pieces for the records views (血糖 / 症狀 / 糖化).
 * Presentation only: every handler is passed in by the section that owns it.
 */
import React from 'react';
import {Icon, Segmented, cx} from '../../../components/ui';

export type RangeId = 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
const RANGE_OPTIONS = [
    {value: 'WEEK', label: '週'},
    {value: 'MONTH', label: '月'},
    {value: 'YEAR', label: '年'},
    {value: 'CUSTOM', label: '自定義'},
] as const;

export function RangeSwitch({name, value, onChange, label}: {name: string; value: RangeId; onChange: (v: RangeId) => void; label: string}) {
    return <Segmented<RangeId> name={name} value={value} options={RANGE_OPTIONS} onChange={onChange} aria-label={label} className="ds-rec-range" />;
}

export function CustomRangePanel({start, end, onStart, onEnd, presets}: {
    start: string;
    end: string;
    onStart: (v: string) => void;
    onEnd: (v: string) => void;
    presets: {label: string; onClick: () => void}[];
}) {
    return (
        <div className="ds-rec-custom">
            <div className="ds-rec-custom-dates">
                <label className="ds-rec-date">
                    <span className="t-label">起始</span>
                    <input type="date" value={start} onChange={(e) => onStart(e.target.value)} className="ds-field-control ds-control" />
                </label>
                <label className="ds-rec-date">
                    <span className="t-label">結束</span>
                    <input type="date" value={end} onChange={(e) => onEnd(e.target.value)} className="ds-field-control ds-control" />
                </label>
            </div>
            <div className="ds-rec-presets">
                <span className="t-caption t-ink-2">快捷選擇：</span>
                <div className="ds-cluster">
                    {presets.map((preset, idx) => (
                        <button key={idx} type="button" onClick={preset.onClick} className="ds-chip ds-control">
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export type PillTone = 'low' | 'high' | 'normal' | 'info' | 'caution';

export function StatusPill({tone, children}: {tone: PillTone; children: React.ReactNode}) {
    return <span className={cx('ds-rec-pill', `is-${tone}`)}>{children}</span>;
}

export function DisclosureButton({expanded, onClick, children, className}: {expanded: boolean; onClick: () => void; children: React.ReactNode; className?: string}) {
    return (
        <button type="button" onClick={onClick} aria-expanded={expanded} className={cx('ds-btn ds-btn-secondary ds-control ds-rec-disclosure', className)}>
            <span>{children}</span>
            <Icon name="expand" className={cx('ds-rec-chevron', expanded && 'is-open')} />
        </button>
    );
}

export function VoiceButton({live, onClick, title}: {live: boolean; onClick: () => void; title: string}) {
    return (
        <button type="button" onClick={onClick} title={title} aria-label={title} aria-pressed={live} className={cx('ds-rec-voice ds-control', live && 'is-live')}>
            <Icon name={live ? 'micStop' : 'mic'} />
            <span>{live ? '錄音中...' : '語音'}</span>
        </button>
    );
}

export function EmptyState({children, action}: {children: React.ReactNode; action?: React.ReactNode}) {
    return (
        <div className="ds-rec-empty">
            {children}
            {action}
        </div>
    );
}

export function DeleteRecordButton({onClick}: {onClick: () => void}) {
    return (
        <button type="button" onClick={onClick} title="刪除紀錄" aria-label="刪除紀錄" className="ds-icon-btn ds-icon-btn-plain ds-control ds-rec-delete">
            <Icon name="trash" />
        </button>
    );
}

export function SyncBanner({message, hint}: {message: string; hint: string}) {
    return (
        <div className="ds-rec-banner" role="status">
            <Icon name="check" className="ds-rec-banner-icon" />
            <div>
                <p className="t-body-strong">{message}</p>
                <p className="t-caption">{hint}</p>
            </div>
        </div>
    );
}
