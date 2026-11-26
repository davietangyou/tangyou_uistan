import type { DetailViewProps } from './types';

export function ConcernSection({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            {/* 2. 初始困擾 */}
            {concern && (
                <section className="premium-card p-10 bg-white shadow-xl shadow-slate-100/50 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8DED2]/40 flex items-center justify-center text-xl">💬</div>
                        <h3 className="text-[#4A6E85] font-black text-lg">初始關切</h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-relaxed tracking-tight">{concern}</p>
                </section>
            )}
        </>
    );
}
