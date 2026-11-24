/**
 * src/views/AdminView.tsx
 *
 * 管理端視圖組件
 *
 * 職責：
 * 1. 提供 "刷新數據" 按鈕，從服務器獲取所有用戶的歷史存檔 (JSON)。
 * 2. 以列表形式展示每個用戶的詳細報告。
 * 3. 兼容展示新舊版本的數據結構（如單選與多選答案）。
 * 4. 提供錄音的在線播放 (Play/Pause) 和下載功能。
 */

import React from 'react';
import {conditionsList} from '../utils/constants';

interface AdminViewProps {
    // 數據狀態
    adminData: Record<string, Record<string, any>> | null;
    isAdminLoading: boolean;
    playingAdminUrl: string | null;

    // 操作方法
    fetchAdminData: () => Promise<void>;
    playSecureAudio: (url: string) => Promise<void>;
    downloadSecureAudio: (url: string, filename?: string) => Promise<void>;

    // 允許傳入其他來自 useAppLogic 的 props
    [key: string]: any;
}

export const AdminView: React.FC<AdminViewProps> = (props) => {
    const {
        adminData,
        isAdminLoading,
        playingAdminUrl,
        fetchAdminData,
        playSecureAudio,
        downloadSecureAudio
    } = props;

    /**
     * 輔助函數：判斷選項是否被選中
     */
    const isOptionSelected = (userAnswer: string | string[] | undefined, option: string): boolean => {
        if (!userAnswer) return false;
        if (Array.isArray(userAnswer)) {
            return userAnswer.includes(option);
        }
        return userAnswer === option;
    };

    /**
     * 輔助函數：獲取用戶選擇了但不在預設選項列表中的內容
     */
    const getCustomAnswers = (userAnswer: string | string[] | undefined, options: string[]): string[] => {
        if (!userAnswer || !Array.isArray(userAnswer)) return [];
        return userAnswer.filter(ans => !options.includes(ans));
    };

    return (
        <div className="space-y-12 animate-soft pb-32">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">系統數據總覽</h2>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">管理員專用控制台</p>
                </div>
                <button
                    onClick={fetchAdminData}
                    disabled={isAdminLoading}
                    className="bg-[#4A6E85] text-white px-8 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-[#4A6E85]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {isAdminLoading ? '加載中...' : '🔄 刷新同步'}
                </button>
            </div>

            {!adminData && !isAdminLoading && (
                <div className="premium-card p-20 text-center text-slate-400 border-dashed border-4 border-slate-100 flex flex-col items-center gap-4">
                    <span className="text-6xl grayscale opacity-30">📁</span>
                    <p className="font-black text-xl">點擊刷新按鈕獲取最新用戶軌跡</p>
                </div>
            )}

            {adminData && Object.keys(adminData).map(userId => (
                <div key={userId} className="space-y-6">
                    <div className="flex items-center gap-4 px-6">
                        <div className="w-3 h-3 rounded-full bg-[#4A6E85]"></div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">用戶節點</span>
                        <span className="font-mono text-sm font-black text-[#4A6E85] bg-[#4A6E85]/5 px-4 py-1.5 rounded-full ring-1 ring-[#4A6E85]/20">
                            {userId}
                        </span>
                    </div>

                    {Object.entries(adminData[userId]).map(([fileKey, report]: [string, any]) => {
                        const consult = report.consultation || {};
                        const result = consult.result || {};
                        const clarifications = consult.clarifications || [];
                        const answers = consult.answers || {};
                        const supplementalAnswer = consult.supplementalAnswer;

                        return (
                            <div key={fileKey} className="premium-card p-10 bg-white shadow-xl shadow-slate-100/30 space-y-10 border-2 border-slate-50">
                                <div className="flex justify-between items-start border-b-2 border-slate-50 pb-8">
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">紀錄建立時間</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {report.meta?.generatedAt ? new Date(report.meta.generatedAt).toLocaleString() : '未知時間'}
                                        </p>
                                        <p className="text-xs font-mono text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-md">{fileKey}</p>
                                    </div>
                                    <div className="bg-[#E8DED2] text-[#4A6E85] px-6 py-3 rounded-2xl text-sm font-black shadow-sm ring-4 ring-white">
                                        {report.audioLogs?.length || 0} 條錄音紀錄
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[#4A6E85] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-4 bg-[#4A6E85] rounded-full"></span> 用戶特徵
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-6 rounded-3xl">
                                                    <p className="text-xs font-bold text-slate-400">年齡/性別</p>
                                                    <p className="text-xl font-black text-slate-800">{report.profile?.age} / {report.profile?.gender}</p>
                                                </div>
                                                <div className="bg-slate-50 p-6 rounded-3xl">
                                                    <p className="text-xs font-bold text-slate-400">病齡 (壓/糖)</p>
                                                    <p className="text-xl font-black text-slate-800">{report.profile?.hypertensionYears || 0}y / {report.profile?.yearsWithDiabetes || 0}y</p>
                                                </div>
                                                <div className="bg-slate-50 p-6 rounded-3xl col-span-2">
                                                    <p className="text-xs font-bold text-slate-400">長期狀況</p>
                                                    <p className="text-lg font-black text-slate-800">
                                                        {report.profile?.conditions?.map((c: string) => conditionsList.find(l => l.id === c)?.label).filter(Boolean).join(', ') || '無'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[#4A6E85] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-4 bg-[#4A6E85] rounded-full"></span> 諮詢內容
                                            </h4>
                                            <div className="space-y-3">
                                                {consult.concern && (
                                                    <div className="bg-[#4A6E85]/5 p-6 rounded-3xl border border-[#4A6E85]/10">
                                                        <p className="text-xs font-black text-[#4A6E85] uppercase tracking-widest mb-2">初始關切</p>
                                                        <p className="text-lg font-black text-slate-800 leading-snug">{consult.concern}</p>
                                                    </div>
                                                )}

                                                {clarifications.map((q: any, idx: number) => {
                                                    const answer = answers[q.id];
                                                    if (!answer) return null;
                                                    return (
                                                        <div key={idx} className="bg-white border-2 border-slate-50 p-6 rounded-3xl shadow-sm space-y-4">
                                                            <p className="text-sm font-bold text-slate-400">問題：{q.question}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.options && q.options.length > 0 ? (
                                                                    q.options.map((opt: string) => {
                                                                        const selected = isOptionSelected(answer, opt);
                                                                        return (
                                                                            <span key={opt} className={`text-xs px-4 py-2 rounded-xl border-2 transition-all ${
                                                                                selected ? 'bg-[#4A6E85] border-[#4A6E85] text-white font-black shadow-md' : 'bg-slate-50 border-slate-50 text-slate-300'
                                                                            }`}>
                                                                                {opt}
                                                                            </span>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p className="text-lg font-black text-[#4A6E85]">
                                                                        {Array.isArray(answer) ? answer.join('、') : answer}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[#4A6E85] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-4 bg-[#4A6E85] rounded-full"></span> AI 解析結果
                                            </h4>
                                            <div className="bg-slate-900 text-slate-300 p-8 rounded-[2.5rem] shadow-2xl relative">
                                                <div className="absolute top-6 right-8 text-2xl opacity-20">✨</div>
                                                <p className="text-lg font-bold leading-relaxed">{result.summary || '未生成報告'}</p>
                                            </div>
                                        </div>

                                        {report.audioLogs?.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-[#4A6E85] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-[#4A6E85] rounded-full"></span> 錄音存檔
                                                </h4>
                                                <div className="space-y-2">
                                                    {report.audioLogs.map((log: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-5 rounded-3xl border-2 border-slate-50 shadow-sm transition-all hover:border-[#7FA0B4]/30">
                                                            <div className="overflow-hidden mr-4">
                                                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                                </p>
                                                                <p className="text-sm font-black text-slate-700 truncate capitalize">{log.transcript || '無語音轉文字'}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {log.url && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => playSecureAudio(log.url)}
                                                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                                                                                playingAdminUrl === log.url ? 'bg-rose-500 text-white scale-110' : 'bg-slate-50 text-[#4A6E85] hover:bg-white border-2 border-transparent hover:border-[#7FA0B4]/30'
                                                                            }`}
                                                                        >
                                                                            {playingAdminUrl === log.url ? '⏸' : '▶️'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => downloadSecureAudio(log.url, `recording_${log.timestamp}.webm`)}
                                                                            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border-2 border-transparent hover:border-[#7FA0B4]/30 flex items-center justify-center transition-all"
                                                                        >
                                                                            💾
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

