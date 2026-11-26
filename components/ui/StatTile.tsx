import React from 'react';
import {cx} from './cx';

export type StatTone = 'neutral' | 'low' | 'target' | 'high' | 'info';

export interface StatTileProps {
    label: string;
    value: React.ReactNode;
    unit?: string;
    /** Status must be written out; colour is never the only cue. */
    statusLabel?: string;
    tone?: StatTone;
    className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
    label,
    value,
    unit,
    statusLabel,
    tone = 'neutral',
    className,
}) => {
    return (
        <div className={cx('ds-root', 'ds-stat', tone !== 'neutral' && `ds-stat-tone-${tone}`, className)}>
            <div className="t-caption t-ink-3">{label}</div>
            <div>
                <span className="t-display-strong ds-stat-value">{value}</span>
                {unit ? <span className="ds-stat-unit">{unit}</span> : null}
            </div>
            {statusLabel ? (
                <div className={cx('t-body-strong', tone === 'low' && 't-danger')}>{statusLabel}</div>
            ) : null}
        </div>
    );
};
