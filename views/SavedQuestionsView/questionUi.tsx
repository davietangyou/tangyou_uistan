/**
 * Stage 7 shared display pieces for 問題紀錄 (SavedQuestionsView).
 * Presentation only: handlers come from the section that owns them.
 */
import React from 'react';
import {cx, Icon, type UiIconName} from '../../components/ui';

export function CountPill({children, tone = 'sage'}: {children: React.ReactNode; tone?: 'sage' | 'muted' | 'lavender'}) {
    return <span className={cx('ds-sq-pill', `is-${tone}`)}>{children}</span>;
}

/** 展開 / 收起 toggle with a chevron; keeps the original 展開 / 收起 wording. */
export function ExpandToggle({expanded, onClick, label}: {expanded: boolean; onClick: () => void; label: string}) {
    return (
        <button type="button" onClick={onClick} aria-expanded={expanded} aria-label={`${expanded ? '收起' : '展開'}${label}`} className="ds-btn ds-btn-ghost ds-control ds-sq-toggle">
            <span>{expanded ? '收起' : '展開'}</span>
            <Icon name="expand" className={cx('ds-sq-chevron', expanded && 'is-open')} />
        </button>
    );
}

export function SectionHead({icon, tone, title, aside, children}: {
    icon: UiIconName;
    tone: 'lavender' | 'sage' | 'mist';
    title: string;
    aside?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="ds-sq-head">
            <div className="ds-sq-head-row">
                <span className={cx('ds-sq-head-icon', `is-${tone}`)}>
                    <Icon name={icon} />
                </span>
                <h3 className="t-title ds-sq-head-title">{title}</h3>
                {aside}
            </div>
            {children}
        </div>
    );
}

export function IndexBadge({n, active = false}: {n: number; active?: boolean}) {
    return <span className={cx('ds-sq-index', active && 'is-active')} aria-hidden>{n}</span>;
}
