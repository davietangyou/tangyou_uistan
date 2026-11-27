import React, {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {View} from '../../utils/types';
import {ViewActiveContext, ViewPaneContext, type ViewPaneApi} from './viewPane';

/**
 * Page stage (stage S2): how the bottom-nav pages live.
 *
 * Kept alive (user decision 2026-11-27): 問 AI, 問題紀錄, 個人檔案. Once
 * visited they stay mounted, so an AI reply, an AI 總結 or a medicine scan that
 * is still running keeps going while the user looks at another tab.
 *
 * While a kept-alive page is not shown, its DOM is parked outside the
 * document (not merely hidden). Its fields therefore stop being voice targets
 * (useSpeechFocus checks document.body.contains), cannot be focused or found,
 * and the document only ever contains the page the user is looking at — the
 * same as before, when leaving a page unmounted it.
 *
 * Mounted fresh on every visit, as before: 首頁 and 血糖紀錄 (their view models
 * compute business defaults on mount — the suggested 測量時段, the live clock,
 * the 改期 draft — and those must keep being computed on each visit), and 首次設定.
 */
const KEEP_ALIVE: ReadonlySet<View> = new Set([View.Consult, View.SavedQuestions, View.Me]);

export function isKeptAlive(view: View): boolean {
    return KEEP_ALIVE.has(view);
}

/** Pane contents: the page body plus a layer for its sub-pages. */
function PaneInner({children}: {children: React.ReactNode}) {
    const [layer, setLayer] = useState<HTMLElement | null>(null);
    const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
    const setSubPageOpen = useCallback((id: string, open: boolean) => {
        setOpenIds((prev) => {
            if (prev.has(id) === open) return prev;
            const next = new Set(prev);
            if (open) next.add(id); else next.delete(id);
            return next;
        });
    }, []);
    const api = useMemo<ViewPaneApi>(() => ({layer, setSubPageOpen}), [layer, setSubPageOpen]);
    const covered = openIds.size > 0;

    return (
        <ViewPaneContext.Provider value={api}>
            <div className="ds-view-body" inert={covered || undefined} aria-hidden={covered || undefined}>
                {children}
            </div>
            <div className="ds-subpage-layer" ref={setLayer} />
        </ViewPaneContext.Provider>
    );
}

/** A page that is mounted only while shown (unchanged lifecycle). */
function FreshPane({children}: {children: React.ReactNode}) {
    return (
        <div className="ds-view-pane">
            <PaneInner>{children}</PaneInner>
        </div>
    );
}

/** A page that stays mounted; its DOM moves between the stage and a parking spot. */
function KeptPane({active, children}: {active: boolean; children: React.ReactNode}) {
    const [host] = useState(() => {
        const el = document.createElement('div');
        el.className = 'ds-view-pane';
        return el;
    });
    const slotRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const slot = slotRef.current;
        if (!slot) return;
        if (active) {
            if (host.parentNode !== slot) slot.appendChild(host);
        } else if (host.parentNode) {
            host.parentNode.removeChild(host);
        }
    }, [active, host]);

    useLayoutEffect(() => () => {
        host.parentNode?.removeChild(host);
    }, [host]);

    return (
        <>
            {/* The slot re-enters display each time the page is shown, which replays the tab fade. */}
            <div ref={slotRef} className="ds-view-slot" hidden={!active} />
            {createPortal(
                <ViewActiveContext.Provider value={active}>
                    <PaneInner>{children}</PaneInner>
                </ViewActiveContext.Provider>,
                host,
            )}
        </>
    );
}

export interface ViewStageProps {
    view: View;
    /** Renders the page for a view (the same element ViewRouter rendered before). */
    renderView: (view: View) => React.ReactNode;
}

export function ViewStage({view, renderView}: ViewStageProps) {
    // Kept-alive pages visited so far, in first-visit order (stable slots).
    const visitedRef = useRef<View[]>([]);
    if (isKeptAlive(view) && !visitedRef.current.includes(view)) {
        visitedRef.current = [...visitedRef.current, view];
    }

    return (
        <>
            {!isKeptAlive(view) && <FreshPane key={view}>{renderView(view)}</FreshPane>}
            {visitedRef.current.map((v) => (
                <KeptPane key={v} active={v === view}>
                    {renderView(v)}
                </KeptPane>
            ))}
        </>
    );
}
