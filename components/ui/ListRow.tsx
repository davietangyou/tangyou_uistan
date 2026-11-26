import React from 'react';
import {ChevronRight} from 'lucide-react';
import {cx} from './cx';
import {UI_ICON_DEFAULTS} from './icons';

export interface ListRowProps {
    title: string;
    description?: string;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    showChevron?: boolean;
    onClick?: () => void;
    className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
    title,
    description,
    leading,
    trailing,
    showChevron,
    onClick,
    className,
}) => {
    const clickable = typeof onClick === 'function';
    const Comp = clickable ? 'button' : 'div';
    const chevron = showChevron ?? clickable;

    return (
        <Comp
            className={cx('ds-root', 'ds-list-row', clickable && 'ds-control', className)}
            {...(clickable ? {type: 'button' as const, onClick} : {})}
        >
            {leading ? <span className="ds-list-row-lead">{leading}</span> : null}
            <span className="ds-list-row-body">
                <span className="t-body-strong" style={{display: 'block'}}>{title}</span>
                {description ? (
                    <span className="t-caption t-ink-3 ds-list-row-meta" style={{display: 'block'}}>
                        {description}
                    </span>
                ) : null}
            </span>
            {trailing ? <span className="ds-list-row-trail">{trailing}</span> : null}
            {chevron ? (
                <span className="ds-list-row-trail" aria-hidden>
                    <ChevronRight size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} />
                </span>
            ) : null}
        </Comp>
    );
};
