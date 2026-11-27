import {Button, Card, confirmThen, cx, Icon} from '../../components/ui';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import {CountPill, ExpandToggle, IndexBadge, SectionHead} from './questionUi';

export function SavedListSection({vm}: {vm: SavedQuestionsViewModel}) {
    const {
        savedQuestions, nextClinicQuestions,
        isAdding, setIsAdding,
        newQuestionText, setNewQuestionText,
        editingIndex, setEditingIndex,
        editingText, setEditingText,
        isSavedListExpanded, setIsSavedListExpanded,
        toggleNextClinicQuestion,
        handleAddQuestion,
        handleDeleteQuestion,
        startEditing,
        handleSaveEdit,
    } = vm;
    return (
        <Card className="ds-sq-card ds-sq-saved" aria-label="所有已保存的問題">
            {/* 【3. 所有保存的問題記錄】：完整的保存記錄庫（可展開/收起） */}
            <SectionHead
                icon="savedQuestions"
                tone="mist"
                title="所有已保存的問題"
                aside={<ExpandToggle expanded={isSavedListExpanded} onClick={() => setIsSavedListExpanded(!isSavedListExpanded)} label="所有已保存的問題" />}
            >
                <CountPill tone="muted">共 {savedQuestions.length} 條</CountPill>
            </SectionHead>

            {!isAdding && (
                <button
                    type="button"
                    onClick={() => {
                        setIsSavedListExpanded(true);
                        setIsAdding(true);
                    }}
                    className="ds-btn ds-btn-secondary ds-btn-block ds-control"
                    id="btn-add-q-inline"
                >
                    <Icon name="add" />
                    <span>手動新增問題</span>
                </button>
            )}

            {isSavedListExpanded && (
                <div className="ds-sq-body">
                    {/* 新增問題編輯框 */}
                    {isAdding && (
                        <div className="ds-sq-form">
                            <input
                                type="text"
                                className="ds-field-control ds-control"
                                placeholder="請輸入想保存的問題，如「食藥後半小時頭暈正常嗎？」"
                                aria-label="手動新增問題"
                                value={newQuestionText}
                                onChange={e => setNewQuestionText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddQuestion();
                                    }
                                }}
                            />
                            <div className="ds-sq-actions">
                                <Button onClick={handleAddQuestion} disabled={!newQuestionText.trim()}>
                                    確定新增
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewQuestionText('');
                                    }}
                                >
                                    取消
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 問題列表 */}
                    {savedQuestions.length === 0 ? (
                        <div className="ds-sq-empty">
                            <p className="t-body-strong">老友記，你暫時未有保存任何問題。</p>
                            <p className="t-caption t-ink-2">可以在「問問 AI」或問診建議中，點擊「保存問題」收納到這裡！</p>
                        </div>
                    ) : (
                        <ol className="ds-sq-list">
                            {savedQuestions.map((q, idx) => {
                                const isEditing = editingIndex === idx;
                                const isInNextList = nextClinicQuestions.some(item => item.trim() === q.trim());

                                return (
                                    <li key={idx} className={cx('ds-sq-saved-item', isEditing && 'is-editing', isInNextList && 'is-picked')}>
                                        <div className="ds-sq-saved-main">
                                            <IndexBadge n={idx + 1} active={isInNextList} />
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="ds-field-control ds-control"
                                                    aria-label="編輯問題"
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
                                                <div className="ds-sq-saved-text">
                                                    <p className="t-body-strong">{q}</p>
                                                    {isInNextList && (
                                                        <CountPill>
                                                            <Icon name="check" size={16} />
                                                            已在下次問診清單
                                                        </CountPill>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 操作按鈕 */}
                                        <div className="ds-sq-actions">
                                            {isEditing ? (
                                                <>
                                                    <Button onClick={handleSaveEdit} disabled={!editingText.trim()}>
                                                        儲存
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingIndex(null);
                                                            setEditingText('');
                                                        }}
                                                    >
                                                        取消
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleNextClinicQuestion(q)}
                                                        aria-pressed={isInNextList}
                                                        className={cx('ds-btn ds-control ds-sq-pick-btn', isInNextList ? 'ds-btn-secondary' : 'ds-sq-btn-outline')}
                                                        title={isInNextList ? "從下次問診移除" : "加入下次問診"}
                                                    >
                                                        <Icon name={isInNextList ? 'check' : 'add'} size={20} />
                                                        <span>{isInNextList ? '已選入' : '入問診'}</span>
                                                    </button>
                                                    <span className="ds-sq-actions-spacer" />
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(idx, q)}
                                                        className="ds-icon-btn ds-icon-btn-plain ds-control"
                                                        title="編輯問題"
                                                        aria-label="編輯問題"
                                                    >
                                                        <Icon name="edit" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmThen('刪除這個問題？', '刪除後無法復原。', '刪除', () => handleDeleteQuestion(idx))}
                                                        className="ds-icon-btn ds-icon-btn-plain ds-control ds-sq-delete"
                                                        title="刪除問題"
                                                        aria-label="刪除問題"
                                                    >
                                                        <Icon name="trash" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            )}
        </Card>
    );
}
