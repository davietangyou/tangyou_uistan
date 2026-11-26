import type {UserProfile, View} from '../../utils/types';

export interface MeViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    setView: (view: View) => void;
    isLargeFont?: boolean;
}
