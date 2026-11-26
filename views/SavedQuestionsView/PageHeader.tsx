import { View } from '../../utils/types';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';

export function PageHeader({vm}: {vm: SavedQuestionsViewModel}) {
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
        </>
    );
}
