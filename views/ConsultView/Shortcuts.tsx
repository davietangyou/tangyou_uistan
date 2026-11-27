import type {ConsultViewModel} from './useConsultViewModel';
import {Icon, type UiIconName} from '../../components/ui';
import {SHORTCUT_QUESTIONS} from './consultText';

/** Display-only line icon for a shortcut chip (by position; the sent text is untouched). */
const SHORTCUT_ICONS: UiIconName[] = ['chart', 'warning', 'meal', 'medication', 'eye'];
/** S4b: topic cards in the domain pastels (display only, by position). */
const SHORTCUT_TONES = ['sky', 'lilac', 'sage', 'sun', 'sky'];

/** Shortcut labels keep their emoji in consultText.ts; the chip shows a line icon instead. */
function shortcutLabelText(label: string) {
    return label.replace(/^[^\s]+\s+/, '');
}

/** Shortcut questions shown before the first exchange. */
export function Shortcuts({vm}: {vm: ConsultViewModel}) {
    const {chatMessages, handleSendChatMessage} = vm;
    return (
        <>
            {/* 常用話題快捷按鍵 */}
            {chatMessages.length <= 1 && (
                <div className="ds-consult-shortcuts">
                    <p className="t-label ds-consult-shortcuts-title">快捷提問：</p>
                    <div className="ds-consult-shortcut-list">
                        {SHORTCUT_QUESTIONS.map((topic, i) => (
                            <button
                                type="button"
                                key={i}
                                onClick={() => handleSendChatMessage(topic.text)}
                                className={`ds-consult-shortcut ds-control is-${SHORTCUT_TONES[i] || 'sky'}`}
                            >
                                <span className="ds-consult-shortcut-mark" aria-hidden="true"><Icon name={SHORTCUT_ICONS[i] || 'consult'} /></span>
                                <span className="ds-consult-shortcut-label">{shortcutLabelText(topic.label)}</span>
                                <Icon name="forward" className="ds-consult-shortcut-go" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
