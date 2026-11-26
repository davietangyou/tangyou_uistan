import type {UserProfile, View} from '../../utils/types';

export interface OnboardingViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    onboardingStep: number;
    setOnboardingStep: (step: number) => void;
    setView: (view: View) => void;
    toggleCondition: (conditionId: string) => void;
    isLargeFont?: boolean;
}
