import type {MeViewModel} from './useMeViewModel';
import { getBmiEvaluation } from '../../utils/constants';

export function PersonalInfoCard({vm}: {vm: MeViewModel}) {
    const {
        handleHeightChange,
        handleWeightChange,
        handleWeightUnitChange,
        isLargeFont,
        profile,
        setProfile
    } = vm;

    return (
        <>
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
        </>
    );
}
