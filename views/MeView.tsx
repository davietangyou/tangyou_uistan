/**
 * src/views/MeView.tsx
 *
 * 個人設定與健康檔案視圖組件
 *
 * 設計原則：
 * 1. 一體化即時查看與直接編輯（所見即所得）：無需在「概覽」與「修改」之間來回切換。
 * 2. 清晰的板塊分區：
 *    - 👤 基本資料與身體指標（姓名、年齡、性別、身高、體重與動態 BMI）
 *    - 🍬 糖尿病診斷與用藥（類型、病齡、胰島素、用藥清單、📷 拍照識藥）
 *    - 📁 其他長期慢性狀況（共病多選 +「其他」自訂手動輸入）
 *    - 👨‍👩‍👧 家庭照顧與居住環境
 *    - 🥦 生活飲食與每週運動（ADA 標準運動量計算）
 * 3. 長者友善：大字體適配、清晰對比、大點擊熱區。
 */

import React, { useState, useRef } from 'react';
import { UserProfile, View, DiabetesType } from '../utils/types';
import { COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList, HK_DIABETES_MEDICATIONS, HK_HA_MEDICATION_GROUPS, getBmiEvaluation } from '../utils/constants';
import { recognizeMedicationsFromImage } from '../services/geminiService';

interface MeViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    setView: (view: View) => void;
    isLargeFont?: boolean;
    [key: string]: any;
}

export const MeView: React.FC<MeViewProps> = ({ profile, setProfile, setView, isLargeFont = false }) => {
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
    const calculateBmi = (height: string, weight: string, unit: 'kg' | 'lb' = 'kg') => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (!isNaN(h) && h > 0 && !isNaN(w) && w > 0) {
            const wKg = unit === 'lb' ? w * 0.45359237 : w;
            return (wKg / Math.pow(h / 100, 2)).toFixed(1);
        }
        return '';
    };

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

    // 運動項目選項 (涵蓋有氧、阻力抗阻、平衡與日常運動 - 無 emoji 純文字)
    const EXERCISE_TYPE_OPTIONS = [
        { id: 'WALK', label: '散步 / 快步走' },
        { id: 'RESISTANCE', label: '深蹲 / 俯臥撐 / 阻力訓練' },
        { id: 'TAICHI', label: '太極 / 八段錦 / 氣功' },
        { id: 'SWIM', label: '游泳 / 水中健體' },
        { id: 'CYCLE', label: '健身單車 / 慢跑' },
        { id: 'STRETCH', label: '晨運拉筋 / 椅子操' },
        { id: 'HIKE', label: '郊遊遠足 / 行山' },
        { id: 'OTHER', label: '其他運動 / 暫無特定項目' }
    ];

    // 根據每週天數、每次分鐘數與運動強度，計算每週累計時數與 ADA 等級
    const calculateExerciseFromHabits = (days: string, mins: string, intensity?: 'LIGHT' | 'MODERATE' | 'VIGOROUS'): { category: 'NONE' | 'UNDER_150' | 'MET_150'; estimatedMins: number } => {
        if (!days || days === '0' || !mins || mins === '0') {
            return { category: 'NONE', estimatedMins: 0 };
        }
        let d = 0;
        if (days === '1-2') d = 1.5;
        else if (days === '3-4') d = 3.5;
        else if (days === '5+') d = 5.5;

        let m = 0;
        if (mins === '15') m = 15;
        else if (mins === '30') m = 30;
        else if (mins === '45') m = 45;
        else if (mins === '60+') m = 60;

        const total = Math.round(d * m);
        if (total === 0) return { category: 'NONE', estimatedMins: 0 };
        
        // 醫學標準：輕度活動(無出汗/無心跳加快)即使時間長，對胰島素抗性改善亦有限
        if (intensity === 'LIGHT') {
            return { category: 'UNDER_150', estimatedMins: total };
        }

        if (total >= 150) return { category: 'MET_150', estimatedMins: total };
        return { category: 'UNDER_150', estimatedMins: total };
    };

    const hasOtherCondition = (profile.conditions || []).includes('OT');

    return (
        <div className={`space-y-6 animate-soft pb-24 ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            
            {/* 頂部標題 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                    <h2 className={`font-black text-slate-900 tracking-tight flex items-center gap-2 ${isLargeFont ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>
                        <span>👤</span>
                        <span>個人檔案</span>
                    </h2>
                    <p className={`text-slate-500 font-bold ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                        隨時查看與直接修改您的健康資料，所有變更即時保存，為 AI 提供準確的分析基礎。
                    </p>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. 個人信息卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>👤</span>
                        <span>【個人信息】</span>
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">直接點擊即可修改</span>
                </div>

                {/* 姓名稱呼 */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">姓名 / 點樣稱呼您？</label>
                    <input
                        type="text"
                        placeholder="例如：陳生、張太"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none transition-all font-bold text-sm text-slate-800"
                        value={profile.name || ''}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                    />
                </div>

                {/* 年齡、性別、身高、體重 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">年齡 (歲)</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder="例如: 68"
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                            value={profile.age || ''}
                            onChange={e => setProfile({ ...profile, age: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">性別</label>
                        <select
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                            value={profile.gender || '男'}
                            onChange={e => setProfile({ ...profile, gender: e.target.value })}
                        >
                            <option value="男">男</option>
                            <option value="女">女</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">身高 (cm)</label>
                        <input
                            type="number"
                            placeholder="例如: 165"
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                            value={profile.height || ''}
                            onChange={e => handleHeightChange(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">體重</label>
                            <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                                {[
                                    { unit: 'kg', label: '公斤 (kg)' },
                                    { unit: 'lb', label: '磅 (lb)' }
                                ].map(({ unit, label }) => (
                                    <button
                                        key={unit}
                                        type="button"
                                        onClick={() => handleWeightUnitChange(unit as 'kg' | 'lb')}
                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                            (profile.weightUnit || 'kg') === unit
                                                ? 'bg-[#4A6E85] text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <input
                            type="number"
                            placeholder={profile.weightUnit === 'lb' ? '例如: 132 磅' : '例如: 60 公斤'}
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                            value={profile.weight || ''}
                            onChange={e => handleWeightChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* 即時 BMI 指數與標尺視覺條 (智能適配長者糖友 vs 成人標準) */}
                {profile.bmi && (() => {
                    const evalResult = getBmiEvaluation(profile.bmi, profile.age);
                    if (!evalResult) return null;

                    const bmiValue = parseFloat(profile.bmi || '0');
                    const minBmi = evalResult.isElderly ? 16 : 15;
                    const maxBmi = evalResult.isElderly ? 34 : 30;
                    const percentage = ((bmiValue - minBmi) / (maxBmi - minBmi)) * 100;
                    const bmiPosition = Math.min(Math.max(percentage, 2), 98);

                    return (
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-700">⚖️ BMI 指數：</span>
                                    <span className="text-base font-black text-slate-800">{profile.bmi}</span>
                                    {evalResult.isElderly ? (
                                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            👴 長者糖友指引 (≥65歲)
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            (👤 香港華人成人標準)
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full self-start sm:self-auto ${evalResult.badgeBg}`}>
                                    {evalResult.category}
                                </span>
                            </div>

                            {/* 標尺指標 */}
                            <div className="relative pt-2 pb-0.5">
                                {bmiValue > 0 && (
                                    <div 
                                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10"
                                        style={{ left: `${bmiPosition}%` }}
                                    >
                                        <div className="w-2 h-2 bg-[#4A6E85] rounded-full shadow-sm"></div>
                                        <div className="w-1 h-2 bg-[#4A6E85] shadow-xs"></div>
                                    </div>
                                )}
                                {evalResult.isElderly ? (
                                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-200">
                                        <div style={{ width: '22%' }} title="偏輕 (<20.0)" className="bg-sky-300 border-r border-white"></div>
                                        <div style={{ width: '39%' }} title="長者黃金保護區 (20.0-26.9)" className="bg-emerald-400 border-r border-white"></div>
                                        <div style={{ width: '17%' }} title="微重 (27.0-29.9)" className="bg-amber-400 border-r border-white"></div>
                                        <div style={{ width: '22%' }} title="肥胖 (≥30.0)" className="bg-rose-400"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-200">
                                        <div style={{ width: '23.3%' }} title="過輕 (<18.5)" className="bg-sky-300 border-r border-white"></div>
                                        <div style={{ width: '29.3%' }} title="適中 (18.5-22.9)" className="bg-emerald-400 border-r border-white"></div>
                                        <div style={{ width: '13.3%' }} title="過重 (23.0-24.9)" className="bg-amber-400 border-r border-white"></div>
                                        <div style={{ width: '34.1%' }} title="肥胖 (≥25.0)" className="bg-rose-400"></div>
                                    </div>
                                )}
                            </div>

                            {/* 指引提示文案 */}
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                                💡 {evalResult.description}
                            </p>
                        </div>
                    );
                })()}
            </div>

            {/* ========================================================================= */}
            {/* 2. 糖尿病相關信息卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>🍬</span>
                        <span>【糖尿病相關信息】</span>
                    </h3>
                </div>

                {/* 糖尿病類型 */}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">糖尿病類型</label>
                    <select
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-sm text-slate-800"
                        value={profile.diabetesType || 'TYPE_2'}
                        onChange={e => setProfile({ ...profile, diabetesType: e.target.value as DiabetesType })}
                    >
                        <option value="TYPE_2">第 2 型糖尿病 (常見糖尿 / Type 2 DM)</option>
                        <option value="TYPE_1">第 1 型糖尿病 (胰島素依賴 / Type 1 DM)</option>
                        <option value="PRE_DIABETES">糖尿病前期 / 血糖警戒線 (Pre-diabetes)</option>
                        <option value="GESTATIONAL">妊娠期糖尿病 (Gestational DM)</option>
                        <option value="OTHER">其他類型 (Other Types)</option>
                    </select>
                </div>

                {/* 胰島素注射狀態 */}
                <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">是否正在注射胰島素：</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setProfile({ ...profile, isInsulinUser: true })}
                            className={`p-2.5 rounded-xl border font-bold text-xs text-center cursor-pointer transition-all ${
                                profile.isInsulinUser 
                                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-black shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            💉 是，正在注射胰島素
                        </button>
                        <button
                            type="button"
                            onClick={() => setProfile({ ...profile, isInsulinUser: false })}
                            className={`p-2.5 rounded-xl border font-bold text-xs text-center cursor-pointer transition-all ${
                                !profile.isInsulinUser 
                                    ? 'bg-[#4A6E85] border-[#4A6E85] text-white font-black shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            💊 否，未注射胰島素
                        </button>
                    </div>
                </div>

                {/* 📷 智能拍照識藥提醒與按鈕區 */}
                <div className="bg-gradient-to-r from-sky-50 to-blue-50/60 p-4 rounded-2xl border border-sky-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            📷
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800">
                                    拍照掃描藥袋 / 藥盒
                                </h4>
                                <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">
                                    AI 自動識別
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-bold leading-relaxed">
                                您可以直接拍照或上傳醫院藥袋、藥盒標籤，AI 會自動為您識別藥物名稱，免去繁瑣打字！
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleMedPhotoUpload}
                        />
                        <button
                            type="button"
                            disabled={isScanningMed}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#4A6E85] hover:bg-[#3d5b6e] text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                        >
                            {isScanningMed ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>AI 正在辨識藥袋上的藥物資訊...</span>
                                </>
                            ) : (
                                <>
                                    <span>📸 拍照 / 上傳藥物照片</span>
                                </>
                            )}
                        </button>
                    </div>

                    {scanFeedback && (
                        <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-soft ${
                            scanFeedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                            <span>{scanFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                            <span>{scanFeedback.message}</span>
                        </div>
                    )}
                </div>

                {/* 現有用藥清單 (同步香港 HA 英文資訊) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            現時服用之糖尿專科藥物清單 (HA Drug Formulary)：
                        </label>
                        <span className="text-[11px] font-bold text-[#4A6E85]">
                            已登記 {profile.medicationDetails?.length || 0} 種藥物
                        </span>
                    </div>
                    
                    {profile.medicationDetails && profile.medicationDetails.length > 0 ? (
                        <div className="space-y-2">
                            {profile.medicationDetails.map((med, idx) => (
                                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                    <div className="min-w-0 flex-grow">
                                        <p className="font-extrabold text-slate-800 truncate flex items-center gap-1.5">
                                            <span>💊</span>
                                            <span className="font-mono text-xs sm:text-sm text-[#3A5D75]">{med.name}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = profile.medicationDetails?.filter((_, i) => i !== idx);
                                            setProfile({ 
                                                ...profile, 
                                                medicationDetails: next,
                                                medications: (next || []).map(m => m.name).join('、')
                                            });
                                        }}
                                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg font-bold shrink-0 transition-colors cursor-pointer"
                                        title="刪除此藥物"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-bold py-2 text-center bg-slate-50 rounded-xl">
                            尚未登記任何糖尿專科藥物，可由下方手動選擇或自訂新增。
                        </p>
                    )}

                    {/* 手動選擇香港常見糖尿專科藥物 (同步香港 HA 醫管局藥物名冊，以英文為主顯示) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="relative">
                            <select
                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold text-xs text-[#4A6E85] outline-none border border-slate-200 hover:border-[#4A6E85]/20 appearance-none cursor-pointer"
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    const medName = e.target.value;
                                    const exists = profile.medicationDetails?.find(m => m.name === medName);
                                    if (!exists) {
                                        const updated = [
                                            ...(profile.medicationDetails || []),
                                            { name: medName, dosage: '', usage: '' }
                                        ];
                                        setProfile({
                                            ...profile,
                                            medicationDetails: updated,
                                            medications: updated.map(m => m.name).join('、')
                                        });
                                    }
                                    e.target.value = '';
                                }}
                            >
                                <option value="">＋ 選擇香港 HA 常見糖尿專科藥物 (英文為主)...</option>
                                {HK_HA_MEDICATION_GROUPS.map(group => (
                                    <optgroup key={group.category} label={group.category}>
                                        {group.meds.map(m => (
                                            <option key={m.name} value={m.name}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>

                        <div className="flex gap-1.5">
                            <input
                                placeholder="或輸入其他藥名 (英文/中文)..."
                                className="flex-1 bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none border border-slate-200 focus:bg-white focus:border-[#4A6E85]"
                                value={customMedName}
                                onChange={(e) => setCustomMedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customMedName.trim()) {
                                        const name = customMedName.trim();
                                        const updated = [
                                            ...(profile.medicationDetails || []),
                                            { name, dosage: '', usage: '' }
                                        ];
                                        setProfile({
                                            ...profile,
                                            medicationDetails: updated,
                                            medications: updated.map(m => m.name).join('、')
                                        });
                                        setCustomMedName('');
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!customMedName.trim()) return;
                                    const name = customMedName.trim();
                                    const updated = [
                                        ...(profile.medicationDetails || []),
                                        { name, dosage: '', usage: '' }
                                    ];
                                    setProfile({
                                        ...profile,
                                        medicationDetails: updated,
                                        medications: updated.map(m => m.name).join('、')
                                    });
                                    setCustomMedName('');
                                }}
                                disabled={!customMedName.trim()}
                                className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                    customMedName.trim()
                                        ? 'bg-[#4A6E85] text-white hover:bg-[#3d5b70] shadow-xs'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                新增
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. 長期慢性狀況與共病卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>📁</span>
                        <span>長期疾病調查（維持最少 6 個月）</span>
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">點擊直接切換與編輯</span>
                </div>

                {/* 1. 沒有長期疾病獨立按鈕 */}
                <div>
                    <button
                        type="button"
                        onClick={() => toggleConditionLocal('NONE')}
                        className={`w-full p-3 rounded-2xl text-center text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            profile.conditions?.includes('NONE')
                                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        <span>🛡️</span>
                        <span>我沒有任何長期疾病（維持最少 6 個月）</span>
                        {profile.conditions?.includes('NONE') && <span>✓</span>}
                    </button>
                </div>

                {/* 2. 常見長期疾病 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                        常見長期疾病：
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {COMMON_CONDITIONS.map(item => {
                            const selected = profile.conditions?.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleConditionLocal(item.id)}
                                    className={`p-2.5 rounded-xl text-left truncate text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-between ${
                                        selected
                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#4A6E85]/20'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {selected && <span className="font-black text-xs">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. 其他長期疾病 */}
                <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                        其他長期疾病：
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {OTHER_CONDITIONS.map(item => {
                            const selected = profile.conditions?.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleConditionLocal(item.id)}
                                    className={`p-2.5 rounded-xl text-left truncate text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-between ${
                                        selected
                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#4A6E85]/20'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {selected && <span className="font-black text-xs">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 當勾選「其他」時，可自訂名稱 */}
                {hasOtherCondition && (
                    <div className="pt-2 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <label className="text-[11px] font-black text-[#4A6E85] block">
                            請輸入其他慢性狀況名稱：
                        </label>
                        <input
                            type="text"
                            placeholder="例如：痛風、前列腺增生、骨質疏鬆等"
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#4A6E85] outline-none font-bold text-xs text-slate-800 transition-all"
                            value={profile.otherConditions || ''}
                            onChange={e => handleUpdateConditionDetail('OT', 'specificName', e.target.value)}
                        />
                    </div>
                )}

                {/* 4. 已選疾病詳細資料編輯列表（病齡與備註詳情） */}
                {(() => {
                    const activeConditions = (profile.conditions || []).filter(c => c !== 'NONE' && c !== 'DM');
                    if (activeConditions.length === 0) return null;

                    return (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                已選疾病詳情（病齡與補充資料）：
                            </span>
                            <div className="space-y-2.5">
                                {activeConditions.map(condId => {
                                    const matchDef = conditionsList.find(c => c.id === condId);
                                    const label = condId === 'OT' && profile.otherConditions
                                        ? `其他（${profile.otherConditions}）`
                                        : matchDef?.label || condId;
                                    const currentDetail = profile.conditionDetails?.[condId] || {};
                                    const currentYears = condId === 'HT' && profile.hypertensionYears
                                        ? profile.hypertensionYears
                                        : currentDetail.years || '';

                                    return (
                                        <div
                                            key={condId}
                                            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-[#4A6E85]"></span>
                                                    {label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleConditionLocal(condId)}
                                                    className="text-slate-400 hover:text-rose-500 text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    ✕ 移除
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {/* 患病多少年 */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 block">
                                                        患病多少年？
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="如 3"
                                                            className="w-full p-2 pr-8 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:border-[#4A6E85]"
                                                            value={currentYears}
                                                            onChange={e => handleUpdateConditionDetail(condId, 'years', e.target.value)}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">年</span>
                                                    </div>
                                                </div>

                                                {/* 詳情（如有） */}
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-400 block">
                                                        詳情（如有）
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="例如：服藥控制中、定期專科覆診等"
                                                        className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:border-[#4A6E85]"
                                                        value={currentDetail.specificName || ''}
                                                        onChange={e => handleUpdateConditionDetail(condId, 'specificName', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ========================================================================= */}
            {/* 4. 家庭照顧支持卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>👨‍👩‍👧</span>
                        <span>【家庭照顧支持】</span>
                    </h3>
                </div>

                {/* 家庭照顧支持 */}
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">家庭照顧支持：</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setProfile({
                                    ...profile,
                                    hasCaregiverSupport: true,
                                    hasNoCaregiverSupport: false
                                });
                            }}
                            className={`p-3 rounded-2xl border font-bold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                profile.hasCaregiverSupport 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black' 
                                    : 'bg-slate-50 border-slate-200/70 text-slate-500 hover:bg-slate-100/50'
                            }`}
                        >
                            <span>👨‍👩‍👧</span>
                            <span>有家人或照顧者日常協助</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setProfile({
                                    ...profile,
                                    hasNoCaregiverSupport: true,
                                    hasCaregiverSupport: false
                                });
                            }}
                            className={`p-3 rounded-2xl border font-bold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                profile.hasNoCaregiverSupport 
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 font-black' 
                                    : 'bg-slate-50 border-slate-200/70 text-slate-500 hover:bg-slate-100/50'
                            }`}
                        >
                            <span>🏠</span>
                            <span>我獨自一人照顧自己</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. 生活飲食與每週運動卡片 */}
            {/* ========================================================================= */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className={`font-black text-[#4A6E85] flex items-center gap-1.5 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                        <span>🥦</span>
                        <span>飲食與運動</span>
                    </h3>
                </div>

                {/* 飲食習慣多選 */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">日常飲食習慣 (可多選)：</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { id: 'OUTSIDE_EATING', title: '經常出街食飯 (外食為主)' },
                            { id: 'REFINED_CARB', title: '主食偏好精製澱粉 (如白飯、麵包、河粉、粥)' },
                            { id: 'SUGARY_DRINK', title: '習慣飲含糖飲品 (如奶茶、凍檸茶、汽水)' },
                            { id: 'MIDNIGHT_SNACK', title: '有食宵夜或睡前點心習慣' },
                            { id: 'HOME_COOK', title: '飲食定時定量，家中自煮為主' }
                        ].map(opt => {
                            const isSelected = (profile.dietHabits || []).includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        let current = [...(profile.dietHabits || [])];
                                        if (current.includes(opt.id)) {
                                            current = current.filter(x => x !== opt.id);
                                        } else {
                                            current.push(opt.id);
                                        }
                                        setProfile({ ...profile, dietHabits: current });
                                    }}
                                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isSelected
                                            ? 'bg-[#4A6E85]/10 border-[#4A6E85] text-[#4A6E85]'
                                            : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100/80'
                                    }`}
                                >
                                    <div className={`text-xs font-black min-w-0 ${isSelected ? 'text-[#4A6E85]' : 'text-slate-800'}`}>
                                        {opt.title}
                                    </div>
                                    <span className={`text-sm font-black shrink-0 ${isSelected ? 'text-[#4A6E85]' : 'text-slate-300'}`}>
                                        {isSelected ? '✓' : '○'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 平時喜歡的食物 (自定義輸入) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        平時喜歡的食物 (選填)：
                    </label>
                    <input
                        type="text"
                        placeholder="例如: 叉燒飯、雲吞麵、芒果、奶茶、蒸魚、蛋撻等"
                        value={profile.favoriteFoods || ''}
                        onChange={e => setProfile({ ...profile, favoriteFoods: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4A6E85] outline-none font-black text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all"
                    />
                </div>

                {/* 每週運動量計算器 (ADA 150 分鐘標準) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            每週運動習慣 (參考 ADA 國際糖尿病標準)：
                        </label>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            profile.exerciseWeekly === 'MET_150' ? 'bg-emerald-100 text-emerald-800' :
                            profile.exerciseWeekly === 'UNDER_150' ? 'bg-amber-100 text-amber-800' :
                            profile.exerciseWeekly === 'NONE' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                            {profile.exerciseWeekly === 'MET_150' ? '🏆 達標 (≥150分/週)' : 
                             profile.exerciseWeekly === 'UNDER_150' ? '🚶 不足 (<150分/週)' : 
                             profile.exerciseWeekly === 'NONE' ? '🪑 幾乎無運動' : '未設定'}
                        </span>
                    </div>

                    {/* 運動習慣計算器：每週幾天 + 每次多久 + 運動強度確認 */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>1️⃣ 每週大約運動幾多日？</span>
                                <span className="text-[#4A6E85] font-black">
                                    {profile.exerciseDaysPerWeek ? `每週 ${profile.exerciseDaysPerWeek} 日` : '請選擇'}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                    { id: '0', label: '0 日' },
                                    { id: '1-2', label: '1-2 日' },
                                    { id: '3-4', label: '3-4 日' },
                                    { id: '5+', label: '5 日以上' }
                                ].map(item => {
                                    const isSel = profile.exerciseDaysPerWeek === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                const nextDays = item.id;
                                                const nextMins = profile.exerciseMinutesPerSession || (item.id === '0' ? '0' : '30');
                                                const nextIntensity = profile.exerciseIntensity || 'MODERATE';
                                                const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                                setProfile({
                                                    ...profile,
                                                    exerciseDaysPerWeek: nextDays,
                                                    exerciseMinutesPerSession: nextDays === '0' ? '0' : nextMins,
                                                    exerciseIntensity: nextDays === '0' ? undefined : nextIntensity,
                                                    exerciseWeekly: category
                                                });
                                            }}
                                            className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                                                isSel
                                                    ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="text-xs font-black">{item.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {profile.exerciseDaysPerWeek && profile.exerciseDaysPerWeek !== '0' && (
                            <>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                        <span>2️⃣ 每次運動大約持續幾耐？</span>
                                        <span className="text-[#4A6E85] font-black">
                                            {profile.exerciseMinutesPerSession ? `每次約 ${profile.exerciseMinutesPerSession} 分鐘` : '請選擇'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { id: '15', label: '< 20 分鐘' },
                                            { id: '30', label: '約 30 分鐘' },
                                            { id: '45', label: '約 45 分鐘' },
                                            { id: '60+', label: '60 分鐘+' }
                                        ].map(item => {
                                            const isSel = profile.exerciseMinutesPerSession === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const nextDays = profile.exerciseDaysPerWeek || '3-4';
                                                        const nextMins = item.id;
                                                        const nextIntensity = profile.exerciseIntensity || 'MODERATE';
                                                        const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                                        setProfile({
                                                            ...profile,
                                                            exerciseDaysPerWeek: nextDays,
                                                            exerciseMinutesPerSession: nextMins,
                                                            exerciseWeekly: category
                                                        });
                                                    }}
                                                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                                                        isSel
                                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs font-black">{item.label}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                        <span>3️⃣ 運動時的自覺強度？</span>
                                        <span className="text-[#4A6E85] font-black">
                                            {profile.exerciseIntensity === 'MODERATE' ? '中等' :
                                             profile.exerciseIntensity === 'LIGHT' ? '輕度' :
                                             profile.exerciseIntensity === 'VIGOROUS' ? '高強度' : '建議選擇'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            { 
                                                id: 'LIGHT', 
                                                title: '輕度'
                                            },
                                            { 
                                                id: 'MODERATE', 
                                                title: '中等'
                                            },
                                            { 
                                                id: 'VIGOROUS', 
                                                title: '高強度'
                                            }
                                        ].map(item => {
                                            const isSel = (profile.exerciseIntensity || 'MODERATE') === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const nextIntensity = item.id as 'LIGHT' | 'MODERATE' | 'VIGOROUS';
                                                        const nextDays = profile.exerciseDaysPerWeek || '3-4';
                                                        const nextMins = profile.exerciseMinutesPerSession || '30';
                                                        const { category } = calculateExerciseFromHabits(nextDays, nextMins, nextIntensity);
                                                        setProfile({
                                                            ...profile,
                                                            exerciseIntensity: nextIntensity,
                                                            exerciseWeekly: category
                                                        });
                                                    }}
                                                    className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                                                        isSel
                                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span className="text-xs font-black">{item.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* 💡 中等強度運動實例導引 (精簡清晰版) */}
                                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2 mt-2">
                                        <div className="text-xs font-black text-[#4A6E85] flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                                            <span>💡</span>
                                            <span>常見中等強度運動實例：</span>
                                        </div>

                                        <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                                            <div>
                                                <span className="font-black text-slate-700">【有氧運動】</span>
                                                快步走、太極拳 / 八段錦、單車 / 慢跑、游泳 / 水中健步、活力操、家務（拖地/擦窗）
                                            </div>
                                            <div>
                                                <span className="font-black text-emerald-800">【抗阻力肌力】</span>
                                                深蹲 / 靠椅坐站、靠牆俯臥撐、站立提踵（踮腳尖）、彈力帶 / 啞鈴訓練
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 常做運動類型 (可多選) */}
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                平時常做的運動類型 (可多選)：
                            </label>
                            <span className="text-[10px] text-slate-400 font-bold">
                                {(profile.exerciseTypes || []).length > 0 ? `已選 ${(profile.exerciseTypes || []).length} 項` : '選填'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {EXERCISE_TYPE_OPTIONS.map(item => {
                                const isSelected = (profile.exerciseTypes || []).includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            let current = [...(profile.exerciseTypes || [])];
                                            if (current.includes(item.id)) {
                                                current = current.filter(x => x !== item.id);
                                            } else {
                                                current.push(item.id);
                                            }
                                            setProfile({ ...profile, exerciseTypes: current });
                                        }}
                                        className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            isSelected
                                                ? 'bg-[#4A6E85]/10 border-[#4A6E85] text-[#4A6E85]'
                                                : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100/80'
                                        }`}
                                    >
                                        <div className="font-black text-xs min-w-0 truncate">
                                            {item.label}
                                        </div>
                                        <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-[#4A6E85]' : 'text-slate-300'}`}>
                                            {isSelected ? '✓' : '○'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 自定義其他運動項目輸入框 */}
                        {(profile.exerciseTypes || []).includes('OTHER') && (
                            <div className="pt-1">
                                <input
                                    type="text"
                                    placeholder="請輸入其他常做的運動項目（例如：乒乓球、廣場舞、跳繩、家務拖地等）"
                                    value={profile.exerciseTypesOther || ''}
                                    onChange={e => setProfile({ ...profile, exerciseTypesOther: e.target.value })}
                                    className="w-full p-2.5 rounded-xl bg-white border border-[#4A6E85]/40 focus:border-[#4A6E85] outline-none font-black text-xs text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all shadow-xs"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 保存修改按鈕 */}
            {/* ========================================================================= */}
            <div className="pt-2 space-y-3">
                <button
                    onClick={() => {
                        localStorage.setItem('dia_profile', JSON.stringify(profile));
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 2500);
                    }}
                    className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                        saveSuccess
                            ? 'bg-emerald-600 text-white shadow-emerald-200'
                            : 'bg-[#4A6E85] hover:bg-[#3d5b6e] text-white shadow-[#4A6E85]/20 active:scale-[0.99]'
                    }`}
                >
                    <span>{saveSuccess ? '✓ 已成功保存修改' : '💾 保存修改'}</span>
                </button>

                {saveSuccess && (
                    <div className="text-center text-xs font-bold text-emerald-600 animate-fade-in">
                        個人檔案已成功更新並同步至 AI 諮詢系統！
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 系統資料重置按鈕 */}
            {/* ========================================================================= */}
            <div className="text-center pt-4">
                <button
                    onClick={() => {
                        if (confirm('確定要清除所有紀錄嗎？所有個人設定、數據與對話紀錄將無法恢復。')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="text-slate-400 hover:text-rose-500 text-xs font-bold transition-all border-b border-dashed border-slate-300 hover:border-rose-400 pb-0.5 cursor-pointer"
                >
                    ⚠️ 重置系統所有資料
                </button>
            </div>

        </div>
    );
};
