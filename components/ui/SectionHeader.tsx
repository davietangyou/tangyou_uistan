import React from 'react';
import {cx} from './cx';

export interface SectionHeaderProps {
    title: string;
    action?: React.ReactNode;
    as?: 'h2' | 'h3';
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    action,
    as: Heading = 'h2',
    className,
}) => {
    return (
        <div className={cx('ds-root', 'ds-section-header', className)}>
            <Heading className="t-h2 t-ink">{title}</Heading>
            {action}
        </div>
    );
};
