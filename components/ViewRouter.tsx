import {lazy, Suspense, useEffect, useState, type ComponentType} from 'react';
import {View} from '../utils/types';
import type {AppLogic} from '../hooks/useAppLogic';
import {OnboardingView} from '../views/OnboardingView';
import {HomeView} from '../views/HomeView';
import {ViewStage} from './shell/ViewStage';

/*
 * Consolidation (perf): 首頁 and 首次設定 ship in the entry chunk; the other
 * tabs (and recharts / react-markdown with them) load as separate chunks,
 * fetched on idle right after the first screen so a tab tap stays instant.
 */
/**
 * A tab chunk that renders synchronously once loaded. React.lazy alone would
 * suspend once even for an already-fetched chunk, and React holds a shown
 * fallback ~300ms — the first tap on a tab would feel slower than before.
 * The component is chosen once per mount, so a kept-alive page never remounts.
 */
function tabChunk<P extends object>(load: () => Promise<Record<string, unknown>>, name: string) {
    let Loaded: ComponentType<P> | null = null;
    let pending: Promise<void> | null = null;
    const prefetch = () => (pending ??= load().then((m) => { Loaded = m[name] as ComponentType<P>; }));
    const Lazy = lazy(() => prefetch().then(() => ({default: Loaded as ComponentType<P>})));
    function TabView(props: P) {
        const [C] = useState<ComponentType<P>>(() => Loaded ?? (Lazy as unknown as ComponentType<P>));
        return <C {...props} />;
    }
    return {prefetch, TabView};
}

const Glucose = tabChunk<AppLogic>(() => import('../views/GlucoseView'), 'GlucoseView');
const Consult = tabChunk<AppLogic>(() => import('../views/ConsultView'), 'ConsultView');
const Me = tabChunk<AppLogic>(() => import('../views/MeView'), 'MeView');
const SavedQuestions = tabChunk<AppLogic>(() => import('../views/SavedQuestionsView'), 'SavedQuestionsView');
const GlucoseView = Glucose.TabView;
const ConsultView = Consult.TabView;
const MeView = Me.TabView;
const SavedQuestionsView = SavedQuestions.TabView;

function usePrefetchViews() {
    useEffect(() => {
        const run = () => { void Consult.prefetch(); void Glucose.prefetch(); void SavedQuestions.prefetch(); void Me.prefetch(); };
        const w = window as Window & {requestIdleCallback?: (cb: () => void, o?: {timeout: number}) => number; cancelIdleCallback?: (id: number) => void};
        if (w.requestIdleCallback) {
            const id = w.requestIdleCallback(run, {timeout: 2500});
            return () => w.cancelIdleCallback?.(id);
        }
        const t = window.setTimeout(run, 1200);
        return () => window.clearTimeout(t);
    }, []);
}

const paneFallback = <div className="ds-view-pending" aria-busy="true" />;

/**
 * Renders the active view from useAppLogic. View.Detail / View.Result stay in the enum (logic contract) but have no page.
 * Stage S2: pages are hosted by ViewStage, which keeps 問 AI / 問題紀錄 / 個人檔案 mounted once visited
 * (user decision 2026-11-27) and mounts the others fresh on every visit, as before.
 */
export function ViewRouter({logic}: {logic: AppLogic}) {
    usePrefetchViews();
    const renderView = (v: View) => {
        switch (v) {
            case View.Onboarding: return <OnboardingView {...logic} />;
            case View.Home: return <HomeView {...logic} />;
            case View.Glucose: return <Suspense fallback={paneFallback}><GlucoseView {...logic} /></Suspense>;
            case View.Consult: return <Suspense fallback={paneFallback}><ConsultView {...logic} /></Suspense>;
            case View.Me: return <Suspense fallback={paneFallback}><MeView {...logic} /></Suspense>;
            case View.SavedQuestions: return <Suspense fallback={paneFallback}><SavedQuestionsView {...logic} /></Suspense>;
            default: return null;
        }
    };
    return <ViewStage view={logic.view} renderView={renderView} />;
}
