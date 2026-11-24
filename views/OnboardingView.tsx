import React from 'react';
import {UserProfile, View, DiabetesType} from '../utils/types';
import {COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList, getBmiEvaluation} from '../utils/constants';

interface OnboardingViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    onboardingStep: number;
    setOnboardingStep: (step: number) => void;
    setView: (view: View) => void;
    toggleCondition: (conditionId: string) => void;
    isLargeFont?: boolean;

    // 允許傳入其他來自 useAppLogic 的 props
    [key: string]: any;
}

export const OnboardingView: React.FC<OnboardingViewProps> = (props) => {
    const {
        profile,
        setProfile,
        onboardingStep,
        setOnboardingStep,
        setView,
        toggleCondition,
        isLargeFont
    } = props;

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
        const nextHeight = val;
        const nextBmi = calculateBmi(nextHeight, profile.weight || '', profile.weightUnit || 'kg');
        setProfile({
            ...profile,
            height: nextHeight,
            bmi: nextBmi
        });
    };

    const handleWeightChange = (val: string) => {
        const nextWeight = val;
        const nextBmi = calculateBmi(profile.height || '', nextWeight, profile.weightUnit || 'kg');
        setProfile({
            ...profile,
            weight: nextWeight,
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

    // 已選疾病列表（排除 'NONE'）
    const selectedConditions = (profile.conditions || []).filter(c => c !== 'NONE');
    const isNoneSelected = (profile.conditions || []).includes('NONE');
    const isDiabetesSelected = selectedConditions.includes('DM');
    const nonDiabetesSelected = selectedConditions.filter(c => c !== 'DM');

    return (
        <div className="min-h-[85vh] flex flex-col justify-center space-y-8 animate-soft pb-20 max-w-2xl mx-auto px-2">
            {/* 頂部歡迎區 */}
            <div className="text-center space-y-3 pt-4">
                <div className="inline-block w-20 h-20 bg-[#E8DED2]/40 rounded-3xl text-4xl flex items-center justify-center mb-2 shadow-inner">
                    👋
                </div>
                <h2 className={`font-black text-slate-900 tracking-tight ${isLargeFont ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
                    歡迎來到「糖友導航」
                </h2>
                <p className={`text-slate-500 font-bold leading-relaxed ${isLargeFont ? 'text-lg' : 'text-sm sm:text-base'}`}>
                    首次使用只需填寫基本資料與長期疾病，即可量身打造個人化健康指引。
                </p>
            </div>

            {/* 主要卡片區域 */}
            <div className="premium-card p-6 sm:p-10 bg-white shadow-xl shadow-[#4A6E85]/5 border border-slate-100/80 rounded-3xl relative">
                {/* 步驟指示器 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#4A6E85] text-white font-black text-sm flex items-center justify-center">
                            {onboardingStep}
                        </span>
                        <span className="font-black text-slate-700 text-base sm:text-lg">
                            {onboardingStep === 1 ? '第 1 步：基本資料與身材指標' : '第 2 步：長期疾病調查與詳情'}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        共 2 步
                    </span>
                </div>

                {/* ===================== STEP 1: 如何稱呼您、年齡、性別、身高、體重、BMI ===================== */}
                {onboardingStep === 1 ? (
                    <div className="space-y-6 animate-soft">
                        {/* 1. 如何稱呼您 */}
                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-black text-[#4A6E85] uppercase tracking-wider block px-1">
                                如何稱呼您？
                            </label>
                            <input
                                type="text"
                                placeholder="例如：陳生、張太、Uncle John"
                                className="w-full p-4 sm:p-5 text-xl sm:text-2xl font-black bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#4A6E85]/30 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-800"
                                value={profile.name || ''}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                            />
                        </div>

                        {/* 2. 年齡 & 3. 性別 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between px-1">
                                    <label className="text-xs sm:text-sm font-black text-[#4A6E85] uppercase tracking-wider block">
                                        年齡 <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-bold">（會自動隨著使用更新）</span>
                                </div>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="例如：68"
                                    className="w-full p-4 sm:p-5 text-xl sm:text-2xl font-black bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#4A6E85]/30 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-800"
                                    value={profile.age || ''}
                                    onChange={e => setProfile({...profile, age: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-black text-[#4A6E85] uppercase tracking-wider block px-1">
                                    性別 <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['男', '女', '其他'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setProfile({...profile, gender: g})}
                                            className={`p-4 rounded-2xl text-lg sm:text-xl font-black transition-all border-2 flex items-center justify-center cursor-pointer ${
                                                profile.gender === g
                                                    ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-md scale-102'
                                                    : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. 身高、5. 體重、6. BMI 自動生成 */}
                        <div className="space-y-4 p-5 sm:p-6 bg-slate-50/80 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="flex items-center justify-between">
                                <label className="text-xs sm:text-sm font-black text-[#4A6E85] uppercase tracking-wider block">
                                    ⚖️ 身材指標與 BMI 自動計算
                                </label>
                                <span className="text-[11px] font-bold text-slate-400">填寫身高體重即刻自動算出</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* 身高 */}
                                <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-black text-slate-400 block">身高 (cm)</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="如 165"
                                        className="w-full p-2 text-xl font-black bg-transparent border-none focus:outline-none placeholder:text-slate-300 text-slate-800"
                                        value={profile.height || ''}
                                        onChange={e => handleHeightChange(e.target.value)}
                                    />
                                </div>

                                {/* 體重與單位 */}
                                <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-400">體重</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                            {(['kg', 'lb'] as const).map(u => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => handleWeightUnitChange(u)}
                                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                                        (profile.weightUnit || 'kg') === u
                                                            ? 'bg-[#4A6E85] text-white shadow-xs'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {u === 'kg' ? '公斤' : '磅'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder={profile.weightUnit === 'lb' ? '如 132' : '如 60'}
                                        className="w-full p-2 text-xl font-black bg-transparent border-none focus:outline-none placeholder:text-slate-300 text-slate-800"
                                        value={profile.weight || ''}
                                        onChange={e => handleWeightChange(e.target.value)}
                                    />
                                </div>

                                {/* BMI 自動生成 */}
                                <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#4A6E85]/20 bg-[#4A6E85]/5 flex flex-col justify-between">
                                    <span className="text-xs font-black text-[#4A6E85] block">BMI (自動生成)</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-[#4A6E85]">
                                            {profile.bmi || '--'}
                                        </span>
                                        {profile.bmi && (
                                            <span className="text-[10px] text-slate-400 font-bold">kg/m²</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BMI 指標提示條 (依年齡自動適配：一般成人 vs 長者糖友指引) */}
                            {profile.bmi && (() => {
                                const evalResult = getBmiEvaluation(profile.bmi, profile.age);
                                if (!evalResult) return null;

                                return (
                                    <div className="space-y-2.5 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 animate-soft">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-slate-700">BMI 評估：</span>
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    {evalResult.isElderly ? '👴 參考長者糖友專屬指引' : '👤 參考香港華人成人標準'}
                                                </span>
                                            </div>
                                            <span className={`font-black text-xs px-2.5 py-0.5 rounded-full self-start sm:self-auto ${evalResult.badgeBg}`}>
                                                {evalResult.category}
                                            </span>
                                        </div>

                                        {/* 視覺進度條 */}
                                        {evalResult.isElderly ? (
                                            <div className="space-y-1">
                                                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100">
                                                    <div style={{ width: '25%' }} title="偏輕 (<20.0)" className="bg-sky-300 border-r border-white"></div>
                                                    <div style={{ width: '45%' }} title="長者黃金保護區間 (20.0-26.9)" className="bg-emerald-400 border-r border-white"></div>
                                                    <div style={{ width: '15%' }} title="長者微重 (27.0-29.9)" className="bg-amber-400 border-r border-white"></div>
                                                    <div style={{ width: '15%' }} title="長者肥胖 (≥30.0)" className="bg-rose-400"></div>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 px-0.5">
                                                    <span>&lt; 20 偏輕</span>
                                                    <span className="text-emerald-600 font-black">20.0 - 26.9 長者保護區</span>
                                                    <span>27-29.9 微重</span>
                                                    <span>≥ 30 肥胖</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100">
                                                    <div style={{ width: '23%' }} title="過輕 (<18.5)" className="bg-sky-300 border-r border-white"></div>
                                                    <div style={{ width: '30%' }} title="適中 (18.5-22.9)" className="bg-emerald-400 border-r border-white"></div>
                                                    <div style={{ width: '17%' }} title="過重 (23.0-24.9)" className="bg-amber-400 border-r border-white"></div>
                                                    <div style={{ width: '30%' }} title="肥胖 (≥25.0)" className="bg-rose-400"></div>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 px-0.5">
                                                    <span>&lt; 18.5 過輕</span>
                                                    <span className="text-emerald-600 font-black">18.5 - 22.9 理想</span>
                                                    <span>23 - 24.9 過重</span>
                                                    <span>≥ 25 肥胖</span>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            💡 {evalResult.description}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* 下一步按鈕 */}
                        <div className="pt-2">
                            <button
                                disabled={!profile.age || !profile.gender}
                                onClick={() => setOnboardingStep(2)}
                                className="w-full bg-[#4A6E85] hover:bg-[#3A5D75] text-white py-5 rounded-2xl text-xl font-black shadow-lg shadow-[#4A6E85]/20 disabled:opacity-30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>下一步：長期疾病狀況</span>
                                <span>➔</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ===================== STEP 2: 長期疾病問卷與詳情 ===================== */
                    <div className="space-y-6 animate-soft">
                        {/* 1. 長期疾病選擇 */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-base sm:text-lg font-black text-slate-800 block px-1 leading-snug">
                                    你有沒有下列項目中的一項或多於一項長期疾病，維持最少 6 個月的時間？
                                </label>
                                <p className="text-xs text-slate-400 font-bold px-1 mt-1">
                                    點選符合您的項目（可多選），如無請選擇「沒有長期疾病」。
                                </p>
                            </div>

                            {/* 沒有長期疾病選項 */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => toggleCondition('NONE')}
                                    className={`w-full p-4 rounded-2xl text-sm sm:text-base font-black border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                        isNoneSelected
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-101'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{isNoneSelected ? '✓ ' : ''}【沒有長期疾病】</span>
                                </button>
                            </div>

                            {/* 常見長期疾病 分組 */}
                            <div className="space-y-2 pt-1">
                                <span className="text-xs font-black text-[#4A6E85] uppercase tracking-wider block px-1">
                                    【常見長期疾病】
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {COMMON_CONDITIONS.map(item => {
                                        const isSelected = profile.conditions?.includes(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleCondition(item.id)}
                                                className={`p-3.5 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer text-center ${
                                                    isSelected
                                                        ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-sm scale-102'
                                                        : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                {isSelected ? '✓ ' : ''}{item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 其他長期疾病 分組 */}
                            <div className="space-y-2 pt-1">
                                <span className="text-xs font-black text-[#4A6E85] uppercase tracking-wider block px-1">
                                    【其他長期疾病】
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {OTHER_CONDITIONS.map(item => {
                                        const isSelected = profile.conditions?.includes(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleCondition(item.id)}
                                                className={`p-3.5 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer text-center ${
                                                    isSelected
                                                        ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-sm scale-102'
                                                        : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                {isSelected ? '✓ ' : ''}{item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 若選了「其他 (OT)」，提供自訂疾病輸入框 */}
                            {profile.conditions?.includes('OT') && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-soft">
                                    <label className="text-xs font-black text-[#4A6E85] block">
                                        請輸入其他長期疾病名稱：
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="例如：痛風、前列腺增生、骨質疏鬆等"
                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-[#4A6E85]"
                                        value={profile.otherConditions || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setProfile({ ...profile, otherConditions: val });
                                            handleUpdateConditionDetail('OT', 'specificName', val);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* ===================== 2. 選擇完相應疾病後的詢問詳情 ===================== */}
                        {selectedConditions.length > 0 && (
                            <div className="space-y-4 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
                                        <span>📝</span>
                                        <span>已選疾病之具體情況</span>
                                    </h3>
                                    <span className="text-[11px] font-bold text-[#4A6E85]">
                                        已選擇 {selectedConditions.length} 項疾病
                                    </span>
                                </div>

                                        {/* 1. 糖尿病專屬詢問 (若選了糖尿病 DM) */}
                                        {isDiabetesSelected && (
                                            <div className="p-5 bg-gradient-to-br from-[#4A6E85]/5 to-transparent rounded-2xl border-2 border-[#4A6E85]/30 space-y-4 shadow-sm animate-soft">
                                                <div className="flex items-center justify-between border-b border-[#4A6E85]/15 pb-2">
                                                    <h4 className="font-black text-[#4A6E85] text-sm sm:text-base flex items-center gap-1.5">
                                                        <span>🍬</span> 糖尿病管理情況
                                                    </h4>
                                                    <span className="text-[10px] bg-[#4A6E85] text-white px-2 py-0.5 rounded-md font-bold">
                                                        重點追蹤
                                                    </span>
                                                </div>

                                                {/* 糖尿病類型 */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-600 block">
                                                        1. 糖尿病類型：
                                                    </label>
                                                    <select
                                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-[#4A6E85]"
                                                        value={profile.diabetesType || 'TYPE_2'}
                                                        onChange={e => setProfile({ ...profile, diabetesType: e.target.value as DiabetesType })}
                                                    >
                                                        <option value="TYPE_2">第 2 型糖尿病 (常見糖尿 / Type 2 DM)</option>
                                                        <option value="TYPE_1">第 1 型糖尿病 (胰島素依賴 / Type 1 DM)</option>
                                                        <option value="PRE_DIABETES">糖尿病前期 / 血糖警戒線 (Pre-diabetes)</option>
                                                        <option value="GESTATIONAL">妊娠期糖尿病 (Gestational DM)</option>
                                                        <option value="OTHER">其他類型 / 未確定</option>
                                                    </select>
                                                </div>

                                                {/* 是否正在注射胰島素 */}
                                                <div className="space-y-1.5 pt-1">
                                                    <label className="text-xs font-black text-slate-600 block">
                                                        2. 是否正在注射胰島素？
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { value: true, label: '💉 是，正在注射胰島素' },
                                                            { value: false, label: '💊 否，未注射胰島素' }
                                                        ].map(opt => {
                                                            const isSelected = profile.isInsulinUser === opt.value;
                                                            return (
                                                                <button
                                                                    key={opt.label}
                                                                    type="button"
                                                                    onClick={() => setProfile({ ...profile, isInsulinUser: opt.value })}
                                                                    className={`p-3 rounded-xl font-black text-xs sm:text-sm border-2 transition-all cursor-pointer text-center ${
                                                                        isSelected
                                                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* 是否有家人/照顧者日常協助管理糖尿病 */}
                                                <div className="space-y-1.5 pt-1">
                                                    <label className="text-xs font-black text-slate-600 block">
                                                        3. 是否有家人/照顧者日常協助管理糖尿病？
                                                    </label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {[
                                                            { value: true, label: '👨‍👩‍👧 有家人或照顧者日常協助' },
                                                            { value: false, label: '🏠 自己獨立管理與照顧' }
                                                        ].map(opt => {
                                                            const isSelected = profile.hasCaregiverSupport === opt.value;
                                                            return (
                                                                <button
                                                                    key={opt.label}
                                                                    type="button"
                                                                    onClick={() => setProfile({
                                                                        ...profile,
                                                                        hasCaregiverSupport: opt.value,
                                                                        hasNoCaregiverSupport: !opt.value
                                                                    })}
                                                                    className={`p-3 rounded-xl font-black text-xs sm:text-sm border-2 transition-all cursor-pointer text-center ${
                                                                        isSelected
                                                                            ? 'bg-[#4A6E85] text-white border-[#4A6E85] shadow-xs'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                {/* 2. 其他已選疾病的詢問：患病多少年、詳情（如有） */}
                                {nonDiabetesSelected.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider block px-1">
                                            其他已選疾病情況：
                                        </span>
                                        {nonDiabetesSelected.map(condId => {
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
                                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#4A6E85]"></span>
                                                            {label}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCondition(condId)}
                                                            className="text-slate-400 hover:text-rose-500 text-xs font-bold transition-colors cursor-pointer"
                                                        >
                                                            ✕ 取消選擇
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {/* 患病多少年 */}
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-black text-slate-500 block">
                                                                患病多少年？
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    placeholder="如 3"
                                                                    className="w-full p-2.5 pr-8 rounded-xl bg-white border border-slate-200 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-[#4A6E85]"
                                                                    value={currentYears}
                                                                    onChange={e => handleUpdateConditionDetail(condId, 'years', e.target.value)}
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">年</span>
                                                            </div>
                                                        </div>

                                                        {/* 詳情（如有） */}
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-black text-slate-500 block">
                                                                詳情（如有）
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="例如：服藥控制中、定期專科覆診等"
                                                                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-bold text-xs sm:text-sm text-slate-800 outline-none focus:border-[#4A6E85]"
                                                                value={currentDetail.specificName || ''}
                                                                onChange={e => handleUpdateConditionDetail(condId, 'specificName', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 溫馨提醒：完成後會同步到個人檔案 */}
                        <div className="bg-[#E8DED2]/30 p-4 rounded-2xl border border-[#E8DED2] flex items-start gap-3">
                            <span className="text-xl shrink-0 mt-0.5">💡</span>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-700 font-black">
                                    資料將同步到【個人檔案】
                                </p>
                                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                    首次設定已完成！其餘糖尿病專科用藥清單、飲食運動偏好及就診安排，可隨時在「個人檔案」中進一步完善。
                                </p>
                            </div>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setOnboardingStep(1)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-base transition-all cursor-pointer"
                            >
                                上一步
                            </button>
                            <button
                                type="button"
                                onClick={() => setView(View.Home)}
                                className="flex-[2] bg-[#4A6E85] hover:bg-[#3A5D75] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#4A6E85]/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>完成並進入糖友導航</span>
                                <span>✓</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 底部小圓點導航指示 */}
            <div className="flex justify-center">
                <div className="flex gap-2 items-center">
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${onboardingStep === 1 ? 'w-8 bg-[#4A6E85]' : 'w-2.5 bg-slate-200'}`}></div>
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${onboardingStep === 2 ? 'w-8 bg-[#4A6E85]' : 'w-2.5 bg-slate-200'}`}></div>
                </div>
            </div>
        </div>
    );
};
