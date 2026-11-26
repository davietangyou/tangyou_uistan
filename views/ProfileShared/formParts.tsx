/**
 * Stage 8 shared display pieces for 個人檔案 (MeView) and 首次引導 (OnboardingView).
 * Presentation only: every value and handler comes from the caller, and the
 * option VALUES stay written out in the original view files (the verify
 * option-values contract reads them from source).
 */
import React from 'react';
import {UI_ICON_DEFAULTS, cx, uiIcons, type UiIconName} from '../../components/ui';

export function Icon({name, size = UI_ICON_DEFAULTS.size, className}: {name: UiIconName; size?: number; className?: string}) {
    const C = uiIcons[name];
    return <C size={size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden className={className} />;
}

/** Big tappable choice tile. `multi` shows a check box, otherwise a radio dot. */
export function OptionTile({selected, onClick, children, multi = false, className, tone = 'sage'}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    multi?: boolean;
    className?: string;
    tone?: 'sage' | 'ink';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cx('ds-pf-option ds-control', multi ? 'is-multi' : 'is-single', selected && 'is-selected', tone === 'ink' && 'is-ink', className)}
        >
            <span className="ds-pf-option-mark" aria-hidden>
                {selected && <Icon name="check" size={18} />}
            </span>
            <span className="ds-pf-option-text">{children}</span>
        </button>
    );
}

/** Two-way unit switch (kg / lb). Labels are passed in so each view keeps its own wording. */
export function UnitSwitch<T extends string>({value, options, onChange, label}: {
    value: T;
    options: ReadonlyArray<{unit: T; label: string}>;
    onChange: (unit: T) => void;
    label: string;
}) {
    return (
        <div className="ds-pf-units" role="group" aria-label={label}>
            {options.map((o) => (
                <button
                    key={o.unit}
                    type="button"
                    onClick={() => onChange(o.unit)}
                    aria-pressed={value === o.unit}
                    className={cx('ds-pf-unit ds-control', value === o.unit && 'is-selected')}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function Pill({children, tone = 'muted'}: {children: React.ReactNode; tone?: 'muted' | 'sage' | 'mist' | 'butter' | 'low' | 'lavender'}) {
    return <span className={cx('ds-pf-pill', `is-${tone}`)}>{children}</span>;
}

/** Maps the existing BMI evaluation colour (sky / emerald / amber / rose) to a design-system tone. */
export function bmiTone(colorClass: string): 'mist' | 'sage' | 'butter' | 'low' {
    if (colorClass.includes('emerald')) return 'sage';
    if (colorClass.includes('amber')) return 'butter';
    if (colorClass.includes('rose')) return 'low';
    return 'mist';
}

const SEGMENT_TONES = ['mist', 'sage', 'butter', 'low'] as const;

/** BMI scale: four segments with the caller's widths and titles, plus an optional marker. */
export function BmiScale({segments, markerPercent, labels}: {
    segments: ReadonlyArray<{width: string; title: string}>;
    markerPercent?: number;
    labels?: ReadonlyArray<{text: string; strong?: boolean}>;
}) {
    return (
        <div className="ds-pf-scale">
            <div className="ds-pf-scale-track">
                {markerPercent !== undefined && (
                    <span className="ds-pf-scale-marker" style={{left: `${markerPercent}%`}} aria-hidden />
                )}
                <div className="ds-pf-scale-bar">
                    {segments.map((s, i) => (
                        <div key={i} style={{width: s.width}} title={s.title} className={cx('ds-pf-scale-seg', `is-${SEGMENT_TONES[i]}`)} />
                    ))}
                </div>
            </div>
            {labels && (
                <div className="ds-pf-scale-labels">
                    {labels.map((l, i) => (
                        <span key={i} className={cx('t-caption', l.strong ? 'ds-pf-scale-strong' : 't-ink-2')}>{l.text}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Collapsible profile group: a full-width header button with title + summary, content below. */
export function ProfileGroup({id, icon, tone, title, summary, open, onToggle, children}: {
    id: string;
    icon: UiIconName;
    tone: 'sage' | 'mist' | 'lavender' | 'butter';
    title: string;
    summary: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    const panelId = `ds-pf-group-${id}`;
    return (
        <section className={cx('ds-card ds-pf-group', open && 'is-open')} aria-labelledby={`${panelId}-title`}>
            <button type="button" className="ds-pf-group-head ds-control" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
                <span className={cx('ds-pf-group-icon', `is-${tone}`)}>
                    <Icon name={icon} />
                </span>
                <span className="ds-pf-group-text">
                    <span className="t-title ds-pf-group-title" id={`${panelId}-title`}>{title}</span>
                    {!open && summary && <span className="t-caption t-ink-2 ds-pf-group-summary">{summary}</span>}
                </span>
                <span className="ds-pf-group-toggle t-caption">
                    <span>{open ? '收起' : '展開'}</span>
                    <Icon name="expand" size={20} className={cx('ds-pf-chevron', open && 'is-open')} />
                </span>
            </button>
            {open && (
                <div className="ds-pf-group-body" id={panelId}>
                    {children}
                </div>
            )}
        </section>
    );
}

export function FieldBlock({label, hint, htmlFor, children, aside}: {label: React.ReactNode; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; aside?: React.ReactNode}) {
    return (
        <div className="ds-pf-field">
            <div className="ds-pf-field-head">
                {htmlFor ? <label htmlFor={htmlFor} className="t-label">{label}</label> : <span className="t-label">{label}</span>}
                {aside}
            </div>
            {hint && <p className="t-caption t-ink-2">{hint}</p>}
            {children}
        </div>
    );
}
