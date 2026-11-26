import type {ConsultViewModel} from './useConsultViewModel';
import type {PreferenceQuestion, PreferenceOption, PreferenceSelection, ChatOptionComparison} from '../../utils/types';
import ReactMarkdown from 'react-markdown';

export function ChatPanel({vm}: {vm: ConsultViewModel}) {
    const {
        attachedImage,
        chatInput,
        chatLoading,
        chatMessages,
        chatSavedQs,
        expandedDetailedSections,
        expandedDiscussionPoints,
        fileInputRef,
        handleClearChatHistory,
        handleSendChatMessage,
        isLargeFont,
        isListening,
        isOtherSelected,
        loading,
        otherCustomText,
        renderBulletPoints,
        saveDoctorQuestions,
        selectedPreferenceOptions,
        setAttachedImage,
        setChatInput,
        setChatSavedQs,
        setExpandedDetailedSections,
        setExpandedDiscussionPoints,
        setIsOtherSelected,
        setOtherCustomText,
        setSelectedPreferenceOptions,
        showToast,
        toggleVoiceInput
    } = vm;

    return (
            <div className="space-y-4 animate-soft pb-8">
                {/* 歡迎與對話歷史 */}
                <div className="space-y-3">
                    {chatMessages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        
                        return (
                            <div key={msg.id || index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1.5 px-2">
                                    {isUser ? (
                                        <span className="text-xs font-black text-slate-500">🙋 您</span>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">🩺</span>
                                            <span className="text-xs font-black text-[#4A6E85]">【AI小助手】</span>
                                        </div>
                                    )}
                                </div>

                                {/* 對話氣泡 / 訊息卡片 */}
                                {isUser ? (
                                    <div className={`px-5 py-3.5 rounded-2xl leading-relaxed shadow-xs transition-all ${
                                        isLargeFont ? 'text-lg md:text-xl px-7 py-5 font-black' : 'text-sm md:text-[15px] font-bold'
                                    } bg-[#4A6E85] text-white rounded-tr-none max-w-[80%]`}>
                                        {/* 附加圖片呈現 */}
                                        {msg.imageAttachment?.previewUrl && (
                                            <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 bg-black/10">
                                                <img
                                                    src={msg.imageAttachment.previewUrl}
                                                    alt="藥物相片"
                                                    referrerPolicy="no-referrer"
                                                    className="max-h-48 w-full object-cover"
                                                />
                                                <div className="p-1.5 bg-black/20 text-[10px] text-white/90 font-bold flex items-center gap-1">
                                                    <span>📷</span>
                                                    <span>已附帶藥物 / 處方相片分析</span>
                                                </div>
                                            </div>
                                        )}

                                        {msg.content.includes("我已選擇我的個人偏好") ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5 border-b border-white/20 pb-1.5 mb-2">
                                                    <span className="text-base">🎯</span>
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-100">已確認我的控糖偏好考量：</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {(() => {
                                                        const matches = [...msg.content.matchAll(/【(.*?)】/g)].map(m => m[1]);
                                                        if (matches.length === 0) return <span className="text-xs text-white/70">（無選擇）</span>;
                                                        
                                                        return matches.map((keyword, kIdx) => {
                                                            const lines = msg.content.split('\n');
                                                            const matchingLine = lines.find((l: string) => l.includes(`【${keyword}】`)) || '';
                                                            const starsMatch = matchingLine.match(/重要程度：(⭐+)/);
                                                            const stars = starsMatch ? starsMatch[1] : '';
                                                            
                                                            return (
                                                                <span 
                                                                    key={kIdx} 
                                                                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/25 text-white px-3 py-1.5 rounded-xl shadow-xs text-xs font-black hover:bg-white/15 transition-all"
                                                                >
                                                                    <span>✨</span>
                                                                    <span>{keyword}</span>
                                                                    {stars && (
                                                                        <span className="text-[10px] bg-amber-500/95 text-white px-1 py-0.5 rounded-md leading-none font-bold">
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
                                            <ReactMarkdown
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 whitespace-pre-line" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-black text-amber-200 underline decoration-amber-300/60 decoration-2 underline-offset-2" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5 whitespace-pre-line" {...props} />,
                                                    li: ({node, ...props}) => <li className="pl-1 whitespace-pre-line" {...props} />,
                                                }}
                                            >
                                                {msg.content ? msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n') : ''}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                ) : (
                                    /* AI 整合式回應卡片 (Integrated Layout) */
                                    <div className="w-full max-w-[96%] sm:max-w-[90%] bg-white rounded-2xl rounded-tl-none border border-slate-200/90 shadow-sm overflow-hidden transition-all">
                                        
                                        {/* Node 1: 分級分類安全防護卡片（純文字聯絡資訊，不設一鍵撥號避免誤觸） */}
                                        {(msg.safety?.triggered || msg.safety?.isEmergency) && (() => {
                                            const safety = msg.safety;
                                            const isMental = safety.category === 'mental_health';
                                            const severity = safety.severity || (safety.isEmergency ? 'EMERGENCY' : 'CAUTION');

                                            const theme = isMental
                                                ? {
                                                      wrapper: 'bg-indigo-50/90 border-b-2 border-indigo-300 text-indigo-950',
                                                      box: 'bg-white/95 border-indigo-100',
                                                      heading: 'text-indigo-900',
                                                      badge: 'bg-indigo-100 text-indigo-800',
                                                      contactBg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950',
                                                      icon: '💛',
                                                      tag: '暖心支援'
                                                  }
                                                : severity === 'EMERGENCY'
                                                ? {
                                                      wrapper: 'bg-rose-50 border-b-2 border-rose-500 text-rose-950',
                                                      box: 'bg-white/95 border-rose-200',
                                                      heading: 'text-rose-800',
                                                      badge: 'bg-rose-600 text-white',
                                                      contactBg: 'bg-rose-50 border-rose-200 text-rose-950',
                                                      icon: '🚨',
                                                      tag: '緊急安全警示'
                                                  }
                                                : severity === 'URGENT'
                                                ? {
                                                      wrapper: 'bg-orange-50 border-b-2 border-orange-400 text-orange-950',
                                                      box: 'bg-white/95 border-orange-200',
                                                      heading: 'text-orange-800',
                                                      badge: 'bg-orange-500 text-white',
                                                      contactBg: 'bg-orange-50 border-orange-200 text-orange-950',
                                                      icon: '⚠️',
                                                      tag: '儘快求醫提醒'
                                                  }
                                                : {
                                                      wrapper: 'bg-amber-50/85 border-b-2 border-amber-300 text-amber-950',
                                                      box: 'bg-white/95 border-amber-200/80',
                                                      heading: 'text-amber-900',
                                                      badge: 'bg-amber-200/90 text-amber-950',
                                                      contactBg: 'bg-amber-50/80 border-amber-200 text-amber-950',
                                                      icon: '🛡️',
                                                      tag: '安全處理速查'
                                                  };

                                            const steps: string[] = Array.isArray(safety.actionSteps) ? safety.actionSteps : [];
                                            const contacts: { label: string; number: string; note?: string }[] = Array.isArray(safety.contacts) ? safety.contacts : [];

                                            return (
                                                <div className={`p-4 sm:p-5 space-y-3 animate-soft ${theme.wrapper}`}>
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl sm:text-2xl">{theme.icon}</span>
                                                            <h4 className={`font-black ${isLargeFont ? 'text-lg sm:text-xl' : 'text-base md:text-lg'}`}>
                                                                {safety.title || '安全提醒'}
                                                            </h4>
                                                        </div>
                                                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${theme.badge}`}>
                                                            {theme.tag}
                                                        </span>
                                                    </div>

                                                    {safety.message && (
                                                        <p className={`font-extrabold leading-relaxed ${isLargeFont ? 'text-[16px] sm:text-[17px]' : 'text-sm'}`}>
                                                            {safety.message}
                                                        </p>
                                                    )}

                                                    {steps.length > 0 && (
                                                        <div className={`p-3.5 rounded-xl border space-y-1.5 text-slate-800 ${theme.box}`}>
                                                            <p className={`font-black ${theme.heading} ${isLargeFont ? 'text-sm sm:text-base' : 'text-xs'}`}>
                                                                建議處理步驟：
                                                            </p>
                                                            <ol className={`list-decimal pl-5 space-y-1.5 font-bold leading-relaxed ${isLargeFont ? 'text-[15px] sm:text-[16px]' : 'text-xs sm:text-[13px]'}`}>
                                                                {steps.map((step, sIdx) => (
                                                                    <li key={sIdx}>{step}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}

                                                    {contacts.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {contacts.map((c, cIdx) => (
                                                                    <div key={cIdx} className={`p-3 rounded-xl border flex flex-col justify-between gap-0.5 ${theme.contactBg}`}>
                                                                        <span className={`font-extrabold opacity-90 ${isLargeFont ? 'text-xs sm:text-sm' : 'text-[11px]'}`}>
                                                                            {c.label}
                                                                        </span>
                                                                        <span className={`font-black tracking-wider font-mono ${isLargeFont ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
                                                                            {c.number}
                                                                        </span>
                                                                        {c.note && (
                                                                            <span className="text-[11px] font-bold opacity-75">
                                                                                {c.note}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-[11px] font-bold opacity-80 leading-relaxed">
                                                                ℹ️ 為避免誤觸撥號，以上號碼僅作清晰展示；如情況危急，請立即請身邊家人協助或自行使用電話致電。
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* 1. 溫暖同理開頭與親切點題 (Empathetic Opening) */}
                                        {msg.content && (
                                            <div className={`p-4 sm:p-5 text-slate-800 leading-relaxed ${
                                                isLargeFont ? 'text-[17px] sm:text-[19px] font-black' : 'text-[14px] sm:text-[15px] font-semibold'
                                            }`}>
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({node, ...props}) => <p className="mb-2.5 last:mb-0 whitespace-pre-line" {...props} />,
                                                        strong: ({node, ...props}) => <strong className="font-black text-[#2C4A5E] bg-amber-50 px-1 py-0.5 rounded-sm" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2.5 space-y-1 whitespace-pre-line" {...props} />,
                                                        li: ({node, ...props}) => <li className="pl-0.5 whitespace-pre-line" {...props} />,
                                                    }}
                                                >
                                                    {msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n')}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        {/* Node 3: 偏好釐清卡片 (Value Preference Cards - 基於文獻與 PDA 標準維度) */}
                                        {msg.activeNode === 3 && msg.preferenceQuestions && msg.preferenceQuestions.length > 0 && (
                                            <div className="p-4 sm:p-5 bg-amber-50/50 border-t border-amber-200/80 space-y-4 animate-soft">
                                                {msg.preferenceQuestions.map((pq: PreferenceQuestion) => {
                                                    const msgId = msg.id || index.toString();
                                                    const pqSelections = selectedPreferenceOptions[msgId]?.[pq.id] || {};
                                                    const otherActive = isOtherSelected[msgId]?.[pq.id] || false;
                                                    
                                                    const hasSelection = Object.keys(pqSelections).length > 0 || (otherActive && (otherCustomText[msgId]?.[pq.id] || "").trim().length > 0);

                                                    return (
                                                        <div key={pq.id} className="space-y-3.5 bg-white p-4.5 rounded-2xl border border-amber-200/70 shadow-xs">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-base">📋</span>
                                                                        <p className="text-sm md:text-[15px] font-black text-slate-900">{pq.questionText}</p>
                                                                    </div>
                                                                    <p className="text-xs text-amber-800 font-extrabold flex items-center gap-1">
                                                                        <span>💡</span> 點擊卡片即可直接選取您最看重的考量（可多選）
                                                                    </p>
                                                                </div>
                                                                {hasSelection && (
                                                                    <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-1 rounded-full font-black whitespace-nowrap flex items-center gap-1 shadow-xs border border-emerald-200">
                                                                        <span>✓</span> 已選 {Object.keys(pqSelections).length + (otherActive && (otherCustomText[msgId]?.[pq.id] || "").trim().length > 0 ? 1 : 0)} 項
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                                {pq.options.map((opt: PreferenceOption, optIdx: number) => {
                                                                    const iconMap: Record<string, string> = {
                                                                        Effectiveness: "⚡",
                                                                        Safety: "🛡️",
                                                                        "Administration/Pain": "💉",
                                                                        Cost: "💰",
                                                                        Convenience: "📦",
                                                                        "Quality of Life": "🌟",
                                                                        Autonomy: "✊",
                                                                        "Psychological Burden": "❤️"
                                                                    };
                                                                    const icon = iconMap[opt.valueCategory] || "💡";
                                                                    const isSelected = !!pqSelections[opt.label];
                                                                    return (
                                                                        <div
                                                                            key={optIdx}
                                                                            onClick={() => {
                                                                                setSelectedPreferenceOptions(prev => {
                                                                                    const next = { ...prev };
                                                                                    const currentMsg = next[msgId] || {};
                                                                                    const currentPq = { ...(currentMsg[pq.id] || {}) };
                                                                                    if (isSelected) {
                                                                                        delete currentPq[opt.label];
                                                                                    } else {
                                                                                        currentPq[opt.label] = {
                                                                                            questionText: pq.questionText,
                                                                                            label: opt.label,
                                                                                            valueCategory: opt.valueCategory
                                                                                        };
                                                                                    }
                                                                                    next[msgId] = {
                                                                                        ...currentMsg,
                                                                                        [pq.id]: currentPq
                                                                                    };
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            className={`p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between rounded-xl border relative select-none ${
                                                                                isSelected
                                                                                    ? "bg-amber-50/90 border-2 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-200/60"
                                                                                    : "bg-slate-50/80 hover:bg-amber-50/40 border-slate-200/90 text-slate-700 hover:border-amber-300"
                                                                            }`}
                                                                        >
                                                                            <div className="flex flex-col gap-1.5 w-full">
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        <span className="text-xl leading-none">{icon}</span>
                                                                                        <p className={`text-sm ${isSelected ? "text-amber-950 font-black" : "text-slate-900 font-extrabold"}`}>
                                                                                            {opt.label}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                                                                        isSelected ? "bg-amber-500 text-white shadow-xs" : "border-2 border-slate-300 text-transparent"
                                                                                    }`}>
                                                                                        ✓
                                                                                    </div>
                                                                                </div>
                                                                                {opt.description && (
                                                                                    <p className={`mt-0.5 pl-8 text-xs leading-relaxed font-semibold ${isSelected ? "text-amber-900" : "text-slate-500"}`}>
                                                                                        {opt.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* "Other" Card */}
                                                                <div
                                                                    onClick={() => {
                                                                        setIsOtherSelected(prev => ({
                                                                            ...prev,
                                                                            [msgId]: {
                                                                                ...(prev[msgId] || {}),
                                                                                [pq.id]: !otherActive
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className={`p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between rounded-xl border relative select-none ${
                                                                        otherActive
                                                                            ? "bg-amber-50/90 border-2 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-200/60"
                                                                            : "bg-slate-50/80 hover:bg-amber-50/40 border-slate-200/90 text-slate-700 hover:border-amber-300"
                                                                    }`}
                                                                >
                                                                    <div className="flex flex-col gap-1.5 w-full">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <span className="text-xl leading-none">✍️</span>
                                                                                <p className={`text-sm ${otherActive ? "text-amber-950 font-black" : "text-slate-900 font-extrabold"}`}>
                                                                                    其他個人考量 / 補充想法
                                                                                </p>
                                                                            </div>
                                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                                                                otherActive ? "bg-amber-500 text-white shadow-xs" : "border-2 border-slate-300 text-transparent"
                                                                            }`}>
                                                                                ✓
                                                                            </div>
                                                                        </div>
                                                                        <p className={`mt-0.5 pl-8 text-xs leading-relaxed font-semibold ${otherActive ? "text-amber-900" : "text-slate-500"}`}>
                                                                            若以上標準維度未涵蓋您的特別顧慮或生活習慣，請點選此項並自定義填寫
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Custom text area displayed when "Other" is active */}
                                                            {otherActive && (
                                                                <div className="mt-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2 animate-soft">
                                                                    <label className="block text-xs font-black text-amber-900">
                                                                        🖊️ 請輸入您的具體想法或顧慮：
                                                                    </label>
                                                                    <textarea
                                                                        value={otherCustomText[msgId]?.[pq.id] || ""}
                                                                        onChange={(e) => {
                                                                            setOtherCustomText(prev => ({
                                                                                ...prev,
                                                                                [msgId]: {
                                                                                    ...(prev[msgId] || {}),
                                                                                    [pq.id]: e.target.value
                                                                                }
                                                                            }));
                                                                        }}
                                                                        rows={2}
                                                                        placeholder="例如：擔心與其他慢性病藥物相互作用、希望知道能否配合夜班作息等..."
                                                                        className="w-full p-2.5 text-xs font-medium border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Submit Button Container */}
                                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-amber-200/60 mt-3">
                                                    <p className="text-xs font-bold text-amber-900 leading-normal">
                                                        💡 選擇您最在意的 1～2 項考量後點擊確認，AI 將為您量身盤點方案利弊對比。
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            const msgId = msg.id || index.toString();
                                                            const msgSelections = selectedPreferenceOptions[msgId] || {};
                                                            const msgOthers = isOtherSelected[msgId] || {};
                                                            const msgTexts = otherCustomText[msgId] || {};
                                                            
                                                            const parts = ["我已選擇我的個人偏好（決策考量維度）："];
                                                            let submittedCount = 0;
                                                            
                                                            msg.preferenceQuestions.forEach((pq: PreferenceQuestion) => {
                                                                const pqSelections = msgSelections[pq.id] || {};
                                                                const isOther = msgOthers[pq.id];
                                                                const customTxt = (msgTexts[pq.id] || "").trim();
                                                                
                                                                // Add selected standard options
                                                                Object.values(pqSelections).forEach((sel: PreferenceSelection) => {
                                                                    parts.push(`- 針對「${sel.questionText}」，我最看重：【${sel.label}】（價值維度：${sel.valueCategory}）`);
                                                                    submittedCount++;
                                                                });

                                                                // Add custom "other" option
                                                                if (isOther && customTxt.length > 0) {
                                                                    parts.push(`- 針對「${pq.questionText}」，我有其他考量：【${customTxt}】（價值維度：其他）`);
                                                                    submittedCount++;
                                                                }
                                                            });
                                                            
                                                            if (submittedCount === 0) return;
                                                            
                                                            const combinedMessage = parts.join("\n");
                                                            handleSendChatMessage(combinedMessage);
                                                        }}
                                                        disabled={(() => {
                                                            const msgId = msg.id || index.toString();
                                                            const msgSelections = selectedPreferenceOptions[msgId] || {};
                                                            const msgOthers = isOtherSelected[msgId] || {};
                                                            const msgTexts = otherCustomText[msgId] || {};
                                                            
                                                            let validCount = 0;
                                                            msg.preferenceQuestions.forEach((pq: PreferenceQuestion) => {
                                                                const pqSelections = msgSelections[pq.id] || {};
                                                                const isOther = msgOthers[pq.id];
                                                                const customTxt = (msgTexts[pq.id] || "").trim();
                                                                validCount += Object.keys(pqSelections).length;
                                                                if (isOther && customTxt.length > 0) {
                                                                    validCount++;
                                                                }
                                                            });
                                                            return validCount === 0;
                                                        })()}
                                                        className={`w-full sm:w-auto px-6 py-2.5 font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                            (() => {
                                                                const msgId = msg.id || index.toString();
                                                                const msgSelections = selectedPreferenceOptions[msgId] || {};
                                                                const msgOthers = isOtherSelected[msgId] || {};
                                                                const msgTexts = otherCustomText[msgId] || {};
                                                                let validCount = 0;
                                                                msg.preferenceQuestions.forEach((pq: PreferenceQuestion) => {
                                                                    validCount += Object.keys(msgSelections[pq.id] || {}).length;
                                                                    if (msgOthers[pq.id] && (msgTexts[pq.id] || "").trim().length > 0) validCount++;
                                                                });
                                                                return validCount > 0
                                                                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:scale-[1.01]"
                                                                    : "bg-slate-200 text-slate-400 cursor-not-allowed";
                                                            })()
                                                        }`}
                                                    >
                                                        <span>✓ 確認提交我的偏好考量</span>
                                                        <span className="text-sm">➔</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. 結構化重點對比卡片 (直接展示，不隱藏於摺疊區) */}
                                        {(() => {
                                            const comparisonItems = msg.detailedVersion?.optionComparison?.length
                                                ? msg.detailedVersion.optionComparison
                                                : (msg.optionsComparison || []);
                                            if (msg.activeNode === 3 || msg.activeNode === 1 || msg.safety?.blockLLM || comparisonItems.length === 0) {
                                                return null;
                                            }
                                            const isKnowledgeComparison = msg.comparisonKind === 'knowledge';
                                            return (
                                                <div className="bg-slate-50/80 border-t border-slate-200/70 px-4 py-3 sm:px-5 sm:py-3.5 space-y-2.5 animate-soft">
                                                    <p className={`font-black text-[#4A6E85] tracking-tight flex items-center gap-1.5 ${isLargeFont ? 'text-sm sm:text-base' : 'text-xs'}`}>
                                                        <span>⚖️</span>
                                                        <span>
                                                            {isKnowledgeComparison
                                                                ? '重點對比一覽'
                                                                : '治療方案利弊考量（供覆診與醫生商討）'}
                                                        </span>
                                                    </p>
                                                    <div className="space-y-2">
                                                        {comparisonItems.map((opt: ChatOptionComparison, optIdx: number) => (
                                                            <div key={optIdx} className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-5 h-5 bg-[#4A6E85] text-white text-[11px] font-black flex items-center justify-center rounded-full shrink-0">
                                                                        {optIdx + 1}
                                                                    </span>
                                                                    <span className={`font-extrabold text-slate-900 ${isLargeFont ? 'text-base sm:text-lg' : 'text-sm'}`}>
                                                                        {opt.option}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                                                                        <p className={`font-black text-emerald-800 mb-1 ${isLargeFont ? 'text-xs' : 'text-[11px]'}`}>
                                                                            {isKnowledgeComparison ? '👍 主要優勢／特點' : '👍 優勢效益 (Pros)'}
                                                                        </p>
                                                                        {renderBulletPoints(opt.pros, true, "text-xs", "font-semibold")}
                                                                    </div>
                                                                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                                                                        <p className={`font-black text-amber-800 mb-1 ${isLargeFont ? 'text-xs' : 'text-[11px]'}`}>
                                                                            {isKnowledgeComparison ? '⚠️ 注意事項／限制' : '⚠️ 顧慮隱憂 (Cons)'}
                                                                        </p>
                                                                        {renderBulletPoints(opt.cons, false, "text-xs", "font-semibold")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 3. 重點速覽 (Key Takeaways / Brief Version) - 簡潔緊湊的綠色重點列表 */}
                                        {msg.activeNode !== 3 && msg.activeNode !== 1 && !msg.safety?.blockLLM && msg.briefVersion?.takeHomeMessages && msg.briefVersion.takeHomeMessages.length > 0 && (
                                            <div className="bg-emerald-50/70 border-t border-b border-emerald-200/60 px-4 py-2.5 sm:px-5 sm:py-3 space-y-1.5 animate-soft">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs leading-none" aria-hidden="true">💡</span>
                                                    <h4 className={`font-black text-emerald-900 tracking-tight ${isLargeFont ? 'text-sm sm:text-base' : 'text-xs'}`}>
                                                        重點速覽
                                                    </h4>
                                                </div>

                                                <ul className="space-y-1.5">
                                                    {msg.briefVersion.takeHomeMessages.map((item: string, iIdx: number) => {
                                                        const normalizedItem = item.replace(/\\n/g, '\n');
                                                        return (
                                                            <li key={iIdx} className="flex items-start gap-2">
                                                                <span className={`flex-shrink-0 bg-emerald-600 text-white font-black rounded-full flex items-center justify-center ${isLargeFont ? 'w-5 h-5 text-[11px] mt-1' : 'w-4 h-4 text-[10px] mt-0.5'}`}>
                                                                    {iIdx + 1}
                                                                </span>
                                                                <span className={`text-slate-800 leading-snug whitespace-pre-line ${isLargeFont ? 'text-[16px] sm:text-[17px] font-bold' : 'text-[13px] font-semibold'}`}>
                                                                    {normalizedItem.split(/\*\*(.*?)\*\*/g).map((part: string, pIdx: number) => {
                                                                        if (pIdx % 2 === 1) {
                                                                            return (
                                                                                <strong key={pIdx} className="font-black text-emerald-950">
                                                                                    {part}
                                                                                </strong>
                                                                            );
                                                                        }
                                                                        return part;
                                                                    })}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 4. 詳細說明 (Detailed Version) - 輕量摺疊（僅在非偏好詢問階段且有文字解說時展示） */}
                                        {msg.activeNode !== 3 && msg.activeNode !== 1 && !msg.safety?.blockLLM && msg.detailedVersion?.generalExplanation && msg.detailedVersion.generalExplanation.trim().length > 0 && (
                                            <div className="border-b border-slate-150/80">
                                                <button
                                                    onClick={() => {
                                                        const msgId = msg.id || index.toString();
                                                        setExpandedDetailedSections(prev => ({
                                                            ...prev,
                                                            [msgId]: !prev[msgId]
                                                        }));
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left cursor-pointer group gap-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-base sm:text-lg">💡</span>
                                                        <span className={`font-black text-slate-800 tracking-tight ${isLargeFont ? 'text-[15px] sm:text-[16px]' : 'text-xs sm:text-[13px]'}`}>
                                                            詳細說明
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#4A6E85] group-hover:text-[#335064] bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs shrink-0 whitespace-nowrap">
                                                        {expandedDetailedSections[msg.id || index.toString()] ? '收合 ▲' : '點擊查看 ▾'}
                                                    </span>
                                                </button>

                                                {expandedDetailedSections[msg.id || index.toString()] && (
                                                    <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200/60 space-y-3.5 animate-soft">
                                                        <div className="space-y-2">
                                                            <ReactMarkdown
                                                                components={{
                                                                    p: ({children}) => <p className={`mb-2 last:mb-0 text-slate-700 leading-relaxed whitespace-pre-line ${isLargeFont ? 'text-[16px] font-bold' : 'text-[13px] font-medium'}`}>{children}</p>,
                                                                    ul: ({children}) => <ul className={`list-disc pl-5 mb-2 space-y-1 text-slate-700 whitespace-pre-line ${isLargeFont ? 'text-[16px] font-bold' : 'text-[13px] font-medium'}`}>{children}</ul>,
                                                                    ol: ({children}) => <ol className={`list-decimal pl-5 mb-2 space-y-1 text-slate-700 whitespace-pre-line ${isLargeFont ? 'text-[16px] font-bold' : 'text-[13px] font-medium'}`}>{children}</ol>,
                                                                    li: ({children}) => <li className={`leading-relaxed text-slate-700 whitespace-pre-line ${isLargeFont ? 'text-[16px] font-bold' : 'text-[13px] font-medium'}`}>{children}</li>,
                                                                    strong: ({children}) => <strong className="font-bold text-slate-950 mx-0.5">{children}</strong>,
                                                                }}
                                                            >
                                                                {msg.detailedVersion.generalExplanation.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n')}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 4. 下次覆診問醫生的問題 (Doctor Questions) - 智能按需展示（僅在非偏好詢問階段展示） */}
                                        {msg.activeNode !== 3 && msg.detailedVersion?.suggestedDiscussionPoints && msg.detailedVersion.suggestedDiscussionPoints.length > 0 && (
                                            <div>
                                                <button
                                                    onClick={() => {
                                                        const msgId = msg.id || index.toString();
                                                        setExpandedDiscussionPoints(prev => ({
                                                            ...prev,
                                                            [msgId]: !prev[msgId]
                                                        }));
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-50/60 hover:bg-amber-50/60 transition-colors text-left cursor-pointer group gap-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-sm sm:text-base">📋</span>
                                                        <span className={`font-black text-slate-700 group-hover:text-amber-950 tracking-tight ${isLargeFont ? 'text-[14px] sm:text-[15px]' : 'text-xs'}`}>
                                                            想同醫生商討？點擊查看參考問題
                                                        </span>
                                                        <span className="text-[10px] font-extrabold bg-slate-200/80 group-hover:bg-amber-200/80 text-slate-600 group-hover:text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                                                            {msg.detailedVersion.suggestedDiscussionPoints.length} 題
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-500 group-hover:text-amber-900 bg-white border border-slate-200 group-hover:border-amber-200 px-2 py-0.5 rounded-lg shadow-2xs shrink-0 whitespace-nowrap">
                                                        {expandedDiscussionPoints[msg.id || index.toString()] ? '收合 ▲' : '點擊查看 ▾'}
                                                    </span>
                                                </button>

                                                {expandedDiscussionPoints[msg.id || index.toString()] && (
                                                    <div className="p-3 sm:p-4 bg-amber-50/50 border-t border-amber-200/40 space-y-2 animate-soft">
                                                        <p className="text-[11px] font-bold text-amber-900/80 px-0.5">
                                                            💡 點擊「+ 保存到備忘」，問題將自動加入您的專屬「問題紀錄」清單：
                                                        </p>
                                                        {msg.detailedVersion.suggestedDiscussionPoints.map((q: string, qIdx: number) => {
                                                            const isSaved = chatSavedQs[msg.id + "-det-" + qIdx] || false;
                                                            return (
                                                                <div key={qIdx} className="flex items-start gap-2.5 justify-between bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs">
                                                                    <p className={`leading-relaxed text-slate-800 flex-1 ${isLargeFont ? 'text-[16px] font-bold' : 'text-[12px] sm:text-[13px] font-semibold'}`}>
                                                                        {q}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (isSaved) return;
                                                                            saveDoctorQuestions([q]);
                                                                            setChatSavedQs(prev => ({ ...prev, [msg.id + "-det-" + qIdx]: true }));
                                                                            showToast("已存入「問題紀錄」清單 🔖");
                                                                        }}
                                                                        className={"text-[10px] font-extrabold rounded-lg transition-all px-2.5 py-1 whitespace-nowrap self-center shrink-0 " + (
                                                                            isSaved 
                                                                                ? "bg-emerald-100 text-emerald-800 pointer-events-none font-black" 
                                                                                : "bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-2xs cursor-pointer"
                                                                        )}
                                                                    >
                                                                        {isSaved ? "✓ 已保存" : "+ 保存到備忘"}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Legacy fallback - optionsComparison & doctorQuestions if present on legacy data */}
                                        {msg.activeNode !== 3 && (!msg.briefVersion && !msg.detailedVersion) && msg.optionsComparison && msg.optionsComparison.length > 0 && (
                                            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                                                <p className="text-xs font-black text-slate-700">方案利弊對照盤：</p>
                                                {msg.optionsComparison.map((opt: ChatOptionComparison, optIdx: number) => (
                                                    <div key={optIdx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                                        <p className="font-extrabold text-xs text-slate-900">{opt.option}</p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>{renderBulletPoints(opt.pros, true, "text-[11px]", "font-medium")}</div>
                                                            <div>{renderBulletPoints(opt.cons, false, "text-[11px]", "font-medium")}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* AI 正在推理中 */}
                    {chatLoading && (
                        <div className="flex flex-col items-start bg-slate-50/50 p-4 rounded-3xl w-full border border-slate-100">
                            <p className="text-xs font-black text-[#5C8199] mb-2 px-2 flex items-center gap-1.5 animate-pulse">
                                <span>🩺</span> 正在為您查詢控糖指引與醫學建議，請稍候...
                            </p>
                            <div className="flex items-center gap-3 w-full pl-2">
                                <div className="text-2xl animate-spin">⚙️</div>
                                <div className="space-y-1.5 flex-1 p-2 bg-white rounded-2xl border border-slate-100 shadow-xs">
                                    <div className="h-3.5 bg-slate-200 rounded-md w-3/4 animate-pulse"></div>
                                    <div className="h-2.5 bg-slate-100 rounded-md w-1/2 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 推薦的下一步深入追問（如果當前處於安全攔截或等待長者選擇偏好，則不展示干擾選項） */}
                {(() => {
                    const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
                    if (lastAssistantMsg?.activeNode === 3 || lastAssistantMsg?.activeNode === 1 || lastAssistantMsg?.safety?.blockLLM) return null;
                    const lastFollowUps = lastAssistantMsg?.suggestedFollowUps || [];
                    if (lastFollowUps.length > 0 && !chatLoading) {
                        return (
                            <div className="space-y-3 animate-soft bg-[#4A6E85]/5 border border-[#4A6E85]/10 p-5 rounded-3xl">
                                <p className="text-xs font-black text-[#4A6E85] flex items-center gap-1.5 pl-1 uppercase tracking-wider">
                                    <span>💡</span> 推薦的下一步深入追問（點擊即可快捷提問）：
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {lastFollowUps.map((q: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendChatMessage(q)}
                                            className="px-4 py-2.5 bg-white border border-[#4A6E85]/20 hover:border-[#4A6E85]/60 text-[#4A6E85] hover:bg-[#4A6E85]/5 rounded-2xl text-[13px] font-black cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-xs text-left"
                                        >
                                            💬 {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

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

                {/* 已選相片預覽條 */}
                {attachedImage && (
                    <div className="bg-[#4A6E85]/10 border border-[#4A6E85]/30 rounded-2xl p-2.5 flex items-center justify-between gap-3 animate-soft">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={attachedImage.previewUrl}
                                alt="預覽"
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 object-cover rounded-xl border border-white shadow-xs shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-black text-[#4A6E85] truncate">
                                    📷 已選取藥物/處方相片
                                </p>
                                <p className="text-[11px] text-slate-500 font-bold">
                                    點擊發送將自動辨識藥名、劑量並進行多模態問答
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAttachedImage(null)}
                            className="bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* 對話輸入區域 (OpenAI 簡約對話框風格) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs focus-within:ring-2 focus-within:ring-[#4A6E85]/20 focus-within:border-[#4A6E85] transition-all flex flex-col relative group">
                    <textarea
                        id="chat-input-box"
                        className="w-full rounded-xl border-0 p-2 pb-10 font-bold focus:outline-none focus:ring-0 bg-transparent resize-none text-sm min-h-[70px] text-slate-800 placeholder-slate-400"
                        placeholder={attachedImage ? "可補充您的提問（例如：我食呢隻藥成日胃唔舒服，有冇影響？）..." : "請在此輸入或直接使用語音，詢問您的控糖疑問..."}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChatMessage(chatInput);
                            }
                        }}
                    />
                    <div className="absolute bottom-2.5 right-2.5 flex items-center justify-between left-2.5 pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {/* 📷 相機/相片上傳按鈕 */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="拍照或上傳相片/食物/藥物包裝"
                                className="h-8 bg-[#4A6E85]/10 hover:bg-[#4A6E85]/20 text-[#4A6E85] text-xs font-black px-3 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs leading-none"
                            >
                                <span className="text-sm leading-none flex items-center justify-center">📷</span>
                                <span className="hidden sm:inline leading-none">拍照/上傳</span>
                            </button>

                            {/* 🎤 語音輸入按鈕 (垂直精準對齊圖標與文字，支援點擊錄音) */}
                            <button
                                type="button"
                                onClick={toggleVoiceInput}
                                title={isListening ? "正在聆聽語音... 點擊結束" : "點擊開始語音輸入"}
                                className={`h-8 px-3 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs leading-none border ${
                                    isListening 
                                        ? 'bg-rose-500 text-white border-rose-600 animate-pulse' 
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#4A6E85] border-slate-200'
                                }`}
                            >
                                <span className={`text-sm leading-none flex items-center justify-center ${isListening ? 'animate-bounce' : 'text-[#4A6E85]'}`}>
                                    {isListening ? '🔴' : '🎤'}
                                </span>
                                <span className="leading-none">
                                    {isListening ? '錄音中... 點擊結束' : '語音/文字'}
                                </span>
                            </button>

                            {/* 💬 開啟新對話快捷按鈕 */}
                            {chatMessages.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleClearChatHistory}
                                    title="開啟新話題"
                                    className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                                >
                                    <span className="text-xs">✨</span>
                                    <span className="hidden sm:inline">新話題</span>
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleSendChatMessage(chatInput)}
                            disabled={(!chatInput.trim() && !attachedImage) || chatLoading}
                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center pointer-events-auto cursor-pointer ${
                                (!chatInput.trim() && !attachedImage) || chatLoading 
                                    ? 'bg-slate-100 text-slate-300' 
                                    : 'bg-[#4A6E85] text-white hover:bg-[#3d5b70] shadow-xs hover:scale-[1.05] active:scale-95'
                            }`}
                            title="發送提問"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 常用話題快捷按鍵 */}
                {chatMessages.length <= 1 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">快捷提問：</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { text: '📊 我的血糖數據合格嗎？幫我分析指標與健康檔案的關係', label: '📊 數據解讀' },
                                { text: '⚠️ 出現手震、心慌、冒冷汗等症狀，我該如何緊急處理？', label: '⚠️ 突發情況' },
                                { text: '🥗 糖尿病患者一日三餐或外出用餐有什麼飲食控糖建議？', label: '🥗 飲食建議' },
                                { text: '💊 二甲雙胍(Metformin)等控糖藥物會有什麼常見副作用？', label: '💊 用藥副作用' },
                                { text: '👁️ 糖尿病會引致哪些常見併發症（如眼底或腎病變）？該如何預防？', label: '👁️ 常見併發症' }
                            ].map((topic, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendChatMessage(topic.text)}
                                    className="px-3 py-1.5 bg-white hover:bg-[#4A6E85]/5 border border-slate-200 hover:border-[#4A6E85] rounded-full text-[11px] font-black text-[#4A6E85] transition-all cursor-pointer shadow-xs"
                                >
                                    {topic.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-400 font-medium leading-relaxed">
                    專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準。所有對話僅供共同決策 (SDM) 及覆診前備忘，不作直接個體化臨床診斷。
                </div>
            </div>
    );
}
