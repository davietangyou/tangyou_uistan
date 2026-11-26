import type { DetailViewProps } from './types';

export function AnalysisSection({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            {/* AI 分析報告 */}
            {result && (
                <section className="premium-card p-10 bg-[#4A6E85]/5 border-none shadow-xl shadow-slate-200/50 space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#4A6E85] text-white flex items-center justify-center text-2xl shadow-lg">✨</div>
                        <div>
                            <h3 className="text-[#4A6E85] font-black text-xl">AI 分析報告建議</h3>
                            <p className="text-[#4A6E85]/60 text-xs font-bold tracking-widest uppercase">已根據您的情況進行深度分析</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mb-4">分析摘要</p>
                            <p className="text-xl font-black text-slate-800 leading-relaxed bg-white/60 p-6 rounded-3xl">{result.summary}</p>
                        </div>

                        <div>
                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mb-4">就診建議清單</p>
                            <div className="space-y-3">
                                {result.doctorQuestions.map((q, i) => (
                                    <div key={i} className="flex gap-4 items-start p-6 bg-white rounded-3xl shadow-sm">
                                        <span className="w-8 h-8 rounded-full bg-[#E8DED2] text-[#4A6E85] flex items-center justify-center font-black text-sm flex-shrink-0">
                                            {i + 1}
                                        </span>
                                        <span className="text-lg font-black text-slate-700 leading-snug">{q}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
