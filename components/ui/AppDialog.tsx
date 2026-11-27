import React, {useEffect, useId, useRef, useState} from 'react';

/**
 * In-app alert / confirm dialog (Stage 12; S3 same-designer recipe). Replaces
 * the browser's window.alert while the host is mounted; every message string
 * is passed through unchanged. appConfirm resolves true only for its confirm
 * button (確定 by default; 取消, Escape and a backdrop tap resolve false),
 * matching window.confirm's result.
 *
 * S3: a centred dialog ("deciding happens in the middle, choosing at the
 * bottom"): optional question title, the message, then full-width stacked
 * actions — confirm on top, 取消 below. Options are UI only and optional;
 * existing calls look new but behave exactly as before (focus still starts on
 * the confirm button). `tone: 'danger'` gives the soft-red confirm and starts
 * focus on 取消 — for the new delete confirmations of stage S4.
 */
export interface AppDialogOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'default' | 'danger';
}

type DialogRequest = {id: number; kind: 'alert' | 'confirm'; message: string; options: AppDialogOptions; resolve: (ok: boolean) => void};

let queue: DialogRequest[] = [];
let notify: ((next: DialogRequest[]) => void) | null = null;
let seq = 0;

function enqueue(kind: DialogRequest['kind'], message: string, options: AppDialogOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
        queue = [...queue, {id: ++seq, kind, message, options, resolve}];
        notify?.(queue);
    });
}

/** Shows a message in the in-app sheet (falls back to window.alert before the host mounts). */
export function appAlert(message: string, options?: AppDialogOptions): Promise<void> {
    if (!notify) {
        window.alert(message);
        return Promise.resolve();
    }
    return enqueue('alert', message, options).then(() => undefined);
}

/** In-app replacement for window.confirm: true only when the user taps 確定. */
/**
 * D-b1 (owner-approved): a second step before something can't be undone.
 * Runs `action` — the original handler, unchanged — only after the person
 * taps the soft-red confirm; 取消 / Escape / backdrop do nothing.
 */
export function confirmThen(title: string, message: string, confirmLabel: string, action: () => void): void {
    void appConfirm(message, {title, confirmLabel, tone: 'danger'}).then((ok) => {
        if (ok) action();
    });
}

export function appConfirm(message: string, options?: AppDialogOptions): Promise<boolean> {
    if (!notify) return Promise.resolve(window.confirm(message));
    return enqueue('confirm', message, options);
}

export function AppDialogHost() {
    const [items, setItems] = useState<DialogRequest[]>(queue);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);
    const messageId = useId();
    const titleId = useId();
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
        const startOnCancel = current.kind === 'confirm' && current.options.tone === 'danger';
        (startOnCancel ? cancelRef.current : primaryRef.current)?.focus();
    }, [current?.id]);

    if (!current) return null;
    const isConfirm = current.kind === 'confirm';
    const {title, confirmLabel, cancelLabel, tone} = current.options;
    const isDanger = isConfirm && tone === 'danger';

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
        <div className="ds-root ds-app-dialog-backdrop" onClick={() => close(false)}>
            <div
                key={current.id}
                ref={sheetRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={messageId}
                className="ds-app-dialog"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
            >
                {title && <h2 id={titleId} className="t-title ds-app-dialog-title">{title}</h2>}
                <p id={messageId} className={`t-body ds-app-dialog-message${title ? ' is-secondary' : ''}`}>{current.message}</p>
                <div className="ds-app-dialog-actions">
                    <button
                        ref={primaryRef}
                        type="button"
                        className={`ds-btn ds-control ds-btn-block ${isDanger ? 'ds-btn-danger' : 'ds-btn-primary'}`}
                        onClick={() => close(true)}
                    >
                        {isConfirm ? (confirmLabel ?? '確定') : (confirmLabel ?? '知道了')}
                    </button>
                    {isConfirm && (
                        <button ref={cancelRef} type="button" className="ds-btn ds-btn-secondary ds-btn-block ds-control" onClick={() => close(false)}>
                            {cancelLabel ?? '取消'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
