import type {MeViewModel} from './useMeViewModel';

export function CaregiverCard({vm}: {vm: MeViewModel}) {
    const {
        isLargeFont,
        profile,
        setProfile
    } = vm;

    return (
        <>
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
        </>
    );
}
