import type {MeViewModel} from './useMeViewModel';
import { COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList } from '../../utils/constants';

export function ConditionsCard({vm}: {vm: MeViewModel}) {
    const {
        handleUpdateConditionDetail,
        hasOtherCondition,
        isLargeFont,
        profile,
        toggleConditionLocal
    } = vm;

    return (
        <>
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
        </>
    );
}
