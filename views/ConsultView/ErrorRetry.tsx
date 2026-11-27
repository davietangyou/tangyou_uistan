import type {ConsultViewModel} from './useConsultViewModel';
import type {ChatMessage} from '../../utils/types';
import {Button, Icon} from '../../components/ui';
import {PREFERENCE_SUBMITTED_MARKER} from './consultText';

/**
 * R2-5: under the newest "未能完成回覆" card, one tap sends the same question
 * again — the same handler and the same text as the user typing it again (as
 * 問題紀錄's AI 總結 error already offers 再試一次). Shown only when the
 * composer is empty and holds no photo, so a draft is never replaced, and
 * only for a plain text question (no photo, not a preference submission).
 */
export function ErrorRetry({vm, msg, index}: {vm: ConsultViewModel; msg: ChatMessage; index: number}) {
    const {chatMessages, chatLoading, chatInput, attachedImage, handleSendChatMessage} = vm;
    if (!msg.isError || index !== chatMessages.length - 1 || chatLoading) return null;
    if (chatInput.trim() || attachedImage) return null;
    const question = chatMessages[index - 1];
    if (!question || question.role !== 'user' || question.imageAttachment || !question.content?.trim()) return null;
    if (question.content.includes(PREFERENCE_SUBMITTED_MARKER)) return null;
    return (
        <div className="ds-consult-retry">
            <Button variant="secondary" onClick={() => handleSendChatMessage(question.content)}>
                <Icon name="reset" />
                <span>再試一次</span>
            </Button>
        </div>
    );
}
