import type {UserProfile, View} from '../../utils/types';

export interface OnboardingViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    onboardingStep: number;
    setOnboardingStep: (step: number) => void;
    setView: (view: View) => void;
    toggleCondition: (conditionId: string) => void;
    isLargeFont?: boolean;

    // 允許傳入其他來自 useAppLogic 的 props
    [key: string]: any;
}
