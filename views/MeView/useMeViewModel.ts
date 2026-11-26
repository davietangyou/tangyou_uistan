import {useRef, useState} from 'react';
import type {UserProfile} from '../../utils/types';
import type {MeViewProps} from './types';
import {recognizeMedicationsFromImage} from '../../services/geminiService';
import {calculateBmi, calculateExerciseFromHabits} from './helpers';

export function useMeViewModel({ profile, setProfile, setView, isLargeFont = false }: MeViewProps) {
    // 自訂藥物輸入狀態
    const [customMedName, setCustomMedName] = useState<string>('');
    // 保存成功提示狀態
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    // 拍照辨識藥物狀態
    const [isScanningMed, setIsScanningMed] = useState<boolean>(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // 處理藥物照片上傳辨識
    const handleMedPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanningMed(true);
        setScanFeedback(null);

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Data = reader.result as string;
                    const result = await recognizeMedicationsFromImage(base64Data, file.type || 'image/jpeg');
                    
                    if (result && result.medications && result.medications.length > 0) {
                        const existing = profile.medicationDetails || [];
                        const newMeds = [...existing];

                        result.medications.forEach(m => {
                            const trimmedName = m.name.trim();
                            if (!trimmedName) return;
                            const idx = newMeds.findIndex(existingMed => 
                                existingMed.name.toLowerCase() === trimmedName.toLowerCase()
                            );
                            if (idx >= 0) {
                                // 更新現有劑量或用法
                                newMeds[idx] = {
                                    ...newMeds[idx],
                                    dosage: m.dosage || newMeds[idx].dosage || '',
                                    usage: m.usage || newMeds[idx].usage || ''
                                };
                            } else {
                                newMeds.push({
                                    name: trimmedName,
                                    dosage: m.dosage || '',
                                    usage: m.usage || ''
                                });
                            }
                        });

                        setProfile({
                            ...profile,
                            medicationDetails: newMeds,
                            medications: newMeds.map(m => m.name).join('、')
                        });

                        setScanFeedback({
                            type: 'success',
                            message: `已成功辨識並添加 ${result.medications.length} 種藥物：${result.medications.map(m => m.name).join('、')}`
                        });
                    } else {
                        setScanFeedback({
                            type: 'error',
                            message: '未能從相片中清晰辨識出藥名，請嘗試拍攝清晰的藥袋標籤或手動輸入。'
                        });
                    }
                } catch (err: any) {
                    console.error('Med photo scan error:', err);
                    setScanFeedback({
                        type: 'error',
                        message: '辨識時發生錯誤，請確保相片清晰或手動新增藥物。'
                    });
                } finally {
                    setIsScanningMed(false);
                    // 清空 input 讓同張照片可重複觸發
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File read error:', error);
            setIsScanningMed(false);
            setScanFeedback({
                type: 'error',
                message: '讀取相片失敗，請重試。'
            });
        }
    };

    // 計算 BMI

    const handleHeightChange = (val: string) => {
        const nextBmi = calculateBmi(val, profile.weight || '', profile.weightUnit || 'kg');
        setProfile({
            ...profile,
            height: val,
            bmi: nextBmi
        });
    };

    const handleWeightChange = (val: string) => {
        const nextBmi = calculateBmi(profile.height || '', val, profile.weightUnit || 'kg');
        setProfile({
            ...profile,
            weight: val,
            bmi: nextBmi
        });
    };

    const handleWeightUnitChange = (unit: 'kg' | 'lb') => {
        const nextBmi = calculateBmi(profile.height || '', profile.weight || '', unit);
        setProfile({
            ...profile,
            weightUnit: unit,
            bmi: nextBmi
        });
    };

    const handleUpdateConditionDetail = (conditionId: string, field: 'years' | 'specificName', value: string) => {
        const prevDetails = profile.conditionDetails || {};
        const currentDetail = prevDetails[conditionId] || {};
        const nextDetails = {
            ...prevDetails,
            [conditionId]: {
                ...currentDetail,
                [field]: value
            }
        };

        const updates: Partial<UserProfile> = { conditionDetails: nextDetails };
        if (conditionId === 'DM' && field === 'years') {
            updates.yearsWithDiabetes = value;
        }
        if (conditionId === 'HT' && field === 'years') {
            updates.hypertensionYears = value;
        }
        if (conditionId === 'OT' && field === 'specificName') {
            updates.otherConditions = value;
        }

        setProfile({
            ...profile,
            ...updates
        });
    };

    const toggleConditionLocal = (id: string) => {
        let current = [...(profile.conditions || [])];
        if (id === 'NONE') {
            current = ['NONE'];
        } else {
            current = current.filter(c => c !== 'NONE');
            if (current.includes(id)) {
                current = current.filter(c => c !== id);
            } else {
                current.push(id);
            }
        }
        setProfile({ ...profile, conditions: current });
    };

    const hasOtherCondition = (profile.conditions || []).includes('OT');

    return {
        profile,
        setProfile,
        setView,
        isLargeFont,
        customMedName,
        setCustomMedName,
        saveSuccess,
        setSaveSuccess,
        isScanningMed,
        setIsScanningMed,
        scanFeedback,
        setScanFeedback,
        fileInputRef,
        handleMedPhotoUpload,
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
        handleUpdateConditionDetail,
        toggleConditionLocal,
        hasOtherCondition,
        calculateBmi,
        calculateExerciseFromHabits
    };
}

export type MeViewModel = ReturnType<typeof useMeViewModel>;
