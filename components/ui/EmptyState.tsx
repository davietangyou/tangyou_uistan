import React from 'react';
import {cx} from './cx';
import {uiIcons, type UiIconName} from './icons';

/**
 * Empty state (stage S3): empty is not an error. A white circle with the
 * domain's line icon, one plain statement, an optional quiet line, and one way
 * out. No sad illustrations, no "oops". The page's own words are passed in
 * unchanged.
 */
export interface EmptyStateProps {
    icon: UiIconName;
    title: React.ReactNode;
    children?: React.ReactNode;
    action?: React.ReactNode;
    tone?: 'sage' | 'sky' | 'lilac' | 'sun' | 'plain';
    className?: string;
}

export function EmptyState({icon, title, children, action, tone = 'plain', className}: EmptyStateProps) {
    const Glyph = uiIcons[icon];
    return (
        <div className={cx('ds-root ds-empty', `ds-empty-${tone}`, className)}>
            <span className="ds-empty-mark" aria-hidden><Glyph size={32} strokeWidth={1.75} /></span>
            <p className="t-title ds-empty-title">{title}</p>
            {children && <div className="t-body ds-empty-text">{children}</div>}
            {action && <div className="ds-empty-action">{action}</div>}
        </div>
    );
}
