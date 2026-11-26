import React from 'react';
import {cx} from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    fullWidth = false,
    className,
    type = 'button',
    children,
    ...rest
}) => {
    return (
        <button
            type={type}
            className={cx(
                'ds-root',
                'ds-btn',
                'ds-control',
                `ds-btn-${variant}`,
                fullWidth && 'ds-btn-block',
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
};
