import type {UserProfile, View} from '../../utils/types';

export interface SavedQuestionsViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    setView: (view: View) => void;
    isLargeFont?: boolean;
    [key: string]: any;
}
