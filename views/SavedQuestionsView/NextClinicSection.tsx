import {BottomSheet, Button, Card, EmptyState, Icon} from '../../components/ui';
import {focusOnMount} from '../../components/shell/keyboard';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import {CountPill, IndexBadge, SectionHead} from './questionUi';

export function NextClinicSection({vm}: {vm: SavedQuestionsViewModel}) {
    const {
        nextClinicQuestions, nextClinicDate, profile,
        isAddingNextQ, setIsAddingNextQ,
        newNextQText, setNewNextQText,
        isEditingDate, setIsEditingDate,
        tempClinicDate, setTempClinicDate,
        toggleNextClinicQuestion,
        handleSaveClinicDate,
        handleAddNextClinicQuestion,
    } = vm;
    const cancelDate = () => {
        setTempClinicDate(nextClinicDate);
        setIsEditingDate(false);
    };
    return (
        <Card className="ds-sq-card ds-sq-clinic" aria-label="下次問診清單">
            {/* 【2. 下次問診清單 & 覆診日期】：展示病人精選的就診問題與提醒設定 */}
            <SectionHead
                icon="clinic"
                tone="sage"
                title="下次問診清單"
            >
                <CountPill>已挑選 {nextClinicQuestions.length} 題</CountPill>
                <p className="t-caption t-ink-2">將在首頁同步顯示，就診時可直接照著問醫生！</p>
            </SectionHead>

            {/* 下次覆診日期設定 */}
            <div className="ds-sq-date">
                <div className="ds-sq-date-row">
                    <div className="ds-sq-date-text">
                        <span className="t-caption t-ink-2">下次問診時間：</span>
                        <span className={nextClinicDate ? 't-title ds-sq-date-value' : 't-body-strong t-ink-2'}>
                            <Icon name="calendar" size={20} />
                            {nextClinicDate || '未設定問診日期'}
                        </span>
                        {nextClinicDate && (profile.nextClinicTime || profile.nextClinicLocation) && (
                            <span className="t-caption t-ink-2 ds-sq-date-meta">
                                {[profile.nextClinicTime, profile.nextClinicLocation].filter(Boolean).join(' · ')}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setTempClinicDate(nextClinicDate || new Date().toISOString().split('T')[0]);
                            setIsEditingDate(true);
                        }}
                    >
                        <Icon name="edit" size={20} />
                        <span>{nextClinicDate ? '修改日期' : '設定日期'}</span>
                    </Button>
                </div>
            </div>

            {/* S4: the date is picked in a bottom sheet (same draft, same 保存 / 取消). */}
            <BottomSheet
                open={isEditingDate}
                onClose={cancelDate}
                title="設定覆診日期"
                hideClose
                footer={
                    <>
                        <Button variant="secondary" onClick={cancelDate}>取消</Button>
                        <Button onClick={handleSaveClinicDate}>保存</Button>
                    </>
                }
            >
                <div className="ds-sq-date-edit">
                    <label className="ds-sq-field">
                        <span className="t-label">下次問診時間：</span>
                        <input
                            type="date"
                            value={tempClinicDate}
                            onChange={e => setTempClinicDate(e.target.value)}
                            className="ds-field-control ds-control"
                        />
                    </label>
                </div>
            </BottomSheet>

            {/* 下次問診清單列表 */}
            {nextClinicQuestions.length === 0 ? (
                <EmptyState className="ds-sq-empty" icon="calendar" tone="sage" title="目前尚未挑選下次問診問題。">
                    <p className="t-caption">可在上方「AI 總結」或下方「所有保存問題」中點擊加入！</p>
                </EmptyState>
            ) : (
                <ol className="ds-sq-list">
                    {nextClinicQuestions.map((q, idx) => (
                        <li key={idx} className="ds-sq-item">
                            <IndexBadge n={idx + 1} active />
                            <p className="t-body-strong ds-sq-item-text">{q}</p>
                            <button
                                type="button"
                                onClick={() => toggleNextClinicQuestion(q)}
                                className="ds-btn ds-btn-ghost ds-control ds-sq-remove"
                                title="從下次問診清單移除"
                            >
                                <Icon name="close" size={20} />
                                <span>移除</span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}

            {/* 自訂新增問診問題 */}
            {isAddingNextQ ? (
                <div className="ds-sq-form" data-keyboard-reveal>
                    <textarea
                        className="ds-field-control ds-control ds-sq-textarea"
                        rows={2}
                        enterKeyHint="done"
                        placeholder="輸入想加入下次問診清單的問題..."
                        aria-label="自訂加入下次問診清單的問題"
                        value={newNextQText}
                        onChange={e => setNewNextQText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNextClinicQuestion();
                            }
                        }}
                        ref={focusOnMount}
                    />
                    <div className="ds-sq-actions">
                        <Button onClick={handleAddNextClinicQuestion} disabled={!newNextQText.trim()}>
                            確定加入
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsAddingNextQ(false);
                                setNewNextQText('');
                            }}
                        >
                            取消
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="secondary" fullWidth onClick={() => setIsAddingNextQ(true)}>
                    <Icon name="add" />
                    <span>自訂加入</span>
                </Button>
            )}
        </Card>
    );
}
