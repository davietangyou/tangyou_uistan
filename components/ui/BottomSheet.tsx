import React, {useContext, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {ViewActiveContext, ViewPaneContext} from '../shell/viewPane';
import {backFromSubPage, dropSubPage, pushSubPage} from '../shell/subPageHistory';
import {uiIcons} from './icons';

/**
 * Bottom sheet (stage S3): "pick something up from beside your hand".
 * For choosing (time, period, range, tags) and light edits. Rises 24px with
 * a fade (240ms), leaves in 200ms; warm 42% scrim (tap = close); grabber you
 * can drag down (≥72px, or >16px fast); Escape and the system back close it.
 *
 * The page underneath becomes inert, but the global voice button stays on top
 * and clickable, so fields inside a sheet can still take voice input. The
 * sheet portals into its page's layer (parks with a kept-alive page); outside
 * a page it falls back to document.body.
 */
export interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    /** One quiet line under the title, e.g. 滾動選擇，按「完成」後才會套用。 */
    hint?: React.ReactNode;
    children?: React.ReactNode;
    /** Pinned actions (primary on top / right per caller). */
    footer?: React.ReactNode;
    /** Hide the round × (e.g. when the footer already has 取消). */
    hideClose?: boolean;
    closeLabel?: string;
    className?: string;
}

const EXIT_MS = 200;

export function BottomSheet({open, onClose, title, hint, children, footer, hideClose, closeLabel = '關閉', className}: BottomSheetProps) {
    const pane = useContext(ViewPaneContext);
    const active = useContext(ViewActiveContext);
    const id = useId();
    const titleId = `${id}-t`;
    const [rendered, setRendered] = useState(open);
    const [leaving, setLeaving] = useState(false);
    const [drag, setDrag] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const dragRef = useRef<{y: number; t: number} | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const shown = open && active;

    useLayoutEffect(() => {
        if (open) {
            if (!rendered) openerRef.current = document.activeElement as HTMLElement | null;
            setRendered(true);
            setLeaving(false);
            setDrag(0);
            return;
        }
        if (!rendered) return;
        setLeaving(true);
        const t = window.setTimeout(() => {
            setRendered(false);
            setLeaving(false);
            setDrag(0);
            const opener = openerRef.current;
            if (opener && document.body.contains(opener)) opener.focus({preventScroll: true});
        }, EXIT_MS);
        return () => window.clearTimeout(t);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useLayoutEffect(() => {
        if (open && rendered) sheetRef.current?.focus({preventScroll: true});
    }, [open, rendered]);

    useEffect(() => {
        pane?.setSubPageOpen(id, shown);
        if (!shown) return;
        pushSubPage(id, () => onCloseRef.current());
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                backFromSubPage(id, () => onCloseRef.current());
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            pane?.setSubPageOpen(id, false);
            dropSubPage(id);
        };
    }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!rendered) return null;
    const target = pane?.layer ?? document.body;
    const close = () => backFromSubPage(id, () => onCloseRef.current());
    const CloseIcon = uiIcons.close;

    const onPointerDown = (e: React.PointerEvent) => {
        dragRef.current = {y: e.clientY, t: performance.now()};
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        setDrag(Math.max(0, e.clientY - dragRef.current.y));
    };
    const onPointerUp = (e: React.PointerEvent) => {
        const start = dragRef.current;
        dragRef.current = null;
        if (!start) return;
        const dy = Math.max(0, e.clientY - start.y);
        const velocity = dy / Math.max(1, performance.now() - start.t) * 1000;
        if (dy >= 72 || (dy > 16 && velocity > 500)) close();
        else setDrag(0);
    };

    return createPortal(
        <div className={`ds-root ds-sheet-scrim${leaving ? ' is-leaving' : ''}`} onClick={close}>
            <div
                ref={sheetRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className={`ds-sheet${leaving ? ' is-leaving' : ''}${drag ? ' is-dragging' : ''}${className ? ` ${className}` : ''}`}
                style={drag ? {transform: `translateY(${drag}px)`} : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="ds-sheet-grab"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { dragRef.current = null; setDrag(0); }}
                    aria-hidden
                >
                    <span className="ds-sheet-grabber" />
                </div>
                {(title || !hideClose) && (
                    <div className="ds-sheet-head">
                        <div className="ds-sheet-titles">
                            {title && <h2 id={titleId} className="t-title ds-sheet-title">{title}</h2>}
                            {hint && <p className="t-caption ds-sheet-hint">{hint}</p>}
                        </div>
                        {!hideClose && (
                            <button type="button" className="ds-sheet-close ds-control" aria-label={closeLabel} onClick={close}>
                                <CloseIcon size={22} strokeWidth={2} aria-hidden />
                            </button>
                        )}
                    </div>
                )}
                <div className="ds-sheet-body">{children}</div>
                {footer && <div className="ds-sheet-footer">{footer}</div>}
            </div>
        </div>,
        target,
    );
}
