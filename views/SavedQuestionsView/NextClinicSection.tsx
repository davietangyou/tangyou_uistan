import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';

export function NextClinicSection({vm}: {vm: SavedQuestionsViewModel}) {
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
        </>
    );
}
