import type { DetailViewProps } from './types';

export function UploadConsole({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            {/* 上報數據控製台 */}
            <section className="pt-10 space-y-6">
                <button
                    onClick={handleUploadData}
                    disabled={isUploading}
                    className={`w-full py-10 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all ${
                        isUploading
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#4A6E85] text-white hover:scale-[1.02] active:scale-95 shadow-[#4A6E85]/20'
                    }`}
                >
                    {isUploading ? '正在上報健康數據...' : '🚀 上報完整紀錄'}
                </button>

                {uploadLogs.length > 0 && (
                    <div className="premium-card bg-slate-900 border-none p-8 font-mono text-sm max-h-60 overflow-y-auto custom-scrollbar shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-bold uppercase tracking-widest px-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             系統日誌
                        </div>
                        {uploadLogs.map((log, i) => (
                            <div
                                key={i}
                                className={`mb-2 px-2 py-1 rounded ${
                                    log.includes('[錯誤]')
                                        ? 'text-rose-400 bg-rose-500/10'
                                        : log.includes('成功')
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : 'text-slate-500'
                                }`}
                            >
                                <span className="opacity-30 mr-2">[{i.toString().padStart(3, '0')}]</span>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
