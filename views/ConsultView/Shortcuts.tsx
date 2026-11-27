import type {ConsultViewModel} from './useConsultViewModel';
import {Icon, type UiIconName} from '../../components/ui';
import {SHORTCUT_QUESTIONS} from './consultText';

/** Display-only line icon for a shortcut chip (by position; the sent text is untouched). */
const SHORTCUT_ICONS: UiIconName[] = ['chart', 'warning', 'meal', 'medication', 'eye'];
/** S4b: topic cards in the domain pastels (display only, by position). */
const SHORTCUT_TONES = ['sky', 'lilac', 'sage', 'sun', 'rose'];

/** Presentation titles/descriptions for the topic matrix. The message sent
 *  on tap is still SHORTCUT_QUESTIONS[i].text (consultText.ts is untouched). */
const TOPIC_CARDS: ReadonlyArray<{ title: string; desc: string }> = [
    { title: '解讀血糖數據', desc: '了解近期血糖變化' },
    { title: '突發情況處理', desc: '血糖過高或過低' },
    { title: '飲食建議', desc: '日常飲食怎樣選' },
    { title: '藥物副作用', desc: '了解常見副作用' },
    { title: '常見併發症', desc: '眼底或腎病變預防' },
];

/** Shortcut questions shown before the first exchange. */
export function Shortcuts({vm}: {vm: ConsultViewModel}) {
    const {chatMessages, handleSendChatMessage} = vm;
    return (
        <>
            {chatMessages.length <= 1 && (
                <div className="ds-consult-welcome">
                    <div className="ds-consult-guide">
                        <span className="ds-consult-guide-orb" aria-hidden="true" />
                        <h3 className="ds-consult-guide-title">今天想問甚麼？</h3>
                        <p className="ds-consult-guide-desc">選個主題，或直接輸入問題。</p>
                    </div>
                    <div className="ds-consult-shortcuts">
                        <div className="ds-consult-shortcut-list">
                            {SHORTCUT_QUESTIONS.map((topic, i) => {
                                const card = TOPIC_CARDS[i];
                                const title = card?.title ?? topic.label;
                                const desc = card?.desc ?? '';
                                return (
                                    <button
                                        type="button"
                                        key={i}
                                        onClick={() => handleSendChatMessage(topic.text)}
                                        data-verify={`shortcut-${i}`}
                                        aria-label={desc ? `${title}：${desc}` : title}
                                        className={`ds-consult-shortcut ds-control is-${SHORTCUT_TONES[i] || 'sky'}`}
                                    >
                                        <span className="ds-consult-shortcut-mark" aria-hidden="true">
                                            <Icon name={SHORTCUT_ICONS[i] || 'consult'} />
                                        </span>
                                        <span className="ds-consult-shortcut-go" aria-hidden="true">
                                            <Icon name="forward" />
                                        </span>
                                        <span className="ds-consult-shortcut-label">{title}</span>
                                        {desc && <span className="ds-consult-shortcut-desc">{desc}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
