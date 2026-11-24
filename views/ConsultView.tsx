/**
 * src/views/ConsultView.tsx
 */

import React, {useState, useEffect, useRef} from 'react';
import ReactMarkdown from 'react-markdown';
import {ClarificationQuestion, DecisionResult, GlucoseRecord, UserProfile, View, ChatTurn} from '../utils/types';
import {getClarificationQuestions, getFinalDecisionResult, getSuggestedQuestions, getDeeperEducationResult, getDeeperChoiceResult, getConversationalChatResponse} from '../services/geminiService';
import {CLINICAL_KNOWLEDGE} from '../services/knowledgeBase';

interface ConsultViewProps {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    consultStep: 'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT';
    setConsultStep: (step: 'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT') => void;
    concern: string;
    setConcern: (concern: string) => void;
    profile: UserProfile;
    glucoseRecords: GlucoseRecord[];
    clarifications: ClarificationQuestion[];
    setClarifications: (qs: ClarificationQuestion[]) => void;
    answers: Record<string, string[]>;
    setAnswers: (answers: Record<string, string[]>) => void;
    supplementalAnswer: string;
    setSupplementalAnswer: (val: string) => void;
    suggestedQuestions: string[];
    setSuggestedQuestions: (qs: string[]) => void;
    selectedQuestionTexts: string[];
    setSelectedQuestionTexts: (qs: string[]) => void;
    result: DecisionResult | null;
    setResult: (result: DecisionResult | null) => void;
    history: ChatTurn[];
    setHistory: (history: ChatTurn[]) => void;
    handleDownload: (customQuestions?: string[]) => void;
    setView: (view: View) => void;
    updateProfileWithExtraction: (data: any) => void;
    saveDoctorQuestions: (qs: string[]) => void;
    [key: string]: any;
}

const OTHER_OPTION_LABEL = "其他（支持輸入語音/文字）";

const VALUE_CATEGORY_KEYWORDS: Record<string, string> = {
    Effectiveness: "治療效果",
    Safety: "安全性",
    Cost: "醫療費用",
    Convenience: "使用便利",
    "Quality of Life": "生活品質",
    Autonomy: "自主控糖",
    "Psychological Burden": "心理負擔"
};

export const ConsultView: React.FC<ConsultViewProps> = (props) => {
    const {
        loading, setLoading,
        consultStep, setConsultStep,
        concern, setConcern,
        profile, glucoseRecords,
        clarifications, setClarifications,
        answers, setAnswers,
        supplementalAnswer, setSupplementalAnswer,
        suggestedQuestions, setSuggestedQuestions,
        selectedQuestionTexts, setSelectedQuestionTexts,
        result, setResult,
        history, setHistory,
        handleDownload,
        setView,
        updateProfileWithExtraction,
        saveDoctorQuestions,
        isLargeFont
    } = props;

    const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
    const [deeperLoading, setDeeperLoading] = useState(false);
    const [selectedDocQs, setSelectedDocQs] = useState<string[]>([]);
    const [savedStatus, setSavedStatus] = useState(false);

    // 實時檢索源（RAG 知識底座）狀態
    const [selectedKnowledgeKey, setSelectedKnowledgeKey] = useState<string | null>(null);
    const [isRAGPanelExpanded, setIsRAGPanelExpanded] = useState<boolean>(true);

    // 專家查詢模式結果頁專用的追問狀態
    const [resultFollowUps, setResultFollowUps] = useState<{role: 'user'|'assistant', content: string}[]>([]);
    const [resultFollowUpInput, setResultFollowUpInput] = useState('');
    const [resultFollowUpLoading, setResultFollowUpLoading] = useState(false);

    // 選擇性顯示狀態（自訂報告呈現 / 減少認知負荷）
    const [showOptionsComparison, setShowOptionsComparison] = useState(true);
    const [showDoctorQuestions, setShowDoctorQuestions] = useState(true);
    const [expandedChatOptions, setExpandedChatOptions] = useState<Record<string, boolean>>({});
    const [expandedChatQuestions, setExpandedChatQuestions] = useState<Record<string, boolean>>({});

    // 預設歡迎訊息
    const DEFAULT_CHAT_MESSAGES = [
        {
            id: 'welcome',
            role: 'assistant',
            content: "關於糖尿病管理，\n您目前最關心什麼？",
            isWelcome: true
        }
    ];

    // AI 聊天室模式狀態 (支援 LocalStorage 自動保存)
    const [activeMode, setActiveMode] = useState<'CHAT' | 'GUIDED'>('CHAT');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('dia_chat_messages');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("無法讀取歷史對話紀錄", e);
        }
        return DEFAULT_CHAT_MESSAGES;
    });

    // 當對話訊息更新時自動持久化保存
    // 【微調】存入 localStorage 前剝離圖片 base64 和 previewUrl，防止 localStorage 溢出
    useEffect(() => {
        try {
            const messagesToStore = chatMessages.map(msg => {
                if (msg.imageAttachment) {
                    return {
                        ...msg,
                        imageAttachment: {
                            mimeType: msg.imageAttachment.mimeType,
                            base64: '',
                            previewUrl: '',
                            name: msg.imageAttachment.name
                        }
                    };
                }
                return msg;
            });
            localStorage.setItem('dia_chat_messages', JSON.stringify(messagesToStore));
        } catch (e) {
            console.error("儲存對話紀錄失敗", e);
        }
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
        setOtherCustomRating({});
        setExpandedDetailedSections({});
        setExpandedDiscussionPoints({});
        setActiveVersionTab({});
        try {
            localStorage.removeItem('dia_chat_messages');
        } catch (e) {
            console.error("清空對話儲存失敗", e);
        }
    };
    const [chatLoading, setChatLoading] = useState(false);
    const [simulatedActiveNode, setSimulatedActiveNode] = useState<number>(0);

    useEffect(() => {
        let intervalId: any;
        if (chatLoading) {
            setSimulatedActiveNode(1);
            intervalId = setInterval(() => {
                setSimulatedActiveNode(prev => {
                    if (prev < 4) return prev + 1;
                    return prev;
                });
            }, 800);
        } else {
            setSimulatedActiveNode(0);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [chatLoading]);
    const [chatSavedQs, setChatSavedQs] = useState<Record<string, boolean>>({});
    const [chatSavedTakeaways, setChatSavedTakeaways] = useState<Record<string, boolean>>({});
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
    const [activeVersionTab, setActiveVersionTab] = useState<Record<string, 'brief' | 'detailed'>>({});
    const [expandedDetailedSections, setExpandedDetailedSections] = useState<Record<string, boolean>>({});
    const [expandedDiscussionPoints, setExpandedDiscussionPoints] = useState<Record<string, boolean>>({});
    const [selectedPreferenceOptions, setSelectedPreferenceOptions] = useState<Record<string, Record<string, Record<string, { questionText: string, label: string, valueCategory: string, rating?: number }>>>>({});
    const [isOtherSelected, setIsOtherSelected] = useState<Record<string, Record<string, boolean>>>({});

    // 📷 拍照上傳問答相關狀態
    const [attachedImage, setAttachedImage] = useState<{ base64: string, mimeType: string, previewUrl: string, name?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showTrace, setShowTrace] = useState(false);
    const [otherCustomText, setOtherCustomText] = useState<Record<string, Record<string, string>>>({});
    const [otherCustomRating, setOtherCustomRating] = useState<Record<string, Record<string, number>>>({});

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
        
        let processedText = text.replace(/\\n/g, '\n');
        
        const rawLines = processedText.split('\n');
        const cleanedLines = rawLines
            .map(line => {
                let trimmed = line.trim();
                trimmed = trimmed.replace(/\\n/g, '').replace(/\n/g, '');
                trimmed = trimmed.replace(/^[\s•\-*▪●]+\s*/, '');
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

    const toggleAnswer = (qid: string, opt: string) => {
        const current = answers[qid] || [];
        if (current.includes(opt)) {
            setAnswers({...answers, [qid]: current.filter(i => i !== opt)});
        } else {
            setAnswers({...answers, [qid]: [...current, opt]});
        }
    };

    const prepareAnswerPairs = () => {
        return clarifications.map(q => {
            const isPreferenceQ = ('questionText' in q);
            const questionTitle = isPreferenceQ ? (q as any).questionText : (q as any).question;
            
            if (isPreferenceQ) {
                const qid = q.id;
                const msgId = "guided";
                const msgSelections = selectedPreferenceOptions[msgId]?.[qid] || {};
                const otherActive = isOtherSelected[msgId]?.[qid] || false;
                const customTxt = (otherCustomText[msgId]?.[qid] || "").trim();
                const otherRating = otherCustomRating[msgId]?.[qid] || 2;
                
                const answersList: string[] = [];
                Object.values(msgSelections).forEach((sel: any) => {
                    const stars = "⭐".repeat(sel.rating);
                    const ratingLabel = sel.rating === 1 ? "一般重視" : sel.rating === 2 ? "非常重視" : "首要考量";
                    const displayKeyword = sel.label || VALUE_CATEGORY_KEYWORDS[sel.valueCategory];
                    answersList.push(`重視：【${displayKeyword}】（重要程度：${stars} ${ratingLabel}，價值維度：${sel.valueCategory}）`);
                });
                
                if (otherActive && customTxt.length > 0) {
                    const stars = "⭐".repeat(otherRating);
                    const ratingLabel = otherRating === 1 ? "一般重視" : otherRating === 2 ? "非常重視" : "首要考量";
                    answersList.push(`其他想法：【${customTxt}】（重要程度：${stars} ${ratingLabel}，價值維度：其他）`);
                }
                
                return {
                    question: questionTitle,
                    answer: answersList.length > 0 ? answersList.join('；') : "無特定偏好"
                };
            } else {
                if (!q.options || q.options.length === 0) {
                    return {
                        question: questionTitle,
                        answer: otherAnswers[q.id] || "無回答"
                    };
                }
                const selectedOpts = answers[q.id] || [];
                const realAnswers = selectedOpts.filter(o => o !== OTHER_OPTION_LABEL);
                if (selectedOpts.includes(OTHER_OPTION_LABEL)) {
                    const customText = otherAnswers[q.id] || '';
                    if (customText.trim()) {
                        realAnswers.push(`其他補充：${customText}`);
                    }
                }
                return {
                    question: questionTitle,
                    answer: realAnswers.length > 0 ? realAnswers.join('、') : "無回答"
                };
            }
        });
    };

    const handleSendResultFollowUp = async (text: string) => {
        if (!text.trim() || resultFollowUpLoading) return;

        const newUserMsg = { role: 'user' as const, content: text };
        const updatedFollowUps = [...resultFollowUps, newUserMsg];
        setResultFollowUps(updatedFollowUps);
        setResultFollowUpInput('');
        setResultFollowUpLoading(true);

        const baseHistory: ChatTurn[] = [
            { role: 'user', content: concern },
            { role: 'assistant', content: result?.summary || '' }
        ];

        const finalHistory: ChatTurn[] = [
            ...baseHistory,
            ...resultFollowUps.map(m => ({ role: m.role, content: m.content }))
        ];

        try {
            const res = await getConversationalChatResponse(profile, glucoseRecords, text, finalHistory);
            setResultFollowUps(prev => [...prev, { role: 'assistant', content: res.reply }]);
        } catch (e) {
            console.error(e);
            setResultFollowUps(prev => [...prev, { role: 'assistant', content: "⚠️ 唔好意思，系統暫時忙碌，請重試。" }]);
        } finally {
            setResultFollowUpLoading(false);
        }
    };

    // renderAgentTrace 保留定義（技術備用，當前未調用）
    const renderAgentTrace = (currentStep: 'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT') => {
        const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
        let nodes;
        
        if (activeMode === 'GUIDED') {
            const hasRealMessages = chatMessages.some(m => m.role === 'user');
            const activeNodeVal = chatLoading 
                ? (simulatedActiveNode || 4) 
                : (hasRealMessages ? (lastAssistantMsg?.activeNode || 5) : 0);
            nodes = [
                { 
                    id: 'safety', 
                    label: '🛡️ 安全監控', 
                    desc: '急症與心理安全檢測', 
                    status: activeNodeVal >= 1 ? 'completed' : 'pending' 
                },
                { 
                    id: 'intent', 
                    label: '🧭 意圖分流', 
                    desc: '臨床場景智能路由', 
                    status: activeNodeVal > 2 ? 'completed' : (activeNodeVal === 2 ? 'active' : 'pending') 
                },
                { 
                    id: 'preference', 
                    label: '🗣️ 偏好釐清', 
                    desc: '共同決策 (SDM) 偏好探索及細節收集', 
                    status: activeNodeVal > 3 ? 'completed' : (activeNodeVal === 3 ? 'active' : 'pending') 
                },
                { 
                    id: 'reasoner', 
                    label: '📚 臨床推理', 
                    desc: '實證指南 (ADA/HK) 動態知識檢索', 
                    status: activeNodeVal > 4 ? 'completed' : (activeNodeVal === 4 ? 'active' : 'pending') 
                },
                { 
                    id: 'output', 
                    label: '✍️ 整合輸出層', 
                    desc: '低認知負荷、臨床共情編排，生成患者覆診提問備忘', 
                    status: activeNodeVal === 5 ? 'completed' : 'pending' 
                }
            ];
        } else {
            nodes = [
                { id: 'safety', label: '🛡️ 安全監控', desc: '急症與心理安全檢測', status: 'completed' },
                { id: 'intent', label: '🧭 意圖分流', desc: '臨床場景智能路由', status: currentStep === 'INPUT' ? 'pending' : 'completed' },
                { id: 'preference', label: '🗣️ 偏好釐清', desc: '共同決策 (SDM) 偏好探索及細節收集', status: currentStep === 'INPUT' ? 'pending' : (currentStep === 'CLARIFY' ? 'active' : 'completed') },
                { id: 'reasoner', label: '📚 臨床推理', desc: '實證指南 (ADA/HK) 動態知識檢索', status: ['INPUT', 'CLARIFY', 'SUPPLEMENT', 'SELECT_QUESTIONS'].includes(currentStep) ? 'pending' : 'completed' },
                { id: 'output', label: '✍️ 整合輸出層', desc: '低認知負荷、臨床共情編排，生成患者覆診提問備忘', status: currentStep === 'RESULT' ? 'active' : 'pending' }
            ];
        }

        return (
            <div className="premium-card bg-[#F1F5F9]/50 border border-slate-200/80 p-6 md:p-8 rounded-[2rem] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl animate-[spin_6s_linear_infinite]">⚙️</span>
                        <h3 className="font-extrabold text-slate-800 text-lg">LangGraph 糖尿病專家體系決策引擎軌跡</h3>
                    </div>
                    <span className="font-black bg-[#4A6E85]/10 text-[#4A6E85] text-xs px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                        共同決策支援 (Shared Decision Making) 運作中
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {nodes.map((node, index) => {
                        let cardStyle = 'bg-white border-slate-200/60 text-slate-400';
                        let badge = <span className="text-slate-300 font-extrabold text-xs">未激活 (Pending)</span>;
                        
                        if (node.status === 'completed') {
                            cardStyle = 'bg-emerald-50/50 border-emerald-200/80 text-emerald-800 shadow-xs';
                            badge = <span className="bg-emerald-100/80 text-emerald-700 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">✓ Node {index + 1} 已執行</span>;
                        } else if (node.status === 'active' || (activeMode !== 'GUIDED' && currentStep === 'SUPPLEMENT' && node.id === 'preference') || (activeMode !== 'GUIDED' && currentStep === 'SELECT_QUESTIONS' && node.id === 'output')) {
                            cardStyle = 'bg-amber-50/50 border-amber-305 text-amber-800 ring-4 ring-amber-100/50 shadow-xs animate-pulse';
                            badge = <span className="bg-amber-150 text-amber-700 font-black text-xs px-2.5 py-1 rounded-full">⏳ Node {index + 1} 運作中</span>;
                        }

                        return (
                            <div key={node.id} className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${cardStyle}`}>
                                <div>
                                    <h4 className="font-extrabold text-sm md:text-[15px] leading-snug">{node.label}</h4>
                                    <p className="text-xs font-bold leading-normal mt-1 opacity-80">{node.desc}</p>
                                </div>
                                <div className="pt-2.5 border-t border-dashed border-current/10 flex items-center justify-between">
                                    {badge}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-slate-200/60 pt-6">
                    <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsRAGPanelExpanded(!isRAGPanelExpanded)}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            <div>
                                <h4 className={`font-black text-slate-850 flex items-center gap-2 flex-wrap ${isLargeFont ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}>
                                    <span>實時檢索源：糖尿病臨床決策知識底座 (RAG Context)</span>
                                    <span className="bg-[#4A6E85]/10 text-[#4A6E85] text-[10px] font-black px-2 py-0.5 rounded-md">
                                        循證依據可追溯性
                                    </span>
                                </h4>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                    Node 4 (臨床推理節點) 實時檢索與比對的官方循證依據（Evidence-based Guidelines）
                                </p>
                            </div>
                        </div>
                        <span className="text-slate-400 font-extrabold text-xs sm:text-sm hover:text-slate-600 transition-colors whitespace-nowrap">
                            {isRAGPanelExpanded ? '收起 ▴' : '展開檢索源 ▾'}
                        </span>
                    </div>

                    {isRAGPanelExpanded && (
                        <div className="mt-5 space-y-4 animate-soft">
                            <div className="bg-[#4A6E85]/5 border border-[#4A6E85]/10 rounded-2xl p-4 text-xs font-bold text-slate-600 leading-relaxed">
                                <span className="text-base mr-1">💡</span> 
                                <strong>專家查詢說明：</strong>
                                系統採用 <strong>毫秒級 RAG (檢索增強生成)</strong> 技術。當患者輸入血糖、膳食、用藥主訴後，系統在 <strong>Node 4 (臨床推理節點)</strong> 會自動將主訴與下方權威指引進行嵌入向量比對，並即時提取最相關的 1-3 條臨床指南作為 LLM 推理的硬約束，防止 AI 幻覺。
                                <span className="text-[#4A6E85] underline cursor-pointer ml-1" onClick={() => setSelectedKnowledgeKey(selectedKnowledgeKey ? null : "ADA-13")}>
                                    點擊下方指引卡片可查看對應原文 RAG 內容。
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(() => {
                                    const groups = [
                                        { title: "🌎 國際金標準 (ADA 2026)", keys: ["ADA-13", "ADA-6", "ADA-5"] },
                                        { title: "🇭🇰 香港官方指南 (DH / HA)", keys: ["HA-DIET", "CHP-DIET", "EHS-DIET", "HA-SMART"] },
                                        { title: "🍜 本地生活與地道飲食", keys: ["HK-HB", "OUTSIDE-HK", "MONITOR-PRO", "FLUCTUATE-HK"] },
                                        { title: "🌿 中西協作與心理防線", keys: ["TCM-HK", "INSULIN-HK"] }
                                    ];

                                    return groups.map((g, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200/50 rounded-2xl p-3.5 space-y-2.5">
                                            <h5 className="font-extrabold text-[11px] text-slate-500 tracking-wider border-b border-slate-100 pb-1.5">{g.title}</h5>
                                            <div className="space-y-1.5">
                                                {g.keys.map(k => {
                                                    const item = CLINICAL_KNOWLEDGE[k as keyof typeof CLINICAL_KNOWLEDGE];
                                                    if (!item) return null;
                                                    const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
                                                    const currentSources = lastAssistantMsg?.traceability?.sources || result?.traceability?.sources || [];
                                                    const isMatchedInTrace = currentSources.includes(k);
                                                    const isSelected = selectedKnowledgeKey === k;

                                                    let itemBg = "bg-slate-50 hover:bg-slate-100 border-slate-200/60 hover:scale-[1.01]";
                                                    if (isMatchedInTrace) {
                                                        itemBg = isSelected 
                                                            ? "bg-emerald-100/50 border-emerald-400 ring-2 ring-emerald-300/30" 
                                                            : "bg-emerald-50/60 border-emerald-300 animate-[pulse_2s_infinite]";
                                                    } else if (isSelected) {
                                                        itemBg = "bg-[#4A6E85]/10 border-[#4A6E85]/50 ring-2 ring-[#4A6E85]/20";
                                                    }

                                                    return (
                                                        <div
                                                            key={k}
                                                            onClick={() => setSelectedKnowledgeKey(isSelected ? null : k)}
                                                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${itemBg}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-1">
                                                                <span className="font-black text-slate-800 text-[11px] leading-tight flex-1">{item.title}</span>
                                                                <span className="text-[9px] font-extrabold text-slate-400 font-mono">{k}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/20">
                                                                {isMatchedInTrace ? (
                                                                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">🎯 決策命中</span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-slate-400">🟢 備用 (Ready)</span>
                                                                )}
                                                                <span className="text-[9px] font-bold text-[#4A6E85] hover:underline">{isSelected ? "收起" : "詳情"}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {selectedKnowledgeKey && (() => {
                                const activeItem = CLINICAL_KNOWLEDGE[selectedKnowledgeKey as keyof typeof CLINICAL_KNOWLEDGE];
                                if (!activeItem) return null;
                                return (
                                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-2.5 animate-soft">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">🔍</span>
                                                <h5 className="font-black text-sm text-slate-200">實時檢索原文片段 (RAG Preview: {selectedKnowledgeKey})</h5>
                                            </div>
                                            <button onClick={() => setSelectedKnowledgeKey(null)} className="text-xs text-slate-400 hover:text-white font-extrabold cursor-pointer">✕ 關閉</button>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-black text-amber-400">標題：{activeItem.title}</p>
                                            <p className="text-xs leading-relaxed text-slate-300 font-bold tracking-wide">{activeItem.content}</p>
                                        </div>
                                        <div className="bg-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 font-bold border border-slate-800">
                                            🛡️ <strong>臨床可信度驗證：</strong> 該資料來自香港衛生署、醫管局或國際糖尿病醫學學會（ADA），系統在 Node 4 通過特徵向量提取對其進行關聯性排序，並完全作為 LLM 提示詞的上文硬編碼，從而確保輸出結論具備 100% 循證可追溯性。
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleSendChatMessage = async (text: string, customImage?: { base64: string, mimeType: string, previewUrl?: string }) => {
        const imgToSend = customImage || (attachedImage ? { base64: attachedImage.base64, mimeType: attachedImage.mimeType, previewUrl: attachedImage.previewUrl } : undefined);
        const trimmedText = text.trim();

        if ((!trimmedText && !imgToSend) || chatLoading) return;

        const effectiveText = trimmedText || (imgToSend ? "請幫我分析這張藥物相片或處方標籤，說明藥物名稱、用法、注意事項及覆診問醫生的問題。" : "");

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: effectiveText,
            imageAttachment: imgToSend
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setAttachedImage(null);
        setChatLoading(true);

        const previousTurns: ChatTurn[] = chatMessages
            .filter(m => !m.isWelcome)
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        try {
            const res = await getConversationalChatResponse(
                profile,
                glucoseRecords,
                effectiveText,
                previousTurns,
                imgToSend ? { data: imgToSend.base64, mimeType: imgToSend.mimeType } : undefined
            );

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: res.reply,
                optionsComparison: res.optionsComparison,
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
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "⚠️ 唔好意思，系統暫時連線繁忙，請再試一次或重新拍攝相片。"
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const renderChatMode = () => {
        return (
            <div className="space-y-4 animate-soft pb-8">
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

                                {isUser ? (
                                    <div className={`px-5 py-3.5 rounded-2xl leading-relaxed shadow-xs transition-all ${
                                        isLargeFont ? 'text-lg md:text-xl px-7 py-5 font-black' : 'text-sm md:text-[15px] font-bold'
                                    } bg-[#4A6E85] text-white rounded-tr-none max-w-[80%]`}>
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
                                    <div className="w-full max-w-[96%] sm:max-w-[90%] bg-white rounded-2xl rounded-tl-none border border-slate-200/90 shadow-sm overflow-hidden transition-all">
                                        
                                        {msg.safety?.isEmergency && (
                                            <div className="p-4 sm:p-5 bg-red-50 border-b-2 border-red-500 text-red-900 space-y-3 animate-soft">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-2xl animate-bounce">🚨</span>
                                                    <h4 className="font-black text-base md:text-lg">急性危急徵狀警示</h4>
                                                </div>
                                                <p className="text-sm font-black leading-relaxed">
                                                    {msg.safety.message || "偵測到可能危及生命之情況，請立即求醫或尋求協助！"}
                                                </p>
                                                <div className="bg-white/90 p-3.5 rounded-xl border border-red-100 text-xs font-bold leading-relaxed space-y-1 text-slate-800">
                                                    <p className="text-red-700 font-extrabold">⚠️ 臨床安全防護與香港求助指引：</p>
                                                    <p>1. 請立即撥打 <strong>999</strong> 召喚救護車，或迅速往最近的急症室求醫。</p>
                                                    <p>2. 對於急性低血糖手震冷汗：若神智清醒，實施「15/15 原則」，立即食用 15g 快速糖（如 3 粒方糖、半罐含糖汽水或一盒果汁），靜待 15 分鐘重新測量。</p>
                                                    <p>3. 心理健康熱線：撒瑪利亞防止自殺會 2389 2222 / 生命熱線 2382 0000</p>
                                                </div>
                                                <div className="flex gap-2.5 pt-1">
                                                    <a href="tel:999" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-center py-2.5 rounded-xl text-sm transition-all shadow-xs">
                                                        📞 立即撥打 999
                                                    </a>
                                                    <a href="tel:23892222" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-center py-2.5 rounded-xl text-xs transition-all shadow-xs">
                                                        📞 撒瑪利亞熱線
                                                    </a>
                                                </div>
                                            </div>
                                        )}

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

                                        {msg.activeNode === 3 && msg.preferenceQuestions && msg.preferenceQuestions.length > 0 && (
                                            <div className="p-4 sm:p-5 bg-amber-50/50 border-t border-amber-200/80 space-y-4 animate-soft">
                                                {msg.preferenceQuestions.map((pq: any) => {
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
                                                                {pq.options.map((opt: any, optIdx: number) => {
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
                                                                                    next[msgId] = { ...currentMsg, [pq.id]: currentPq };
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

                                                                <div
                                                                    onClick={() => {
                                                                        setIsOtherSelected(prev => ({
                                                                            ...prev,
                                                                            [msgId]: { ...(prev[msgId] || {}), [pq.id]: !otherActive }
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
                                                                                [msgId]: { ...(prev[msgId] || {}), [pq.id]: e.target.value }
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

                                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-amber-100/60 mt-3">
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
                                                            
                                                            msg.preferenceQuestions.forEach((pq: any) => {
                                                                const pqSelections = msgSelections[pq.id] || {};
                                                                const isOther = msgOthers[pq.id];
                                                                const customTxt = (msgTexts[pq.id] || "").trim();
                                                                
                                                                Object.values(pqSelections).forEach((sel: any) => {
                                                                    parts.push(`- 針對「${sel.questionText}」，我最看重：【${sel.label}】（價值維度：${sel.valueCategory}）`);
                                                                    submittedCount++;
                                                                });

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
                                                            msg.preferenceQuestions.forEach((pq: any) => {
                                                                const pqSelections = msgSelections[pq.id] || {};
                                                                const isOther = msgOthers[pq.id];
                                                                const customTxt = (msgTexts[pq.id] || "").trim();
                                                                validCount += Object.keys(pqSelections).length;
                                                                if (isOther && customTxt.length > 0) validCount++;
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
                                                                msg.preferenceQuestions.forEach((pq: any) => {
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

                                        {msg.activeNode !== 3 && msg.briefVersion?.takeHomeMessages && msg.briefVersion.takeHomeMessages.length > 0 && (
                                            <div className="bg-emerald-50/80 border-t border-b border-emerald-200/70 p-4 sm:p-5 space-y-3 animate-soft">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-lg text-xs shadow-xs font-black">
                                                            💡
                                                        </span>
                                                        <h4 className={`font-black text-emerald-950 tracking-tight ${isLargeFont ? 'text-base sm:text-lg' : 'text-xs sm:text-[13px]'}`}>
                                                            重點速覽
                                                        </h4>
                                                    </div>
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700/90 hidden xs:inline">
                                                        點擊 🔖 可存入問診備忘
                                                    </span>
                                                </div>
                                                
                                                <ul className="space-y-2.5 pt-0.5">
                                                    {msg.briefVersion.takeHomeMessages.map((item: string, iIdx: number) => {
                                                        const takeawayKey = (msg.id || index.toString()) + "-tw-" + iIdx;
                                                        const isSaved = chatSavedTakeaways[takeawayKey] || false;
                                                        return (
                                                            <li key={iIdx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 bg-white/95 p-3 sm:p-3.5 rounded-xl border border-emerald-150/70 shadow-xs hover:border-emerald-300/80 transition-all">
                                                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                                    <span className="flex-shrink-0 w-5 h-5 bg-emerald-600 text-white text-[11px] font-black rounded-full flex items-center justify-center mt-0.5 shadow-2xs">
                                                                        {iIdx + 1}
                                                                    </span>
                                                                    <span className={`text-slate-800 leading-relaxed ${isLargeFont ? 'text-[17px] sm:text-[18px] font-extrabold' : 'text-[13px] sm:text-[14px] font-bold'}`}>
                                                                        {item.split(/\*\*(.*?)\*\*/g).map((part: string, pIdx: number) => {
                                                                            if (pIdx % 2 === 1) {
                                                                                return (
                                                                                    <strong key={pIdx} className="font-black text-emerald-950 bg-emerald-100/60 px-1 py-0.5 rounded-sm mx-0.5">
                                                                                        {part}
                                                                                    </strong>
                                                                                );
                                                                            }
                                                                            return part;
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSaved) return;
                                                                        const cleanText = item.replace(/\*\*/g, '').trim();
                                                                        saveDoctorQuestions([cleanText]);
                                                                        setChatSavedTakeaways(prev => ({ ...prev, [takeawayKey]: true }));
                                                                        showToast("已存入「問題紀錄」清單 🔖");
                                                                    }}
                                                                    className={`self-end sm:self-start text-[11px] font-black px-2.5 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                                                        isSaved
                                                                            ? "bg-emerald-100 text-emerald-800 pointer-events-none"
                                                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 shadow-2xs"
                                                                    }`}
                                                                >
                                                                    {isSaved ? "✓ 已存入備忘" : "🔖 存為問診備忘"}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}

                                        {msg.activeNode !== 3 && msg.detailedVersion && (msg.detailedVersion.generalExplanation || (msg.detailedVersion.optionComparison && msg.detailedVersion.optionComparison.length > 0)) && (
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
                                                        {msg.detailedVersion.generalExplanation && (
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
                                                        )}

                                                        {msg.detailedVersion.optionComparison && msg.detailedVersion.optionComparison.length > 0 && (
                                                            <div className="space-y-2.5 pt-2 border-t border-slate-200/70">
                                                                <p className="text-[11px] font-black text-[#4A6E85] uppercase tracking-wider flex items-center gap-1">
                                                                    <span>⚖️</span>
                                                                    <span>治療方案利弊考量（供覆診與醫生商討）：</span>
                                                                </p>
                                                                {msg.detailedVersion.optionComparison.map((opt: any, optIdx: number) => (
                                                                    <div key={optIdx} className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-4 h-4 bg-[#4A6E85] text-white text-[10px] font-black flex items-center justify-center rounded-full">
                                                                                {optIdx + 1}
                                                                            </span>
                                                                            <span className="font-extrabold text-slate-900 text-sm">{opt.option}</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                                            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                                                                                <p className="text-[10px] font-black text-emerald-800 mb-1">👍 優勢效益 (Pros)</p>
                                                                                {renderBulletPoints(opt.pros, true, "text-[11px]", "font-bold")}
                                                                            </div>
                                                                            <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                                                                                <p className="text-[10px] font-black text-amber-800 mb-1">⚠️ 顧慮隱憂 (Cons)</p>
                                                                                {renderBulletPoints(opt.cons, false, "text-[11px]", "font-bold")}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                    </div>
                                )}
                            </div>
                        );
                    })}

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

                {(() => {
                    const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
                    if (lastAssistantMsg?.activeNode === 3) return null;
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
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="拍照或上傳相片/食物/藥物包裝"
                                className="h-8 bg-[#4A6E85]/10 hover:bg-[#4A6E85]/20 text-[#4A6E85] text-xs font-black px-3 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs leading-none"
                            >
                                <span className="text-sm leading-none flex items-center justify-center">📷</span>
                                <span className="hidden sm:inline leading-none">拍照/上傳</span>
                            </button>

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
    };

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center space-y-10 animate-soft text-center">
            <div className="relative mx-auto">
                <div className="w-20 h-20 border-4 border-[#4A6E85]/10 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#4A6E85] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-3">
                <p className="text-[#4A6E85] text-xl font-black tracking-wider">正在為您細心整理資料...</p>
                <p className="text-slate-400 font-medium">請稍候，多智能體糖尿病健康建議即將送達</p>
            </div>
        </div>
    );

    return (
        <div className={`space-y-4 animate-soft relative ${isLargeFont ? 'spacy-container !px-0' : ''}`}>
            
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="flex items-center gap-2.5 bg-emerald-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/40 text-xs sm:text-sm font-black backdrop-blur-md">
                        <span>✨</span>
                        <span>{toastMessage}</span>
                        <button
                            onClick={() => setView(View.SavedQuestions)}
                            className="ml-2 underline text-emerald-200 hover:text-white cursor-pointer"
                        >
                            查看清單 ➔
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-2 max-w-xl mx-auto px-1">
                <button
                    type="button"
                    onClick={() => setIsQuickMemoOpen(true)}
                    className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                    title="聊天時隨手記下想問醫生的問題"
                >
                    <span>📝</span>
                    <span>隨手記問診備忘</span>
                    <span className="bg-amber-200/80 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {(profile.savedDoctorQuestions || []).length}
                    </span>
                </button>

                {chatMessages.length > 1 && (
                    <button
                        type="button"
                        onClick={handleClearChatHistory}
                        className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                        title="清空對話紀錄並開啟新對話"
                    >
                        <span>🗑️</span>
                        <span>開啟新對話</span>
                    </button>
                )}
            </div>

            {renderChatMode()}

            {isQuickMemoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-soft">
                    <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center text-lg font-black shadow-xs">
                                    📝
                                </span>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                        隨手記下想問醫生的問題
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-bold">
                                        聊天時想起任何疑惑，隨時寫下，覆診時自動匯出！
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsQuickMemoOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[11px] font-black text-slate-400">💡 常見問診靈感（點擊填入）：</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    "想向醫生請教服藥時間可否配合生活作息調整？",
                                    "最近服藥後有些腸胃不適，是否有替代方案？",
                                    "想諮詢下次化驗是否需要加驗糖化血色素或腎功能？",
                                    "平時血糖波動較大，是否適合使用連續血糖儀 (CGM)？"
                                ].map((preset, pIdx) => (
                                    <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => setQuickMemoInput(preset)}
                                        className="text-left text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer leading-relaxed"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={quickMemoInput}
                                    onChange={(e) => setQuickMemoInput(e.target.value)}
                                    placeholder="在此輸入您想問醫生的問題（例如：想問下醫生呢隻藥會唔會令我頭暈...）"
                                    rows={3}
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all resize-none"
                                />
                                <button
                                    type="button"
                                    onClick={toggleQuickMemoVoice}
                                    className={`absolute right-3 bottom-3.5 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                                        isQuickMemoListening 
                                            ? "bg-rose-500 text-white animate-pulse" 
                                            : "bg-slate-200 hover:bg-amber-200 text-slate-700 hover:text-amber-950"
                                    }`}
                                >
                                    <span>🎤</span>
                                    <span>{isQuickMemoListening ? "正在聆聽..." : "語音輸入"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsQuickMemoOpen(false);
                                    setView(View.SavedQuestions);
                                }}
                                className="text-xs font-bold text-[#4A6E85] hover:underline cursor-pointer"
                            >
                                查看全部已存問題 ({(profile.savedDoctorQuestions || []).length}) ➔
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickMemoOpen(false)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    取消
                                </button>
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
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                        quickMemoInput.trim()
                                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md active:scale-95"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    ✓ 保存到問診清單
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
