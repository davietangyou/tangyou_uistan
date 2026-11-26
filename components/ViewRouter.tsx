import {View} from '../utils/types';
import {OnboardingView} from '../views/OnboardingView';
import {HomeView} from '../views/HomeView';
import {GlucoseView} from '../views/GlucoseView';
import {ConsultView} from '../views/ConsultView';
import {MeView} from '../views/MeView';
import {DetailView} from '../views/DetailView'; // 已註冊但無入口（View.Detail），請勿刪除
import {SavedQuestionsView} from '../views/SavedQuestionsView';

/** Renders the active view from useAppLogic. View.Detail / View.Result stay registered. */
export function ViewRouter({logic}: {logic: any}) {
    const {view} = logic;
    return (
        <>
            {view === View.Onboarding && <OnboardingView {...logic} />}

            {view === View.Home && <HomeView {...logic} />}

            {view === View.Glucose && <GlucoseView {...logic} />}

            {view === View.Consult && <ConsultView {...logic} />}

            {view === View.Me && <MeView {...logic} />}

            {view === View.SavedQuestions && <SavedQuestionsView {...logic} />}

            {/* 未接線：無任何 setView(View.Detail)。View.Result 同樣未使用。請勿刪除。 */}
            {view === View.Detail && <DetailView {...logic} />}
        </>
    );
}
