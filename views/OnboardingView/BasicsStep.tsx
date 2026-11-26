import {getBmiEvaluation} from '../../utils/constants';
import type {OnboardingViewModel} from './useOnboardingViewModel';

export function BasicsStep({vm}: {vm: OnboardingViewModel}) {
    const {
        profile,
        setProfile,
        setOnboardingStep,
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
    } = vm;
    return (
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
    );
}
