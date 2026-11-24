/**
 * src/views/DetailView.tsx
 *
 * 完整資料總覽視圖組件
 *
 * 職責：
 * 1. 展示用戶當前會話的所有數據匯總（個人資料、初始困擾、問診對話、補充分享、AI分析結果）。
 * 2. 展示本次會話產生的語音記錄，並支持回放。
 * 3. 提供數據上報功能，將當前會話的所有數據（包括錄音文件和 JSON 報告）上傳至服務器。
 * 4. 展示上傳過程中的實時日誌。
 */

import React from 'react';
import {AudioLog, ClarificationQuestion, DecisionResult, UserProfile} from '../utils/types';
import {conditionsList} from '../utils/constants';

interface DetailViewProps {
    // 基礎數據
    profile: UserProfile;
    concern: string;
    clarifications: ClarificationQuestion[];

    // 變更：answers 類型更新為 string[] 以支持多選
    answers: Record<string, string[]>;
    // 新增：補充回答字段
    supplementalAnswer: string;

    result: DecisionResult | null;

    // 語音記錄 (當前會話)
    audioLogs: AudioLog[];
    playingAudioId: string | null;
    toggleAudio: (log: AudioLog) => void;

    // 數據上報狀態
    isUploading: boolean;
    handleUploadData: () => Promise<void>;
    uploadLogs: string[];

    // 允許傳入其他來自 useAppLogic 的 props
    [key: string]: any;
}

export const DetailView: React.FC<DetailViewProps> = (props) => {
    const {
        profile,
        concern,
        clarifications,
        answers,
        supplementalAnswer,
        result,
        audioLogs,
        playingAudioId,
        toggleAudio,
        isUploading,
        handleUploadData,
        uploadLogs
    } = props;

    return (
        <div className="space-y-12 animate-soft pb-24">
            <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">個人資料</h2>
                <p className="text-slate-400 font-bold">查看本次諮詢的所有紀錄與細節</p>
            </div>

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
        </div>
    );
};

