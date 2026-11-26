import {useState} from 'react';
import type {ChatTurn, ClarificationQuestion, DecisionResult} from '../../utils/types';

export function useConsultState() {
    const [concern, setConcern] = useState('');
    const [consultStep, setConsultStep] = useState<'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT'>('INPUT');
    const [clarifications, setClarifications] = useState<ClarificationQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [supplementalAnswer, setSupplementalAnswer] = useState('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [selectedQuestionTexts, setSelectedQuestionTexts] = useState<string[]>([]);
    const [result, setResult] = useState<DecisionResult | null>(null);
    const [history, setHistory] = useState<ChatTurn[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // 生成并下載問診筆記
    const handleDownload = (customQuestions?: string[]) => {
        if (!result) return;
        const questionsToPrint = customQuestions !== undefined ? customQuestions : result.doctorQuestions;
        const content = `
糖友導航 - 我的問診筆記
生成日期: ${new Date().toLocaleDateString('zh-HK')}

【一句話重點】
${result.oneSentenceSummary}

【分析摘要】
${result.summary}

【我最在意的價值】
${result.patientValuesSummary}

【建議考慮方案】
${result.optionsComparison.map(o => `* ${o.option}\n  - 好處: ${o.pros}\n  - 考慮: ${o.cons}`).join('\n')}

【問醫生的問題】
${questionsToPrint.length > 0 ? questionsToPrint.map((q, i) => `${i + 1}. ${q}`).join('\n') : '(未勾選特定問題)'}

---
此筆記由 AI 輔助生成，僅供參考，請務必諮詢您的醫生。
    `.trim();

        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `糖友問診筆記_${new Date().toLocaleDateString('zh-HK').replace(/\//g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 自動更新 Profile (Split Write-back)

    return {
        concern, setConcern,
        consultStep, setConsultStep,
        clarifications, setClarifications,
        answers, setAnswers,
        supplementalAnswer, setSupplementalAnswer,
        suggestedQuestions, setSuggestedQuestions,
        selectedQuestionTexts, setSelectedQuestionTexts,
        result, setResult,
        history, setHistory,
        selectedQuestions, setSelectedQuestions,
        loading, setLoading,
        handleDownload,
    };
}
