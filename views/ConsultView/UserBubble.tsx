import type {ChatMessage} from '../../utils/types';
import ReactMarkdown from 'react-markdown';
import {Icon} from '../../components/ui';
import {PREFERENCE_SUBMITTED_MARKER} from './consultText';

/** User message bubble: optional photo, then the submitted-preference chips or the markdown text. */
export function UserBubble({msg}: {msg: ChatMessage}) {
    return (
        <>
            <div className="ds-consult-bubble t-body">
                {/* 附加圖片呈現 */}
                {msg.imageAttachment?.previewUrl && (
                    <div className="ds-consult-bubble-photo">
                        <img
                            src={msg.imageAttachment.previewUrl}
                            alt="藥物相片"
                            referrerPolicy="no-referrer"
                        />
                        <div className="ds-consult-bubble-photo-cap t-caption">
                            <Icon name="camera" size={16} />
                            <span>已附帶藥物 / 處方相片分析</span>
                        </div>
                    </div>
                )}

                {msg.content.includes(PREFERENCE_SUBMITTED_MARKER) ? (
                    <div className="ds-consult-prefsent">
                        <div className="ds-consult-prefsent-head t-body-strong">
                            <Icon name="target" size={18} />
                            <span>已確認我的控糖偏好考量：</span>
                        </div>
                        <div className="ds-consult-prefsent-chips">
                            {(() => {
                                const matches = [...msg.content.matchAll(/【(.*?)】/g)].map(m => m[1]);
                                if (matches.length === 0) return <span className="t-caption">（無選擇）</span>;

                                return matches.map((keyword, kIdx) => {
                                    const lines = msg.content.split('\n');
                                    const matchingLine = lines.find((l: string) => l.includes(`【${keyword}】`)) || '';
                                    const starsMatch = matchingLine.match(/重要程度：(⭐+)/);
                                    const stars = starsMatch ? starsMatch[1] : '';

                                    return (
                                        <span 
                                            key={kIdx} 
                                            className="ds-consult-prefsent-chip t-body-strong"
                                        >
                                            <Icon name="check" size={16} />
                                            <span>{keyword}</span>
                                            {stars && (
                                                <span className="ds-consult-prefsent-stars t-caption">
                                                    {stars}
                                                </span>
                                            )}
                                        </span>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="ds-consult-md">
                        <ReactMarkdown
                            components={{
                                p: ({node, ...props}) => <p {...props} />,
                                strong: ({node, ...props}) => <strong {...props} />,
                                ul: ({node, ...props}) => <ul {...props} />,
                                li: ({node, ...props}) => <li {...props} />,
                            }}
                        >
                            {msg.content ? msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n') : ''}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </>
    );
}
