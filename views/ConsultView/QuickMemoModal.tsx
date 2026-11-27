import {useEffect, useRef} from 'react';
import type {ConsultViewModel} from './useConsultViewModel';
import {View} from '../../utils/types';
import {UI_ICON_DEFAULTS, uiIcons} from '../../components/ui';

export function QuickMemoModal({vm}: {vm: ConsultViewModel}) {
    const {
        isQuickMemoOpen,
        isQuickMemoListening,
        profile,
        quickMemoInput,
        saveDoctorQuestions,
        setIsQuickMemoOpen,
        setQuickMemoInput,
        setView,
        showToast,
        toggleQuickMemoVoice
    } = vm;

    // Keyboard basics only: move focus into the dialog when it opens, close on
    // Escape (same effect as 取消), and return focus to the opener on close.
    // Tab is deliberately not trapped so the global voice mic stays reachable.
    const dialogRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isQuickMemoOpen) return;
        const opener = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus({preventScroll: true});
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsQuickMemoOpen(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (opener && opener.isConnected) opener.focus({preventScroll: true});
        };
    }, [isQuickMemoOpen, setIsQuickMemoOpen]);

    if (!isQuickMemoOpen) return null;

    const icon = {size: UI_ICON_DEFAULTS.size, strokeWidth: UI_ICON_DEFAULTS.strokeWidth, 'aria-hidden': true} as const;
    const NoteIcon = uiIcons.note;
    const CloseIcon = uiIcons.close;
    const AddIcon = uiIcons.add;
    const MicIcon = isQuickMemoListening ? uiIcons.stop : uiIcons.mic;
    const CheckIcon = uiIcons.check;
    const Chevron = uiIcons.forward;
    const canSave = Boolean(quickMemoInput.trim());

    return (
            <div className="ds-consult-memo-backdrop">
                <div ref={dialogRef} tabIndex={-1} className="ds-consult-memo-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-memo-title">
                    <div className="ds-consult-memo-head">
                        <span className="ds-consult-memo-mark"><NoteIcon {...icon} /></span>
                        <div className="ds-consult-memo-titles">
                            <h3 id="quick-memo-title" className="t-title">
                                隨手記下想問醫生的問題
                            </h3>
                            <p className="t-caption t-ink-3">
                                聊天時想起任何疑惑，隨時寫下，覆診時自動匯出！
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsQuickMemoOpen(false)}
                            aria-label="關閉"
                            className="ds-icon-btn ds-icon-btn-plain ds-control"
                        >
                            <CloseIcon {...icon} />
                        </button>
                    </div>

                    {/* 輸入框與語音按鈕（按鈕放在框下，不再壓住文字） */}
                    <div className="ds-consult-memo-input">
                        <label htmlFor="quick-memo-input" className="ds-sr-only">想問醫生的問題</label>
                        <textarea
                            id="quick-memo-input"
                            value={quickMemoInput}
                            onChange={(e) => setQuickMemoInput(e.target.value)}
                            placeholder="在此輸入您想問醫生的問題（例如：想問下醫生呢隻藥會唔會令我頭暈...）"
                            rows={3}
                            className="ds-consult-field t-body ds-control"
                        />
                        <button
                            type="button"
                            onClick={toggleQuickMemoVoice}
                            aria-pressed={isQuickMemoListening}
                            className={`ds-consult-tool ds-consult-voice ds-control${isQuickMemoListening ? ' is-listening' : ''}`}
                        >
                            <MicIcon {...icon} />
                            <span className="t-label">{isQuickMemoListening ? "正在聆聽..." : "語音輸入"}</span>
                        </button>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="ds-consult-memo-actions">
                        <button
                            type="button"
                            onClick={() => {
                                if (!quickMemoInput.trim()) return;
                                saveDoctorQuestions([quickMemoInput.trim()]);
                                setQuickMemoInput('');
                                setIsQuickMemoOpen(false);
                                showToast("已存入「問題紀錄」清單 🔖");
                            }}
                            disabled={!quickMemoInput.trim()}
                            className={`ds-consult-primary ds-control${canSave ? '' : ' is-idle'}`}
                        >
                            <CheckIcon {...icon} />
                            <span>保存到問診清單</span>
                        </button>
                        <div className="ds-consult-memo-secondary">
                            <button
                                type="button"
                                onClick={() => setIsQuickMemoOpen(false)}
                                className="ds-btn ds-btn-ghost ds-control"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsQuickMemoOpen(false);
                                    setView(View.SavedQuestions);
                                }}
                                className="ds-btn ds-btn-ghost ds-control ds-consult-memo-all"
                            >
                                <span>查看全部已存問題 ({(profile.savedDoctorQuestions || []).length})</span>
                                <Chevron {...icon} size={18} />
                            </button>
                        </div>
                    </div>

                    {/* 常用提問靈感 Chips — R2-6: below the input and 保存 (as on 被仿侧, the
                        field and its save come first); a tap still fills the field above. */}
                    <div className="ds-consult-memo-presets">
                        <p className="t-body-strong t-ink-2">常見問診靈感（點擊填入）：</p>
                        {[
                            "想向醫生請教服藥時間可否配合生活作息調整？",
                            "最近服藥後有些腸胃不適，是否有替代方案？",
                            "想諮詢下次化驗是否需要加驗糖化血色素或腎功能？",
                            "平時血糖波動較大，是否適合使用連續血糖儀 (CGM)？"
                        ].map((preset, pIdx) => (
                            <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                    setQuickMemoInput(preset);
                                    // R2-6: the field sits above the inspiration list — bring it
                                    // (and 保存 under it) back into view so the filled text is seen.
                                    requestAnimationFrame(() => {
                                        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                                        document.getElementById('quick-memo-input')?.scrollIntoView({block: 'nearest', behavior: reduce ? 'auto' : 'smooth'});
                                    });
                                }}
                                className="ds-consult-memo-preset ds-control"
                            >
                                <AddIcon {...icon} size={18} />
                                <span className="t-body">{preset}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
    );
}
