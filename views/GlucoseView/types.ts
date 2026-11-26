import type {GlucoseRecord} from '../../utils/types';

export interface GlucoseViewProps {
    newGlucose: { 
        value: string; 
        timeType: GlucoseRecord['timeType'] | ''; 
        symptoms: string[];
        mealTag?: GlucoseRecord['mealTag'];
        dietNote?: string;
        exerciseNote?: string;
        illnessNote?: string;
        medicationNote?: string;
        bpSystolic?: string;
        bpDiastolic?: string;
        pulse?: string;
        weight?: string;
        mood?: string;
        customTimestamp?: number;
        customDateStr?: string;
    };
    setNewGlucose: (val: any) => void;
    addGlucoseRecord: () => void;
    glucoseRecords: GlucoseRecord[];
    setGlucoseRecords: (records: GlucoseRecord[]) => void;
    hba1cRecords: any[];
    setHba1cRecords: (records: any[]) => void;
    newHbA1c: { value: string; date: string };
    setNewHbA1c: (val: { value: string; date: string }) => void;
    addHbA1cRecord: () => void;
    [key: string]: any;
}
