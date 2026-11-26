import ReactMarkdown from 'react-markdown';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';

export function AnalysisSection({vm}: {vm: SavedQuestionsViewModel}) {
    const {
        profile, setProfile, setView, isLargeFont,
        savedQuestions, nextClinicQuestions, nextClinicDate,
        isAdding, setIsAdding,
        newQuestionText, setNewQuestionText,
        editingIndex, setEditingIndex,
        editingText, setEditingText,
        isAddingNextQ, setIsAddingNextQ,
        newNextQText, setNewNextQText,
        isEditingDate, setIsEditingDate,
        tempClinicDate, setTempClinicDate,
        analysisLoading, setAnalysisLoading,
        analysisError, setAnalysisError,
        analysisResult, setAnalysisResult,
        isAnalysisExpanded, setIsAnalysisExpanded,
        isSavedListExpanded, setIsSavedListExpanded,
        checkedPrepItems, setCheckedPrepItems,
        handleRefreshAnalysis,
        toggleNextClinicQuestion,
        handleAddQuestion,
        handleDeleteQuestion,
        startEditing,
        handleSaveEdit,
        handleSaveClinicDate,
        handleAddNextClinicQuestion,
    } = vm;
    return (
        <>
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

                        {analysisError && !analysisLoading && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="text-xl shrink-0">⚠️</span>
                                    <p className={`text-amber-900 font-bold leading-relaxed ${isLargeFont ? 'text-base' : 'text-xs sm:text-sm'}`}>
                                        {analysisError}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRefreshAnalysis}
                                    className="shrink-0 bg-[#4A6E85] hover:bg-[#3d5b6e] text-white font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all text-xs sm:text-sm"
                                >
                                    🔄 再試一次
                                </button>
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
        </>
    );
}
