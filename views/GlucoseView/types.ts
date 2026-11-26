import type {GlucoseRecord, HbA1cRecord} from '../../utils/types';
import type {NewGlucoseDraft} from '../../domain';

export interface GlucoseViewProps {
    newGlucose: NewGlucoseDraft;
    setNewGlucose: (val: any) => void;
    addGlucoseRecord: () => void;
    glucoseRecords: GlucoseRecord[];
    setGlucoseRecords: (records: GlucoseRecord[]) => void;
    hba1cRecords: HbA1cRecord[];
    setHba1cRecords: (records: HbA1cRecord[]) => void;
    newHbA1c: { value: string; date: string };
    setNewHbA1c: (val: { value: string; date: string }) => void;
    addHbA1cRecord: () => void;
    [key: string]: any;
}
