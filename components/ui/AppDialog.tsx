import React, {useEffect, useId, useRef, useState} from 'react';

/**
 * In-app alert / confirm bottom sheet (Stage 12). Replaces the browser's
 * window.alert while the host is mounted; every message string is passed
 * through unchanged. appConfirm resolves true only for 確定 (Cancel, Escape
 * and a backdrop tap resolve false), matching window.confirm's result.
 */
type DialogRequest = {id: number; kind: 'alert' | 'confirm'; message: string; resolve: (ok: boolean) => void};

let queue: DialogRequest[] = [];
let notify: ((next: DialogRequest[]) => void) | null = null;
let seq = 0;

function enqueue(kind: DialogRequest['kind'], message: string): Promise<boolean> {
    return new Promise((resolve) => {
        queue = [...queue, {id: ++seq, kind, message, resolve}];
        notify?.(queue);
    });
}

/** Shows a message in the in-app sheet (falls back to window.alert before the host mounts). */
export function appAlert(message: string): Promise<void> {
    if (!notify) {
        window.alert(message);
        return Promise.resolve();
    }
    return enqueue('alert', message).then(() => undefined);
}

/** In-app replacement for window.confirm: true only when the user taps 確定. */
export function appConfirm(message: string): Promise<boolean> {
    if (!notify) return Promise.resolve(window.confirm(message));
    return enqueue('confirm', message);
}

export function AppDialogHost() {
    const [items, setItems] = useState<DialogRequest[]>(queue);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);
    const messageId = useId();
    const current = items[0];

    useEffect(() => {
        notify = setItems;
        const previousAlert = window.alert;
        window.alert = (message?: unknown) => {
            void enqueue('alert', message === undefined ? '' : String(message));
        };
        return () => {
            notify = null;
            window.alert = previousAlert;
        };
    }, []);

    useEffect(() => {
        if (!current) return;
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        primaryRef.current?.focus();
    }, [current?.id]);

    if (!current) return null;
    const isConfirm = current.kind === 'confirm';

    const close = (ok: boolean) => {
        queue = queue.slice(1);
        setItems(queue);
        current.resolve(ok);
        if (queue.length === 0) returnFocusRef.current?.focus?.();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close(false);
            return;
        }
        if (e.key === 'Tab') {
            const buttons = Array.from(sheetRef.current?.querySelectorAll('button') ?? []);
            if (buttons.length === 0) return;
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    return (
        <div className="ds-root ds-app-sheet-backdrop" onClick={() => close(false)}>
            <div
                ref={sheetRef}
                role="alertdialog"
                aria-modal="true"
                aria-describedby={messageId}
                className="ds-app-sheet"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
            >
                <p id={messageId} className="t-body ds-app-sheet-message">{current.message}</p>
                <div className="ds-app-sheet-actions">
                    {isConfirm && (
                        <button type="button" className="ds-btn ds-btn-secondary ds-control" onClick={() => close(false)}>
                            取消
                        </button>
                    )}
                    <button ref={primaryRef} type="button" className="ds-btn ds-btn-primary ds-control" onClick={() => close(true)}>
                        {isConfirm ? '確定' : '知道了'}
                    </button>
                </div>
            </div>
        </div>
    );
}
