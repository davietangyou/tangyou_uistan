import {useEffect, type RefObject} from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps focus inside `ref` while `active`, closes on Escape, and restores
 * the previously focused element. Also locks body scroll.
 */
export function useFocusTrap(
    active: boolean,
    ref: RefObject<HTMLElement | null>,
    onClose: () => void,
): void {
    useEffect(() => {
        if (!active || typeof document === 'undefined') return;
        const root = ref.current;
        if (!root) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const items = () =>
            [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
                (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
            );

        const first = items()[0];
        (first ?? root).focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const list = items();
            if (list.length === 0) {
                event.preventDefault();
                return;
            }
            const index = list.indexOf(document.activeElement as HTMLElement);
            if (event.shiftKey) {
                if (index <= 0) {
                    event.preventDefault();
                    list[list.length - 1].focus();
                }
            } else if (index === list.length - 1) {
                event.preventDefault();
                list[0].focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [active, onClose, ref]);
}
