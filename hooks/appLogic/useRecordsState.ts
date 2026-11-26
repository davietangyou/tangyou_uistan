import {useEffect, useState} from 'react';
import type {GlucoseRecord, HbA1cRecord} from '../../utils/types';
import {
    emptyGlucoseDraft,
    loadGlucoseRecords,
    persistGlucoseRecords,
    sortGlucoseRecords,
    buildGlucoseRecord,
    loadHbA1cRecords,
    persistHbA1cRecords,
    sortHbA1cRecords,
    buildHbA1cRecord,
} from '../../domain';
import type {NewGlucoseDraft} from '../../domain';

export function useRecordsState() {
    const [glucoseRecords, setGlucoseRecords] = useState<GlucoseRecord[]>(() => loadGlucoseRecords());

    const [hba1cRecords, setHba1cRecords] = useState<HbA1cRecord[]>(() => loadHbA1cRecords());

    const [newGlucose, setNewGlucose] = useState<NewGlucoseDraft>(emptyGlucoseDraft());
    const [newHbA1c, setNewHbA1c] = useState({value: '', date: new Date().toISOString().split('T')[0]});

    useEffect(() => persistGlucoseRecords(glucoseRecords), [glucoseRecords]);
    useEffect(() => persistHbA1cRecords(hba1cRecords), [hba1cRecords]);

    // 添加血糖或症狀記錄
    const addGlucoseRecord = () => {
        const built = buildGlucoseRecord(newGlucose);
        if (built.ok === false) {
            if (built.reason === 'missing-time-type') {
                alert('請先選擇「測量時間點」噢！');
            }
            return;
        }
        setGlucoseRecords(sortGlucoseRecords([built.record, ...glucoseRecords]));
        setNewGlucose(emptyGlucoseDraft());
    };

    // 添加 HbA1c 記錄
    const addHbA1cRecord = () => {
        const record = buildHbA1cRecord(newHbA1c.value, newHbA1c.date);
        if (!record) return;
        setHba1cRecords(sortHbA1cRecords([record, ...hba1cRecords]));
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
