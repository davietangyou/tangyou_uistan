import type { DetailViewProps } from './types';

export function ClarificationsSection({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            {/* 3. 補充問答 */}
            {clarifications.length > 0 && (
                <section className="premium-card p-10 bg-white shadow-xl shadow-slate-100/50 space-y-8">
                    <h3 className="text-[#4A6E85] font-black text-lg flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#4A6E85] rounded-full"></span> 進一步了解
                    </h3>
                    <div className="space-y-4">
                        {clarifications.map((q, idx) => {
                            const rawAnswer = answers[q.id];
                            const displayAnswer = Array.isArray(rawAnswer)
                                ? rawAnswer.join('、')
                                : (rawAnswer || '未回答');

                            return (
                                <div key={idx} className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-slate-50">
                                    <p className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-3">問題 {idx + 1}</p>
                                    <p className="font-black text-xl text-slate-800 mb-4 leading-tight">{q.question}</p>
                                    <div className="bg-white p-4 rounded-2xl inline-block border border-slate-100 font-black text-[#4A6E85]">
                                        答：{displayAnswer}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </>
    );
}
