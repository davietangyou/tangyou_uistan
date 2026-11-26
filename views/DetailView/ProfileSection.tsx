import type { DetailViewProps } from './types';

export function ProfileSection({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            {/* 1. 個人資料 */}
            <section className="premium-card p-10 bg-white shadow-xl shadow-slate-100/50 space-y-8">
                <h3 className="text-[#4A6E85] font-black text-lg flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#4A6E85] rounded-full"></span> 基本資料
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                        <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">年齡</span>
                        <span className="text-xl font-black text-slate-800">{profile.age || '--'}</span>
                    </div>
                    <div>
                        <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">性別</span>
                        <span className="text-xl font-black text-slate-800">{profile.gender || '--'}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">糖尿病類型</span>
                        <span className="text-xl font-black text-slate-800">
                             {(() => {
                                 switch(profile.diabetesType) {
                                     case 'TYPE_1': return '1 型糖尿病';
                                     case 'TYPE_2': return '2 型糖尿病';
                                     case 'GESTATIONAL': return '妊娠糖尿病';
                                     case 'PRE_DIABETES': return '糖尿病前期';
                                     default: return '未確定';
                                 }
                             })()}
                        </span>
                    </div>
                    {profile.hypertensionYears && (
                        <div>
                            <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">高血壓病齡</span>
                            <span className="text-xl font-black text-slate-800">{profile.hypertensionYears} 年</span>
                        </div>
                    )}
                    {profile.yearsWithDiabetes && (
                        <div>
                            <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">糖尿病病齡</span>
                            <span className="text-xl font-black text-slate-800">{profile.yearsWithDiabetes} 年</span>
                        </div>
                    )}
                    <div className="col-span-2">
                        <span className="text-slate-300 text-xs font-black uppercase tracking-widest block mb-1">現時用藥</span>
                        <span className="text-xl font-black text-[#4A6E85] leading-relaxed">
                            {profile.medicationDetails?.length ? profile.medicationDetails.map(m => m.name).join('、') : (profile.medications || '未提供')}
                        </span>
                    </div>
                </div>
            </section>
        </>
    );
}
