import {COMMON_CONDITIONS, OTHER_CONDITIONS, conditionsList} from '../../utils/constants';
import {View, DiabetesType} from '../../utils/types';
import type {OnboardingViewModel} from './useOnboardingViewModel';

export function ConditionsStep({vm}: {vm: OnboardingViewModel}) {
    const {
        profile,
        setProfile,
        setOnboardingStep,
        setView,
        toggleCondition,
        handleUpdateConditionDetail,
        selectedConditions,
        isNoneSelected,
        isDiabetesSelected,
        nonDiabetesSelected,
    } = vm;
    return (
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
    );
}
