import React, {useRef} from 'react';
import {createPortal} from 'react-dom';
import {cx} from './cx';
import {IconButton} from './IconButton';
import {useFocusTrap} from './useFocusTrap';

export interface DialogProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const Dialog: React.FC<DialogProps> = ({open, title, onClose, children, className}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    useFocusTrap(open, panelRef, onClose);

    if (!open || typeof document === 'undefined') return null;

    const titleId = 'ds-dialog-title';

    return createPortal(
        <>
            <div className="ds-root ds-backdrop" onClick={onClose} />
            <div
                ref={panelRef}
                className={cx('ds-root', 'ds-dialog', className)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <div className="ds-overlay-head">
                    <h2 id={titleId} className="t-h2 t-ink">{title}</h2>
                    <IconButton icon="close" aria-label="關閉" onClick={onClose} tone="plain" />
                </div>
                {children}
            </div>
        </>,
        document.body,
    );
};
