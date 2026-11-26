import type {GlucoseRecord, HbA1cRecord, UserProfile, View} from '../../utils/types';

export interface ConsultViewProps {
    loading: boolean;
    profile: UserProfile;
    glucoseRecords: GlucoseRecord[];
    hba1cRecords?: HbA1cRecord[];
    setView: (view: View) => void;
    saveDoctorQuestions: (qs: string[]) => void;
    isLargeFont?: boolean;
}
