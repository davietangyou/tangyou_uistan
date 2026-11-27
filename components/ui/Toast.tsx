import React from 'react';
import {cx} from './cx';
import {uiIcons} from './icons';

/**
 * Toast (stage S3): a quiet sentence near the top that never fights the
 * floating nav or the voice button. Callers keep their own timing and their
 * own words (e.g. 4.5s success, 3s focus hint) — this is only the look.
 * tone: success (soft green, ✓), info (charcoal), warn (amber).
 */
export interface ToastProps {
    tone?: 'success' | 'info' | 'warn';
    children: React.ReactNode;
    /** Optional trailing action (a button element). */
    action?: React.ReactNode;
    icon?: React.ReactNode | false;
    className?: string;
}

export function Toast({tone = 'info', children, action, icon, className}: ToastProps) {
    const Check = uiIcons.check;
    const Info = uiIcons.info;
    const Warn = uiIcons.warning;
    const glyph = icon === false ? null : icon ?? (tone === 'success' ? <Check size={22} strokeWidth={2.25} aria-hidden /> : tone === 'warn' ? <Warn size={22} strokeWidth={2} aria-hidden /> : <Info size={22} strokeWidth={2} aria-hidden />);
    return (
        <div className={cx('ds-root ds-toast', `ds-toast-${tone}`, className)} role="status" aria-live="polite">
            {glyph && <span className="ds-toast-icon">{glyph}</span>}
            <span className="ds-toast-text">{children}</span>
            {action}
        </div>
    );
}
