import React from 'react';
import {cx} from './cx';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
    selected = false,
    className,
    type = 'button',
    children,
    ...rest
}) => {
    return (
        <button
            type={type}
            aria-pressed={selected}
            className={cx('ds-root', 'ds-chip', 'ds-control', selected && 'ds-chip-selected', className)}
            {...rest}
        >
            {children}
        </button>
    );
};
