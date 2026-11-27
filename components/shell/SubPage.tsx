import React, {useContext, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {uiIcons} from '../ui/icons';
import {ViewActiveContext, ViewPaneContext} from './viewPane';
import {backFromSubPage, dropSubPage, pushSubPage} from './subPageHistory';

/**
 * Sub-page (stage S2): "one step in". Slides 16px in from the right with a
 * fade (240ms), leaves the same way (200ms), hides the bottom nav, has one way
 * back (round back button, system back gesture), starts at the top, and
 * returns focus to whatever opened it.
 *
 * It is only a container: whatever it shows is the same component state and
 * the same handlers the page used before (no new View, no new setView call).
 * It portals into its page's layer, so it parks together with a kept-alive page.
 */
export interface SubPageProps {
    open: boolean;
    title: React.ReactNode;
    onBack: () => void;
    children: React.ReactNode;
    /** Pinned action bar (e.g. 儲存 / 稍後填寫). */
    footer?: React.ReactNode;
    /** Optional line above the title (e.g. progress). */
    eyebrow?: React.ReactNode;
    backLabel?: string;
    className?: string;
}

const EXIT_MS = 200;

export function SubPage({open, title, onBack, children, footer, eyebrow, backLabel = '返回', className}: SubPageProps) {
    const pane = useContext(ViewPaneContext);
    const active = useContext(ViewActiveContext);
    const id = useId();
    const titleId = `${id}-title`;
    const [rendered, setRendered] = useState(open);
    const [leaving, setLeaving] = useState(false);
    const openerRef = useRef<HTMLElement | null>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLButtonElement>(null);
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;

    const shown = open && active;

    // Mount / exit animation.
    useLayoutEffect(() => {
        if (open) {
            if (!rendered) openerRef.current = document.activeElement as HTMLElement | null;
            setRendered(true);
            setLeaving(false);
            return;
        }
        if (!rendered) return;
        setLeaving(true);
        const t = window.setTimeout(() => {
            setRendered(false);
            setLeaving(false);
            const opener = openerRef.current;
            if (opener && document.body.contains(opener)) opener.focus({preventScroll: true});
        }, EXIT_MS);
        return () => window.clearTimeout(t);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Start at the top; put focus on the way back.
    useLayoutEffect(() => {
        if (!open || !rendered) return;
        scrollerRef.current?.scrollTo(0, 0);
        backRef.current?.focus({preventScroll: true});
    }, [open, rendered]);

    // Tell the pane (covers the page, hides the nav) and the system back stack.
    useEffect(() => {
        pane?.setSubPageOpen(id, shown);
        if (!shown) return;
        pushSubPage(id, () => onBackRef.current());
        return () => {
            pane?.setSubPageOpen(id, false);
            dropSubPage(id);
        };
    }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!shown) return;
        const root = document.documentElement;
        const n = Number(root.dataset.subpages || '0') + 1;
        root.dataset.subpages = String(n);
        return () => {
            const m = Number(root.dataset.subpages || '1') - 1;
            if (m > 0) root.dataset.subpages = String(m);
            else delete root.dataset.subpages;
        };
    }, [shown]);

    if (!rendered || !pane?.layer) return null;
    const BackIcon = uiIcons.back;

    return createPortal(
        <section
            className={`ds-root ds-subpage${leaving ? ' is-leaving' : ''}${className ? ` ${className}` : ''}`}
            role="region"
            aria-labelledby={titleId}
        >
            <div className="ds-subpage-scroller" ref={scrollerRef}>
                <header className="ds-subpage-header">
                    <button
                        ref={backRef}
                        type="button"
                        className="ds-subpage-back ds-control"
                        aria-label={backLabel}
                        onClick={() => backFromSubPage(id, () => onBackRef.current())}
                    >
                        <BackIcon size={26} strokeWidth={2} aria-hidden />
                    </button>
                    <div className="ds-subpage-heading">
                        {eyebrow && <div className="ds-subpage-eyebrow t-caption">{eyebrow}</div>}
                        <h2 id={titleId} className="ds-subpage-title">{title}</h2>
                    </div>
                </header>
                <div className="ds-subpage-body">{children}</div>
            </div>
            {footer && <div className="ds-subpage-footer">{footer}</div>}
        </section>,
        pane.layer,
    );
}
