import {View} from '../utils/types';
import type {AppLogic} from '../hooks/useAppLogic';
import {OnboardingView} from '../views/OnboardingView';
import {HomeView} from '../views/HomeView';
import {GlucoseView} from '../views/GlucoseView';
import {ConsultView} from '../views/ConsultView';
import {MeView} from '../views/MeView';
import {SavedQuestionsView} from '../views/SavedQuestionsView';

/** Renders the active view from useAppLogic. View.Detail / View.Result stay in the enum (logic contract) but have no page. */
export function ViewRouter({logic}: {logic: AppLogic}) {
    const {view} = logic;
    return (
        <>
            {view === View.Onboarding && <OnboardingView {...logic} />}

            {view === View.Home && <HomeView {...logic} />}

            {view === View.Glucose && <GlucoseView {...logic} />}

            {view === View.Consult && <ConsultView {...logic} />}

            {view === View.Me && <MeView {...logic} />}

            {view === View.SavedQuestions && <SavedQuestionsView {...logic} />}
        </>
    );
}
