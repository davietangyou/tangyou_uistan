/**
 * src/views/SavedQuestionsView.tsx
 *
 * 我的問題與 AI 總結視圖
 *
 * 職責：
 * 1. AI 總結置頂於前面，歸納保存的 3-5 類別問題，並提供候選問診問題供病人挑選保存至「下次問診清單」。
 * 2. 提供「下次問診清單」管理（可添加、移除、自訂新增想問的問題）。
 * 3. 支援所有保存問題的檢視與手動新增/編輯/刪除。
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, View } from '../utils/types';
import { analyzeSavedQuestions } from '../services/geminiService';

interface SavedQuestionsViewProps {
    profile: UserProfile;
    setProfile: (profile: UserProfile) => void;
    setView: (view: View) => void;
    isLargeFont?: boolean;
    [key: string]: any;
}

export const SavedQuestionsView: React.FC<SavedQuestionsViewProps> = ({
    profile,
    setProfile,
    setView,
    isLargeFont = false
}) => {
    const savedQuestions = profile.savedDoctorQuestions || [];
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const nextClinicDate = profile.nextClinicDate || '';

    // 本地編輯與新增狀態
    const [isAdding, setIsAdding] = useState(false);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    // 新增下次問診清單問題
    const [isAddingNextQ, setIsAddingNextQ] = useState(false);
    const [newNextQText, setNewNextQText] = useState('');

    // 下次問診日期編輯狀態
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [tempClinicDate, setTempClinicDate] = useState(nextClinicDate);

    // AI 總結狀態
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        summary: string;
        categories?: {
            categoryName: string;
            description: string;
            frequency: string;
        }[];
        recommendedQuestions: { question: string; categoryTag?: string }[];
        suggestedDoctorPrep?: string[];
    } | null>(null);

    // AI 總結是否展開（預設自動展開，若已有問題則自動加載）
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

    // 所有已保存問題庫是否展開（預設收起）
    const [isSavedListExpanded, setIsSavedListExpanded] = useState(false);

    // 就診準備核對清單狀態（本地勾選）
    const [checkedPrepItems, setCheckedPrepItems] = useState<Record<number, boolean>>({});

    // 手動觸發/重整 AI 總結（點擊後再運行）
    const handleRefreshAnalysis = async () => {
        if (savedQuestions.length === 0 || analysisLoading) return;
        setAnalysisLoading(true);
        try {
            const res = await analyzeSavedQuestions(savedQuestions);
            setAnalysisResult(res);
        } catch (e) {
            console.error("AI 總結載入失敗", e);
        } finally {
            setAnalysisLoading(false);
        }
    };

    // 加入/移除下次問診清單
    const toggleNextClinicQuestion = (qText: string) => {
        const trimmed = qText.trim();
        const exists = nextClinicQuestions.some(item => item.trim() === trimmed);
        let updated: string[];
        if (exists) {
            updated = nextClinicQuestions.filter(item => item.trim() !== trimmed);
        } else {
            updated = [...nextClinicQuestions, trimmed];
        }
        setProfile({
            ...profile,
            nextClinicQuestions: updated
        });
    };

    // 手動新增問題至全部保存記錄
    const handleAddQuestion = () => {
        if (!newQuestionText.trim()) return;
        const updated = [newQuestionText.trim(), ...savedQuestions];
        setProfile({
            ...profile,
            savedDoctorQuestions: updated
        });
        setNewQuestionText('');
        setIsAdding(false);
    };

    // 手動刪除保存問題
    const handleDeleteQuestion = (indexToDelete: number) => {
        const deletedText = savedQuestions[indexToDelete];
        const updated = savedQuestions.filter((_, idx) => idx !== indexToDelete);
        // 若該問題也在下次問診清單中，同時移除
        const updatedNext = nextClinicQuestions.filter(item => item.trim() !== deletedText.trim());
        setProfile({
            ...profile,
            savedDoctorQuestions: updated,
            nextClinicQuestions: updatedNext
        });
    };

    // 開始編輯保存問題
    const startEditing = (idx: number, text: string) => {
        setEditingIndex(idx);
        setEditingText(text);
    };

    // 儲存編輯後的問題
    const handleSaveEdit = () => {
        if (editingIndex === null || !editingText.trim()) return;
        const oldText = savedQuestions[editingIndex];
        const newText = editingText.trim();
        const updated = [...savedQuestions];
        updated[editingIndex] = newText;
        
        // 若在下次問診清單中，也同步更新
        const updatedNext = nextClinicQuestions.map(item => item.trim() === oldText.trim() ? newText : item);

        setProfile({
            ...profile,
            savedDoctorQuestions: updated,
            nextClinicQuestions: updatedNext
        });
        setEditingIndex(null);
        setEditingText('');
    };

    // 儲存下次問診時間
    const handleSaveClinicDate = () => {
        setProfile({
            ...profile,
            nextClinicDate: tempClinicDate
        });
        setIsEditingDate(false);
    };

    // 手動新增專屬下次問診清單問題
    const handleAddNextClinicQuestion = () => {
        if (!newNextQText.trim()) return;
        const q = newNextQText.trim();
        const updatedNext = [q, ...nextClinicQuestions];
        // 若全部保存中沒有，也自動加入保存清單
        const updatedSaved = savedQuestions.includes(q) ? savedQuestions : [q, ...savedQuestions];
        setProfile({
            ...profile,
            nextClinicQuestions: updatedNext,
            savedDoctorQuestions: updatedSaved
        });
        setNewNextQText('');
        setIsAddingNextQ(false);
    };

    return (
        <div className={`space-y-4 animate-soft pb-20 ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            {/* 頂部簡短標題 */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                <div className="space-y-0.5">
                    <h2 className={`font-black text-slate-900 tracking-tighter ${isLargeFont ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>
                        📝 問題紀錄
                    </h2>
                    <p className={`text-slate-500 font-bold ${isLargeFont ? 'text-sm' : 'text-[11px] sm:text-xs'}`}>
                        AI 自動總結常見類別，挑選重要問題加入下次問診清單！
                    </p>
                </div>
                <button
                    onClick={() => setView(View.Consult)}
                    className="text-[#4A6E85] bg-[#4A6E85]/5 border border-[#4A6E85]/15 hover:bg-[#4A6E85]/10 font-black text-[11px] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                >
                    💬 問問 AI
                </button>
            </div>

            {/* 🤖【1. AI 總結放在前面】：總結 3-5 類別問題，並提供勾選挑選加入下次問診清單 */}
            <div className="premium-card bg-gradient-to-b from-[#F0F5F8] to-white border border-[#4A6E85]/20 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-[#4A6E85]/15 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h3 className={`font-black text-[#4A6E85] ${isLargeFont ? 'text-xl' : 'text-base sm:text-lg'}`}>
                                【AI 總結】
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {savedQuestions.length > 0 && !analysisLoading && (
                            <button
                                onClick={handleRefreshAnalysis}
                                className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-black shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1 ${
                                    analysisResult 
                                        ? 'bg-white text-[#4A6E85] hover:bg-slate-50 border border-[#4A6E85]/20' 
                                        : 'bg-[#4A6E85] text-white hover:bg-[#3d5b6e]'
                                }`}
                                title={analysisResult ? "重新分析" : "開始運行 AI 總結"}
                            >
                                <span>{analysisResult ? '🔄 重新整理' : '✨ 運行 AI 總結'}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                            className="text-[10px] bg-[#4A6E85]/10 text-[#4A6E85] px-2.5 py-1 rounded-lg font-black border border-[#4A6E85]/20 hover:bg-[#4A6E85]/20 cursor-pointer"
                        >
                            {isAnalysisExpanded ? "收起 ▲" : "展開 ▼"}
                        </button>
                    </div>
                </div>

                {isAnalysisExpanded && (
                    <div className="space-y-3.5 animate-soft">
                        {analysisLoading && (
                            <div className="text-center py-6 space-y-2 animate-pulse bg-white/80 rounded-xl border border-slate-100 p-4">
                                <span className="animate-spin inline-block text-2xl">⚙️</span>
                                <p className={`text-slate-600 font-black ${isLargeFont ? 'text-base' : 'text-xs sm:text-sm'}`}>
                                    AI 正在為您智慧歸納常問類別與就診建議，請稍候...
                                </p>
                            </div>
                        )}

                        {savedQuestions.length === 0 && !analysisLoading && (
                            <div className="text-center py-6 space-y-2 bg-white/80 rounded-xl border border-slate-100 p-4">
                                <span className="text-3xl block">💡</span>
                                <p className={`text-slate-500 font-extrabold ${isLargeFont ? 'text-base' : 'text-xs sm:text-sm'}`}>
                                    暫無保存的問題記錄。
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold max-w-xs mx-auto">
                                    在「問問 AI」對話或下方「手動新增」想問醫生的問題，AI 就會在此為您自動歸納出 3-5 類別重點與精選提問！
                                </p>
                            </div>
                        )}

                        {savedQuestions.length > 0 && !analysisResult && !analysisLoading && (
                            <div className="text-center py-6 px-4 space-y-3 bg-white/90 rounded-2xl border border-[#4A6E85]/20 shadow-xs">
                                <span className="text-3xl block">🤖</span>
                                <div className="space-y-1">
                                    <p className={`text-slate-800 font-black ${isLargeFont ? 'text-lg' : 'text-sm sm:text-base'}`}>
                                        已保存 {savedQuestions.length} 則想問醫生的問題
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                        點擊下方按鈕，AI 將歸納您的提問類別、分析核心關注點，並挑選重要問題推薦至「下次問診清單」！
                                    </p>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleRefreshAnalysis}
                                        className="inline-flex items-center justify-center gap-2 bg-[#4A6E85] hover:bg-[#3d5b6e] text-white font-black px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-xs sm:text-sm"
                                    >
                                        <span>✨</span>
                                        <span>點擊開始 AI 總結</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {analysisResult && !analysisLoading && (
                            <div className="space-y-3.5 animate-soft">
                                {/* 整體摘要 */}
                                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-inner space-y-1">
                                    <p className="text-[#4A6E85] font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📊</span> 核心關注概述：
                                    </p>
                                    <div className={`text-slate-700 font-extrabold leading-relaxed ${isLargeFont ? 'text-lg' : 'text-xs sm:text-[13px]'} markdown-body`}>
                                        <ReactMarkdown
                                            components={{
                                                p: ({node, ...props}) => <p className="whitespace-pre-line mb-1 last:mb-0" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-1 whitespace-pre-line" {...props} />,
                                                li: ({node, ...props}) => <li className="whitespace-pre-line" {...props} />
                                            }}
                                        >
                                            {analysisResult.summary ? analysisResult.summary.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n') : ''}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* 📌 經常保存的 3-5 類別問題 */}
                                {analysisResult.categories && analysisResult.categories.length > 0 && (
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-inner space-y-2.5">
                                        <p className={`text-[#4A6E85] font-black flex items-center gap-1.5 border-b border-slate-100 pb-1.5 ${isLargeFont ? 'text-lg' : 'text-[11px] sm:text-xs'} uppercase tracking-wider`}>
                                            <span>📑</span> 經常保存的 {analysisResult.categories.length} 個類別問題：
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {analysisResult.categories.map((cat, cIdx) => (
                                                <div key={cIdx} className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 flex items-start justify-between gap-2.5">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-5 h-5 rounded-md bg-[#4A6E85]/10 text-[#4A6E85] text-[10px] font-black flex items-center justify-center shrink-0">
                                                                {cIdx + 1}
                                                            </span>
                                                            <span className={`font-black text-slate-800 ${isLargeFont ? 'text-base' : 'text-xs sm:text-sm'}`}>
                                                                {cat.categoryName}
                                                            </span>
                                                        </div>
                                                        <p className={`text-slate-500 font-bold pl-6 ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>
                                                            {cat.description}
                                                        </p>
                                                    </div>
                                                    {cat.frequency && (
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                                                            {cat.frequency}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 🩺 從中挑選最想問的問題保存到下次問診清單 */}
                                {analysisResult.recommendedQuestions && analysisResult.recommendedQuestions.length > 0 && (
                                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-inner space-y-2.5 bg-gradient-to-b from-amber-50/20 to-white">
                                        <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                                            <p className={`text-amber-800 font-black flex items-center gap-1.5 ${isLargeFont ? 'text-lg' : 'text-[11px] sm:text-xs'} uppercase tracking-wider`}>
                                                <span>🩺</span> 挑選最想問的問題保存至「下次問診清單」：
                                            </p>
                                            <span className="text-[10px] text-amber-700 font-bold">
                                                已選入 {nextClinicQuestions.length} 題
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {analysisResult.recommendedQuestions.map((item, qIdx) => {
                                                const isInNextList = nextClinicQuestions.some(
                                                    nq => nq.trim() === item.question.trim()
                                                );
                                                return (
                                                    <div 
                                                        key={qIdx} 
                                                        className={`p-3 rounded-xl border transition-all flex justify-between items-center gap-2.5 ${
                                                            isInNextList 
                                                                ? 'bg-emerald-50/80 border-emerald-200 shadow-xs' 
                                                                : 'bg-white border-slate-100 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="space-y-1 min-w-0">
                                                            {item.categoryTag && (
                                                                <span className="text-[9px] bg-slate-100 text-[#4A6E85] font-black px-1.5 py-0.5 rounded-md inline-block">
                                                                    {item.categoryTag}
                                                                </span>
                                                            )}
                                                            <p className={`text-slate-900 font-extrabold leading-snug whitespace-pre-line ${isLargeFont ? 'text-[17px]' : 'text-xs sm:text-[13px]'}`}>
                                                                💬 {item.question}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleNextClinicQuestion(item.question)}
                                                            className={`font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 ${
                                                                isInNextList
                                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                    : 'bg-[#4A6E85] text-white hover:bg-[#3D5B70]'
                                                            }`}
                                                        >
                                                            <span>{isInNextList ? '✓ 已加入問診' : '＋ 挑選加入'}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 📋【2. 下次問診清單 & 覆診日期】：展示病人精選的就診問題與提醒設定 */}
            <div className="premium-card bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-white border border-emerald-500/20 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/15">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🩺</span>
                        <div>
                            <h3 className={`font-black text-emerald-800 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                                下次問診清單（已挑選 {nextClinicQuestions.length} 題）
                            </h3>
                            <span className="text-[10px] text-emerald-600 font-bold">
                                將在首頁同步顯示，就診時可直接照著問醫生！
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isAddingNextQ && (
                            <button
                                onClick={() => setIsAddingNextQ(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                                <span>＋ 自訂加入</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 下次覆診日期設定 */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2 shadow-inner">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <span className={`font-black text-slate-700 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                            下次問診時間：
                        </span>
                        {isEditingDate ? (
                            <input
                                type="date"
                                value={tempClinicDate}
                                onChange={e => setTempClinicDate(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        ) : (
                            <span className={`font-black ${nextClinicDate ? 'text-emerald-700' : 'text-slate-400'} ${isLargeFont ? 'text-base' : 'text-xs sm:text-sm'}`}>
                                {nextClinicDate || '未設定問診日期'}
                            </span>
                        )}
                    </div>
                    <div>
                        {isEditingDate ? (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        setTempClinicDate(nextClinicDate);
                                        setIsEditingDate(false);
                                    }}
                                    className="text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-bold cursor-pointer"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveClinicDate}
                                    className="text-[10px] text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 rounded font-black cursor-pointer shadow-xs"
                                >
                                    保存
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setTempClinicDate(nextClinicDate || new Date().toISOString().split('T')[0]);
                                    setIsEditingDate(true);
                                }}
                                className="text-[10px] text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-black border border-emerald-200 cursor-pointer"
                            >
                                ✏️ {nextClinicDate ? '修改日期' : '設定日期'}
                            </button>
                        )}
                    </div>
                </div>

                {/* 自訂新增問診問題 */}
                {isAddingNextQ && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2 animate-soft">
                        <input
                            type="text"
                            className="w-full p-2 rounded-lg border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-xs sm:text-sm font-bold shadow-inner text-slate-800"
                            placeholder="輸入想加入下次問診清單的問題..."
                            value={newNextQText}
                            onChange={e => setNewNextQText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddNextClinicQuestion();
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setIsAddingNextQ(false);
                                    setNewNextQText('');
                                }}
                                className="bg-white border border-slate-200 text-slate-500 font-bold text-[10px] px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAddNextClinicQuestion}
                                disabled={!newNextQText.trim()}
                                className="bg-emerald-600 text-white font-black text-[10px] px-3 py-1 rounded-lg hover:bg-emerald-700 disabled:bg-slate-200 cursor-pointer"
                            >
                                確定加入
                            </button>
                        </div>
                    </div>
                )}

                {/* 下次問診清單列表 */}
                {nextClinicQuestions.length === 0 ? (
                    <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-emerald-200 space-y-1">
                        <p className={`text-slate-400 font-extrabold ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                            目前尚未挑選下次問診問題。
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                            可在上方「AI 總結」或下方「所有保存問題」中點擊加入！
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {nextClinicQuestions.map((q, idx) => (
                            <div
                                key={idx}
                                className="p-2.5 sm:p-3 rounded-xl border border-emerald-100 bg-white shadow-xs flex items-start justify-between gap-3"
                            >
                                <div className="flex items-start gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className={`text-slate-800 font-extrabold leading-snug break-words ${isLargeFont ? 'text-lg' : 'text-xs sm:text-[13px]'}`}>
                                        {q}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleNextClinicQuestion(q)}
                                    className="text-rose-500 hover:bg-rose-50 font-bold text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer shrink-0"
                                    title="從下次問診清單移除"
                                >
                                    ✕ 移除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 📋【3. 所有保存的問題記錄】：完整的保存記錄庫（可展開/收起） */}
            <div className="premium-card bg-white p-3.5 sm:p-5 space-y-3.5 shadow-xs rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">📁</span>
                        <h3 className={`font-black text-slate-800 ${isLargeFont ? 'text-xl' : 'text-xs sm:text-sm'}`}>
                            所有已保存的問題（共 {savedQuestions.length} 條）
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!isAdding && (
                            <button
                                onClick={() => {
                                    setIsSavedListExpanded(true);
                                    setIsAdding(true);
                                }}
                                className="bg-[#4A6E85] hover:bg-[#3D5B70] text-white font-black text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                                id="btn-add-q-inline"
                            >
                                <span>＋ 手動新增問題</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsSavedListExpanded(!isSavedListExpanded)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer"
                        >
                            {isSavedListExpanded ? '收起 ▲' : '展開 ▼'}
                        </button>
                    </div>
                </div>

                {isSavedListExpanded && (
                    <div className="space-y-3 animate-soft">
                        {/* 新增問題編輯框 */}
                        {isAdding && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-soft">
                                <input
                                    type="text"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#4A6E85] bg-white text-xs sm:text-sm font-bold shadow-inner text-slate-800"
                                    placeholder="請輸入想保存的問題，如「食藥後半小時頭暈正常嗎？」"
                                    value={newQuestionText}
                                    onChange={e => setNewQuestionText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddQuestion();
                                        }
                                    }}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewQuestionText('');
                                        }}
                                        className="bg-white border border-slate-200 text-slate-500 font-bold text-[10px] px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleAddQuestion}
                                        disabled={!newQuestionText.trim()}
                                        className="bg-[#4A6E85] text-white font-black text-[10px] px-3 py-1 rounded-lg hover:bg-[#3D5B70] disabled:bg-slate-200 cursor-pointer"
                                    >
                                        確定新增
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 問題列表 */}
                        {savedQuestions.length === 0 ? (
                            <div className="text-center py-6 space-y-2">
                                <span className="text-3xl block">📭</span>
                                <p className={`text-slate-400 font-extrabold ${isLargeFont ? 'text-base' : 'text-xs'}`}>
                                    老友記，你暫時未有保存任何問題。
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto">
                                    可以在「問問 AI」或問診建議中，點擊「保存問題」收納到這裡！
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                {savedQuestions.map((q, idx) => {
                                    const isEditing = editingIndex === idx;
                                    const isInNextList = nextClinicQuestions.some(item => item.trim() === q.trim());

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                                isEditing 
                                                    ? 'bg-slate-50 border-[#4A6E85] ring-1 ring-[#4A6E85]/20' 
                                                    : isInNextList
                                                        ? 'bg-emerald-50/40 border-emerald-200'
                                                        : 'bg-white border-slate-100 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className="flex-grow flex items-start gap-2.5 min-w-0">
                                                <div className={`rounded-lg ${isInNextList ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-[#4A6E85]'} font-black flex items-center justify-center shrink-0 w-6 h-6 text-xs mt-0.5`}>
                                                    {idx + 1}
                                                </div>

                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full p-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#4A6E85] bg-white font-bold text-xs sm:text-sm text-slate-800"
                                                        value={editingText}
                                                        onChange={e => setEditingText(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleSaveEdit();
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div className="space-y-0.5 min-w-0">
                                                        <p className={`text-slate-800 font-extrabold leading-snug break-words ${isLargeFont ? 'text-lg' : 'text-xs sm:text-[13px]'}`}>
                                                            {q}
                                                        </p>
                                                        {isInNextList && (
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-md inline-block">
                                                                ✓ 已在下次問診清單
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 操作按鈕 */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingIndex(null);
                                                                setEditingText('');
                                                            }}
                                                            className="bg-white border border-slate-200 text-slate-500 font-bold text-[10px] px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            取消
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            disabled={!editingText.trim()}
                                                            className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md hover:bg-emerald-700 cursor-pointer"
                                                        >
                                                            儲存
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => toggleNextClinicQuestion(q)}
                                                            className={`font-black text-[10px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                                                isInNextList
                                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                            title={isInNextList ? "從下次問診移除" : "加入下次問診"}
                                                        >
                                                            {isInNextList ? '✓ 已選入' : '＋ 入問診'}
                                                        </button>
                                                        <button
                                                            onClick={() => startEditing(idx, q)}
                                                            className="text-[#4A6E85] hover:bg-[#4A6E85]/10 font-bold text-[10px] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                                            title="編輯問題"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuestion(idx)}
                                                            className="text-rose-500 hover:bg-rose-50 font-bold text-[10px] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                                            title="刪除問題"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
