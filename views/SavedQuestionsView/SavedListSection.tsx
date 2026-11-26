import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';

export function SavedListSection({vm}: {vm: SavedQuestionsViewModel}) {
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
        </>
    );
}
