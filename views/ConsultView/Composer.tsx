import type {ConsultViewModel} from './useConsultViewModel';
import {Icon} from '../../components/ui';

/** Hidden file input and the composer (attachment preview, textarea, tools, send). */
export function Composer({vm}: {vm: ConsultViewModel}) {
    const {attachedImage, chatInput, chatLoading, fileInputRef, handleSendChatMessage, isListening, setAttachedImage, setChatInput, toggleVoiceInput} = vm;

    const canSend = !((!chatInput.trim() && !attachedImage) || chatLoading);

    return (
        <>
            {/* 隱藏的檔案/相機輸入 */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const result = event.target?.result as string;
                        if (result) {
                            const base64Data = result.split(',')[1];
                            setAttachedImage({
                                base64: base64Data,
                                mimeType: file.type || 'image/jpeg',
                                previewUrl: result,
                                name: file.name
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                }}
            />

            {/* 對話輸入區域：文字框在上，工具列在下，不再互相覆蓋 */}
            <div className="ds-consult-composer">
                {/* 已選相片預覽條 */}
                {attachedImage && (
                    <div className="ds-consult-attach">
                        <img
                            src={attachedImage.previewUrl}
                            alt="預覽"
                            referrerPolicy="no-referrer"
                        />
                        <div className="ds-consult-attach-text">
                            <p className="t-body-strong">
                                已選取藥物/處方相片
                            </p>
                            <p className="t-caption">
                                點擊發送將自動辨識藥名、劑量並進行多模態問答
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAttachedImage(null)}
                            aria-label="移除相片"
                            title="移除相片"
                            className="ds-icon-btn ds-icon-btn-plain ds-control ds-consult-attach-remove"
                        >
                            <Icon name="close" />
                        </button>
                    </div>
                )}

                <div className="ds-consult-capsule">
                    {/* 相機/相片上傳按鈕 */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="拍照或上傳相片/食物/藥物包裝"
                        aria-label="拍照或上傳相片"
                        className="ds-consult-tool ds-consult-upload ds-control"
                    >
                        <Icon name="camera" />
                    </button>

                    <label htmlFor="chat-input-box" className="ds-sr-only">輸入您的控糖疑問</label>
                    <textarea
                        id="chat-input-box"
                        data-verify="chat-input"
                        className="ds-consult-input t-body ds-control"
                        rows={1}
                        placeholder={attachedImage ? "可補充您的提問（例如：我食呢隻藥成日胃唔舒服，有冇影響？）..." : "輸入問題…"}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChatMessage(chatInput);
                            }
                        }}
                    />

                    <div className="ds-consult-tools">
                        {/* 語音輸入按鈕 */}
                        <button
                            type="button"
                            onClick={toggleVoiceInput}
                            title={isListening ? "正在聆聽語音... 點擊結束" : "點擊開始語音輸入"}
                            aria-label={isListening ? "正在聆聽語音... 點擊結束" : "點擊開始語音輸入"}
                            aria-pressed={isListening}
                            className={`ds-consult-tool ds-consult-voice ds-control${isListening ? ' is-listening' : ''}`}
                        >
                            <Icon name={isListening ? 'stop' : 'mic'} />
                            <span className="ds-sr-only">
                                {isListening ? '錄音中... 點擊結束' : '語音輸入'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSendChatMessage(chatInput)}
                            data-verify="chat-send"
                            disabled={(!chatInput.trim() && !attachedImage) || chatLoading}
                            className={`ds-consult-send ds-control${canSend ? '' : ' is-idle'}`}
                            title="發送提問"
                            aria-label="發送提問"
                        >
                            <Icon name="send" />
                            <span className="ds-consult-send-label ds-sr-only">發送</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
