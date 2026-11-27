import {View} from '../utils/types';
import type {AppLogic} from '../hooks/useAppLogic';
import {OnboardingView} from '../views/OnboardingView';
import {HomeView} from '../views/HomeView';
import {GlucoseView} from '../views/GlucoseView';
import {ConsultView} from '../views/ConsultView';
import {MeView} from '../views/MeView';
import {SavedQuestionsView} from '../views/SavedQuestionsView';
import {ViewStage} from './shell/ViewStage';

/**
 * Renders the active view from useAppLogic. View.Detail / View.Result stay in the enum (logic contract) but have no page.
 * Stage S2: pages are hosted by ViewStage, which keeps 問 AI / 問題紀錄 / 個人檔案 mounted once visited
 * (user decision 2026-11-27) and mounts the others fresh on every visit, as before.
 */
export function ViewRouter({logic}: {logic: AppLogic}) {
    const renderView = (v: View) => {
        switch (v) {
            case View.Onboarding: return <OnboardingView {...logic} />;
            case View.Home: return <HomeView {...logic} />;
            case View.Glucose: return <GlucoseView {...logic} />;
            case View.Consult: return <ConsultView {...logic} />;
            case View.Me: return <MeView {...logic} />;
            case View.SavedQuestions: return <SavedQuestionsView {...logic} />;
            default: return null;
        }
    };
    return <ViewStage view={logic.view} renderView={renderView} />;
}
