import type {GlucoseRecord, View, UserProfile} from '../../utils/types';

export interface HomeViewProps {
    glucoseRecords: GlucoseRecord[];
    setView: (view: View) => void;
    setConsultStep: (step: 'INPUT' | 'CLARIFY' | 'RESULT') => void;
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    isLargeFont?: boolean;
    setIsLargeFont?: (val: boolean) => void;

    // 允许传入其他来自 useAppLogic 的 props
    [key: string]: any;
}
