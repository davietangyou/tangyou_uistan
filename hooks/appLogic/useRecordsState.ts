import {useEffect, useState} from 'react';
import type {GlucoseRecord, HbA1cRecord} from '../../utils/types';

export function useRecordsState() {
    const [glucoseRecords, setGlucoseRecords] = useState<GlucoseRecord[]>(() => {
        const saved = localStorage.getItem('dia_glucose');
        return saved ? JSON.parse(saved) : [];
    });

    const [hba1cRecords, setHba1cRecords] = useState<HbA1cRecord[]>(() => {
        const saved = localStorage.getItem('dia_hba1c');
        return saved ? JSON.parse(saved) : [];
    });

    const [newGlucose, setNewGlucose] = useState<{
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
    }>({
        value: '',
        timeType: '',
        symptoms: [],
        mealTag: undefined,
        dietNote: '',
        exerciseNote: '',
        illnessNote: '',
        medicationNote: '',
        bpSystolic: '',
        bpDiastolic: '',
        pulse: '',
        weight: '',
        mood: '',
        customTimestamp: undefined,
        customDateStr: undefined
    });
    const [newHbA1c, setNewHbA1c] = useState({value: '', date: new Date().toISOString().split('T')[0]});

    useEffect(() => localStorage.setItem('dia_glucose', JSON.stringify(glucoseRecords)), [glucoseRecords]);
    useEffect(() => localStorage.setItem('dia_hba1c', JSON.stringify(hba1cRecords)), [hba1cRecords]);

    // 添加血糖或症狀記錄
    const addGlucoseRecord = () => {
        let val = parseFloat(newGlucose.value);
        if (!isNaN(val) && val < 0) {
            val = 0;
        }
        const hasSymptoms = newGlucose.symptoms && newGlucose.symptoms.length > 0;
        
        // 如果既沒有輸入有效數值，也沒有選擇任何症狀，則不作處理
        if (isNaN(val) && !hasSymptoms) return;

        // 如果沒有選擇測量時間點，提示用戶選擇
        if (!newGlucose.timeType) {
            alert('請先選擇「測量時間點」噢！');
            return;
        }

        const recordDate = newGlucose.customTimestamp 
            ? new Date(newGlucose.customTimestamp) 
            : new Date();
        const timestamp = recordDate.getTime();
        
        // Format display date: YYYY/MM/DD HH:mm or MM/DD HH:mm
        const dateStr = newGlucose.customDateStr || recordDate.toLocaleDateString('zh-HK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(/\//g, '/');

        const record: GlucoseRecord = {
            id: timestamp.toString() + '_' + Math.random().toString(36).substr(2, 4),
            value: isNaN(val) ? '' : val.toFixed(1),
            timeType: newGlucose.timeType as GlucoseRecord['timeType'],
            timestamp: timestamp,
            date: dateStr,
            symptoms: newGlucose.symptoms || [],
            mealTag: newGlucose.mealTag,
            dietNote: newGlucose.dietNote || '',
            exerciseNote: newGlucose.exerciseNote || '',
            illnessNote: newGlucose.illnessNote || '',
            medicationNote: newGlucose.medicationNote || '',
            bpSystolic: newGlucose.bpSystolic || '',
            bpDiastolic: newGlucose.bpDiastolic || '',
            pulse: newGlucose.pulse || '',
            weight: newGlucose.weight || '',
            mood: newGlucose.mood || ''
        };
        setGlucoseRecords([record, ...glucoseRecords].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        setNewGlucose({
            value: '', 
            timeType: '', 
            symptoms: [], 
            mealTag: undefined, 
            dietNote: '', 
            exerciseNote: '', 
            illnessNote: '',
            medicationNote: '',
            bpSystolic: '',
            bpDiastolic: '',
            pulse: '',
            weight: '',
            mood: '',
            customTimestamp: undefined,
            customDateStr: undefined
        });
    };

    // 添加 HbA1c 記錄
    const addHbA1cRecord = () => {
        const val = parseFloat(newHbA1c.value);
        if (isNaN(val)) return;
        const record: HbA1cRecord = {
            id: new Date().getTime().toString(),
            value: val.toFixed(1),
            date: newHbA1c.date,
            timestamp: new Date(newHbA1c.date).getTime()
        };
        setHba1cRecords([record, ...hba1cRecords].sort((a, b) => b.timestamp - a.timestamp));
        setNewHbA1c({...newHbA1c, value: ''});
    };

    // 生成并下載問診筆記

    return {
        glucoseRecords, setGlucoseRecords,
        newGlucose, setNewGlucose,
        hba1cRecords, setHba1cRecords,
        newHbA1c, setNewHbA1c,
        addGlucoseRecord,
        addHbA1cRecord,
    };
}
