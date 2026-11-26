import type {MeViewModel} from './useMeViewModel';
import {EXERCISE_TYPE_OPTIONS} from './constants';

export function LifestyleCard({vm}: {vm: MeViewModel}) {
    const {
        calculateExerciseFromHabits,
        isLargeFont,
        profile,
        setProfile
    } = vm;

    return (
        <>
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
        </>
    );
}
