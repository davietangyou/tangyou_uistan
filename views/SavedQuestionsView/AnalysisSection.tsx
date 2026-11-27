import ReactMarkdown from 'react-markdown';
import {Button, Card, cx, Icon} from '../../components/ui';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import {CountPill, ExpandToggle, IndexBadge, SectionHead} from './questionUi';

export function AnalysisSection({vm}: {vm: SavedQuestionsViewModel}) {
    const {
        savedQuestions, nextClinicQuestions,
        analysisLoading,
        analysisError,
        analysisResult,
        isAnalysisExpanded, setIsAnalysisExpanded,
        handleRefreshAnalysis,
        toggleNextClinicQuestion,
    } = vm;
    return (
        <Card className="ds-sq-card ds-sq-analysis" aria-label="AI 總結">
            {/* 【1. AI 總結放在前面】：總結 3-5 類別問題，並提供勾選挑選加入下次問診清單 */}
            <SectionHead
                icon="askAi"
                tone="lavender"
                title="AI 總結"
                aside={<ExpandToggle expanded={isAnalysisExpanded} onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)} label="AI 總結" />}
            />

            {isAnalysisExpanded && (
                <div className="ds-sq-body">
                    {analysisLoading && (
                        <div className="ds-sq-state" role="status">
                            <Icon name="loading" size={28} className="ds-sq-spin" />
                            <p className="t-body-strong">AI 正在為您智慧歸納常問類別與就診建議，請稍候...</p>
                        </div>
                    )}

                    {analysisError && !analysisLoading && (
                        <div className="ds-sq-error" role="alert">
                            <div className="ds-sq-error-text">
                                <Icon name="warning" className="ds-sq-error-icon" />
                                <p className="t-body">{analysisError}</p>
                            </div>
                            <Button variant="primary" onClick={handleRefreshAnalysis}>
                                <Icon name="reset" />
                                <span>再試一次</span>
                            </Button>
                        </div>
                    )}

                    {savedQuestions.length === 0 && !analysisLoading && (
                        <div className="ds-sq-empty">
                            <p className="t-body-strong">暫無保存的問題記錄。</p>
                            <p className="t-caption t-ink-2">
                                在「問問 AI」對話或下方「手動新增」想問醫生的問題，AI 就會在此為您自動歸納出 3-5 類別重點與精選提問！
                            </p>
                        </div>
                    )}

                    {savedQuestions.length > 0 && !analysisResult && !analysisLoading && (
                        <div className="ds-sq-ready">
                            <p className="t-title">已保存 {savedQuestions.length} 則想問醫生的問題</p>
                            <p className="t-body t-ink-2">
                                點擊下方按鈕，AI 將歸納您的提問類別、分析核心關注點，並挑選重要問題推薦至「下次問診清單」！
                            </p>
                            <Button fullWidth onClick={handleRefreshAnalysis} title="開始運行 AI 總結">
                                <Icon name="askAi" />
                                <span>點擊開始 AI 總結</span>
                            </Button>
                        </div>
                    )}

                    {analysisResult && !analysisLoading && (
                        <div className="ds-sq-result">
                            {/* 整體摘要 */}
                            <div className="ds-sq-summary">
                                <h4 className="t-label ds-sq-sub">
                                    <Icon name="insight" />
                                    <span>核心關注概述</span>
                                </h4>
                                <div className="t-body ds-sq-markdown markdown-body">
                                    <ReactMarkdown
                                        components={{
                                            p: ({node, ...props}) => <p className="whitespace-pre-line" {...props} />,
                                            ul: ({node, ...props}) => <ul className="whitespace-pre-line" {...props} />,
                                            li: ({node, ...props}) => <li className="whitespace-pre-line" {...props} />
                                        }}
                                    >
                                        {analysisResult.summary ? analysisResult.summary.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n') : ''}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* 經常保存的 3-5 類別問題 */}
                            {analysisResult.categories && analysisResult.categories.length > 0 && (
                                <div className="ds-sq-block">
                                    <h4 className="t-label ds-sq-sub">
                                        <Icon name="records" />
                                        <span>經常保存的 {analysisResult.categories.length} 個類別問題</span>
                                    </h4>
                                    <ol className="ds-sq-list">
                                        {analysisResult.categories.map((cat, cIdx) => (
                                            <li key={cIdx} className="ds-sq-cat">
                                                <IndexBadge n={cIdx + 1} />
                                                <div className="ds-sq-cat-text">
                                                    <p className="t-body-strong">{cat.categoryName}</p>
                                                    <p className="t-caption t-ink-2">{cat.description}</p>
                                                </div>
                                                {cat.frequency && <CountPill>{cat.frequency}</CountPill>}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* 從中挑選最想問的問題保存到下次問診清單 */}
                            {analysisResult.recommendedQuestions && analysisResult.recommendedQuestions.length > 0 && (
                                <div className="ds-sq-block ds-sq-pick">
                                    <div className="ds-sq-pick-head">
                                        <h4 className="t-label ds-sq-sub">
                                            <Icon name="clinic" />
                                            <span>挑選最想問的問題保存至「下次問診清單」</span>
                                        </h4>
                                        <CountPill tone="muted">已選入 {nextClinicQuestions.length} 題</CountPill>
                                    </div>
                                    <ul className="ds-sq-list">
                                        {analysisResult.recommendedQuestions.map((item, qIdx) => {
                                            const isInNextList = nextClinicQuestions.some(
                                                nq => nq.trim() === item.question.trim()
                                            );
                                            return (
                                                <li key={qIdx} className={cx('ds-sq-rec', isInNextList && 'is-picked')}>
                                                    {item.categoryTag && (
                                                        <span className="t-caption ds-sq-tag">{item.categoryTag}</span>
                                                    )}
                                                    <p className="t-body-strong ds-sq-rec-text">{item.question}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleNextClinicQuestion(item.question)}
                                                        aria-pressed={isInNextList}
                                                        className={cx('ds-btn ds-control ds-sq-pick-btn', isInNextList ? 'ds-btn-secondary' : 'ds-btn-primary')}
                                                    >
                                                        <Icon name={isInNextList ? 'check' : 'add'} />
                                                        <span>{isInNextList ? '已加入問診' : '挑選加入'}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {savedQuestions.length > 0 && (
                                <Button variant="ghost" onClick={handleRefreshAnalysis} title="重新分析" className="ds-sq-refresh">
                                    <Icon name="reset" />
                                    <span>重新整理</span>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
