import {useEffect, useRef, useState} from 'react';
import type {ConsultViewProps} from './types';
import type { ChatTurn, ChatMessage, ChatImageAttachment } from '../../utils/types';
import {getConversationalChatResponse} from '../../services/geminiService';
import {loadChatMessages, persistChatMessages, clearChatMessages} from '../../domain';

export function useConsultViewModel(props: ConsultViewProps) {
    const {
        loading,
        profile, glucoseRecords, hba1cRecords = [],
        setView,
        saveDoctorQuestions,
        isLargeFont
    } = props;

    // 預設歡迎訊息
    const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
        {
            id: 'welcome',
            role: 'assistant',
            content: "關於糖尿病管理，\n您目前最關心什麼？",
            isWelcome: true
        }
    ];

    // AI 聊天室狀態 (支援 LocalStorage 自動保存)
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadChatMessages(DEFAULT_CHAT_MESSAGES));

    // 當對話訊息更新時自動持久化保存
    // 存入 localStorage 前剝離圖片 base64 和 previewUrl，防止 localStorage 溢出
    useEffect(() => {
        persistChatMessages(chatMessages);
    }, [chatMessages]);

    // 清空歷史對話處理
    const handleClearChatHistory = () => {
        // 重置為預設歡迎訊息
        setChatMessages(DEFAULT_CHAT_MESSAGES);
        setChatInput('');
        setAttachedImage(null);
        setSelectedPreferenceOptions({});
        setIsOtherSelected({});
        setOtherCustomText({});
        setExpandedDetailedSections({});
        setExpandedDiscussionPoints({});
        clearChatMessages();
    };
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSavedQs, setChatSavedQs] = useState<Record<string, boolean>>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
    const [quickMemoInput, setQuickMemoInput] = useState('');
    const [isQuickMemoListening, setIsQuickMemoListening] = useState(false);
    const quickMemoRecRef = useRef<any>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(prev => prev === msg ? null : prev);
        }, 2800);
    };

    const toggleQuickMemoVoice = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的設備暫不支援語音識別，請直接輸入文字噢！');
            return;
        }

        if (isQuickMemoListening) {
            if (quickMemoRecRef.current) {
                quickMemoRecRef.current.stop();
            }
            setIsQuickMemoListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-HK';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsQuickMemoListening(true);
            recognition.onerror = () => setIsQuickMemoListening(false);
            recognition.onend = () => setIsQuickMemoListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setQuickMemoInput(prev => prev ? `${prev} ${transcript}` : transcript);
                }
            };

            quickMemoRecRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.error(e);
            setIsQuickMemoListening(false);
        }
    };
    const [expandedDetailedSections, setExpandedDetailedSections] = useState<Record<string, boolean>>({});
    const [expandedDiscussionPoints, setExpandedDiscussionPoints] = useState<Record<string, boolean>>({});
    const [selectedPreferenceOptions, setSelectedPreferenceOptions] = useState<Record<string, Record<string, Record<string, { questionText: string, label: string, valueCategory: string, rating?: number }>>>>({});
    const [isOtherSelected, setIsOtherSelected] = useState<Record<string, Record<string, boolean>>>({});

    // 📷 拍照上傳問答相關狀態
    const [attachedImage, setAttachedImage] = useState<{ base64: string, mimeType: string, previewUrl: string, name?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [otherCustomText, setOtherCustomText] = useState<Record<string, Record<string, string>>>({});

    // 🎤 語音輸入狀態
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的瀏覽器或設備暫不支援語音識別，請直接鍵盤輸入噢！');
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-HK';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert('請先在瀏覽器允許麥克風啟用權限噢！');
                } else if (event.error !== 'no-speech') {
                    alert('語音辨識發生錯誤，請多試一次或直接手動打字輸入噢！');
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (e) {
            console.error(e);
            setIsListening(false);
        }
    };

    const renderBulletPoints = (text: string, isPros: boolean, defaultTextSizeClass = "text-xs", defaultFontWeightClass = "font-black") => {
        if (!text) return null;
        
        // 1. 將字面量 "\\n" 或 "\n" 的字串替換為真正的換行符，確保能正確切割
        let processedText = text.replace(/\\n/g, '\n');
        
        // 2. 僅依據換行符進行切割，避免因分號 (；) 或連字符 (-) 將完整句子切斷
        const rawLines = processedText.split('\n');
        const cleanedLines = rawLines
            .map(line => {
                let trimmed = line.trim();
                // 3. 清除開頭的項目符號 (如 -, *, •, ▪, ●) 以及可能殘留的字面量 \n
                trimmed = trimmed.replace(/\\n/g, '').replace(/\n/g, '');
                trimmed = trimmed.replace(/^[\s•\-*▪●]+\s*/, '');
                // 4. 清除開頭的編號 (如 1., a., (1) 等)
                trimmed = trimmed.replace(/^(\d+\.|[a-zA-Z]\.|\([0-9]+\)|[①-⑨])\s*/, '');
                return trimmed;
            })
            .filter(line => line.length > 0);

        let linesToUse = cleanedLines;

        const sizeClass = isLargeFont ? 'text-[19px]' : defaultTextSizeClass;
        const weightClass = isLargeFont ? 'font-black' : defaultFontWeightClass;

        return (
            <ul className="space-y-2 list-none pl-0">
                {linesToUse.map((line, idx) => (
                    <li key={idx} className={`flex items-start gap-2 text-slate-700 leading-relaxed ${sizeClass} ${weightClass}`}>
                        <span className={`inline-block mt-1 shrink-0 select-none ${isPros ? 'text-emerald-600' : 'text-amber-600'} ${isLargeFont ? 'text-[22px]' : 'text-base'}`}>
                            •
                        </span>
                        <span className="flex-1">{line}</span>
                    </li>
                ))}
            </ul>
        );
    };

    const handleSendChatMessage = async (text: string, customImage?: ChatImageAttachment) => {
        const imgToSend = customImage || (attachedImage ? { base64: attachedImage.base64, mimeType: attachedImage.mimeType, previewUrl: attachedImage.previewUrl } : undefined);
        const trimmedText = text.trim();

        if ((!trimmedText && !imgToSend) || chatLoading) return;

        const effectiveText = trimmedText || (imgToSend ? "請幫我分析這張藥物相片或處方標籤，說明藥物名稱、用法、注意事項及覆診問醫生的問題。" : "");

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: effectiveText,
            imageAttachment: imgToSend
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setAttachedImage(null);
        setChatLoading(true);

        const MAX_CLIENT_HISTORY_ROUNDS = 10;
        const MAX_CLIENT_HISTORY_MESSAGES = MAX_CLIENT_HISTORY_ROUNDS * 2;
        const validPreviousTurns: ChatTurn[] = chatMessages
            .filter(m => {
                if (m.isWelcome || m.isError) return false;
                if (m.role !== 'user' && m.role !== 'assistant') return false;
                const text = typeof m.content === 'string' ? m.content.trim() : '';
                if (!text) return false;
                if (m.role === 'assistant' && text.startsWith('⚠️ 唔好意思，系統暫時未能完成回覆')) return false;
                return true;
            })
            .map(m => ({ role: m.role, content: m.content.trim() }));

        const recentTurnsReversed: ChatTurn[] = [];
        let userRoundCount = 0;
        for (let i = validPreviousTurns.length - 1; i >= 0; i--) {
            const turn = validPreviousTurns[i];
            if (recentTurnsReversed.length >= MAX_CLIENT_HISTORY_MESSAGES) break;
            if (turn.role === 'user') {
                if (userRoundCount >= MAX_CLIENT_HISTORY_ROUNDS) break;
                userRoundCount++;
            }
            recentTurnsReversed.push(turn);
        }
        const previousTurns = recentTurnsReversed.reverse();
        while (previousTurns.length > 0 && previousTurns[0].role === 'assistant') {
            previousTurns.shift();
        }

        const preferenceAlreadySubmitted = chatMessages.some(m =>
            m.role === 'user' &&
            typeof m.content === 'string' &&
            m.content.includes('我已選擇我的個人偏好')
        );

        try {
            const res = await getConversationalChatResponse(
                profile,
                glucoseRecords,
                effectiveText,
                previousTurns,
                imgToSend ? { data: imgToSend.base64, mimeType: imgToSend.mimeType } : undefined,
                hba1cRecords,
                preferenceAlreadySubmitted
            );

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: res.reply,
                optionsComparison: res.optionsComparison,
                comparisonKind: res.comparisonKind,
                patientValuesSummary: res.patientValuesSummary,
                doctorQuestions: res.doctorQuestions,
                suggestedFollowUps: res.suggestedFollowUps,
                traceability: res.traceability,
                activeNode: res.activeNode,
                safety: res.safety,
                preferenceQuestions: res.preferenceQuestions,
                briefVersion: res.briefVersion,
                detailedVersion: res.detailedVersion
            };

            setChatMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            console.error("Chat mode error:", e);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "⚠️ 唔好意思，系統暫時未能完成回覆，請稍等幾秒再試一次。",
                isError: true
            };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setChatLoading(false);
        }
    };


    return {
        loading,
        profile,
        glucoseRecords,
        hba1cRecords,
        setView,
        saveDoctorQuestions,
        isLargeFont,
        DEFAULT_CHAT_MESSAGES,
        chatInput,
        setChatInput,
        chatMessages,
        setChatMessages,
        handleClearChatHistory,
        chatLoading,
        setChatLoading,
        chatSavedQs,
        setChatSavedQs,
        toastMessage,
        setToastMessage,
        isQuickMemoOpen,
        setIsQuickMemoOpen,
        quickMemoInput,
        setQuickMemoInput,
        isQuickMemoListening,
        setIsQuickMemoListening,
        quickMemoRecRef,
        showToast,
        toggleQuickMemoVoice,
        expandedDetailedSections,
        setExpandedDetailedSections,
        expandedDiscussionPoints,
        setExpandedDiscussionPoints,
        selectedPreferenceOptions,
        setSelectedPreferenceOptions,
        isOtherSelected,
        setIsOtherSelected,
        attachedImage,
        setAttachedImage,
        fileInputRef,
        otherCustomText,
        setOtherCustomText,
        isListening,
        setIsListening,
        recognitionRef,
        toggleVoiceInput,
        renderBulletPoints,
        handleSendChatMessage
    };
}

export type ConsultViewModel = ReturnType<typeof useConsultViewModel>;
