import React from 'react';
import {cx} from './cx';

type CardElement = 'article' | 'section' | 'div';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
    as?: CardElement;
    muted?: boolean;
    flush?: boolean;
}

export const Card: React.FC<CardProps> = ({
    as: Comp = 'section',
    muted = false,
    flush = false,
    className,
    children,
    ...rest
}) => {
    return (
        <Comp
            className={cx('ds-root', 'ds-card', muted && 'ds-card-muted', flush && 'ds-card-flush', className)}
            {...rest}
        >
            {children}
        </Comp>
    );
};
