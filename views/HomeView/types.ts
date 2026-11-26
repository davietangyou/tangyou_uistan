import type {GlucoseRecord, View, UserProfile, ConsultStep} from '../../utils/types';

export interface HomeViewProps {
    glucoseRecords: GlucoseRecord[];
    setView: (view: View) => void;
    setConsultStep: (step: ConsultStep) => void;
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    isLargeFont?: boolean;
    setIsLargeFont?: (val: boolean) => void;
}
