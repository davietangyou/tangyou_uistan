import type { DetailViewProps } from './types';

export function PageHeader({vm}: {vm: DetailViewProps}) {
    const {
        profile, concern, clarifications, answers, supplementalAnswer, result,
        audioLogs, playingAudioId, toggleAudio, isUploading, handleUploadData, uploadLogs
    } = vm;
    return (
        <>
            <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">個人資料</h2>
                <p className="text-slate-400 font-bold">查看本次諮詢的所有紀錄與細節</p>
            </div>
        </>
    );
}
