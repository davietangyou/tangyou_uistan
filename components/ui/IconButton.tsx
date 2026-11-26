import React from 'react';
import type {LucideIcon} from 'lucide-react';
import {cx} from './cx';
import {UI_ICON_DEFAULTS, type UiIconName, uiIcons} from './icons';

export type IconButtonTone = 'muted' | 'plain' | 'ink';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
    /** Accessible name is required — the icon is decorative. */
    'aria-label': string;
    icon: UiIconName | LucideIcon;
    tone?: IconButtonTone;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    tone = 'muted',
    className,
    type = 'button',
    ...rest
}) => {
    const Icon = typeof icon === 'string' ? uiIcons[icon] : icon;
    return (
        <button
            type={type}
            className={cx(
                'ds-root',
                'ds-icon-btn',
                'ds-control',
                tone === 'plain' && 'ds-icon-btn-plain',
                tone === 'ink' && 'ds-icon-btn-ink',
                className,
            )}
            {...rest}
        >
            <Icon size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden />
        </button>
    );
};
