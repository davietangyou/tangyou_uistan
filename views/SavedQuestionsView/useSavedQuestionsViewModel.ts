import { useState } from 'react';
import { analyzeSavedQuestions } from '../../services/geminiService';
import {
    toggleNextClinicQuestionOnProfile,
    addSavedDoctorQuestion,
    deleteSavedDoctorQuestion,
    editSavedDoctorQuestion,
    saveNextClinicDate,
    addNextClinicQuestion,
} from '../../domain';
import type { SavedQuestionsViewProps } from './types';

export function useSavedQuestionsViewModel({
    profile,
    setProfile,
    setView,
    isLargeFont = false
}: SavedQuestionsViewProps) {
    const savedQuestions = profile.savedDoctorQuestions || [];
    const nextClinicQuestions = profile.nextClinicQuestions || [];
    const nextClinicDate = profile.nextClinicDate || '';

    // 本地編輯與新增狀態
    const [isAdding, setIsAdding] = useState(false);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    // 新增下次問診清單問題
    const [isAddingNextQ, setIsAddingNextQ] = useState(false);
    const [newNextQText, setNewNextQText] = useState('');

    // 下次問診日期編輯狀態
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [tempClinicDate, setTempClinicDate] = useState(nextClinicDate);

    // AI 總結狀態
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        summary: string;
        categories?: {
            categoryName: string;
            description: string;
            frequency: string;
        }[];
        recommendedQuestions: { question: string; categoryTag?: string }[];
        suggestedDoctorPrep?: string[];
    } | null>(null);

    // AI 總結是否展開（預設自動展開，若已有問題則自動加載）
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

    // 所有已保存問題庫是否展開（預設收起）
    const [isSavedListExpanded, setIsSavedListExpanded] = useState(false);

    // 就診準備核對清單狀態（本地勾選）
    const [checkedPrepItems, setCheckedPrepItems] = useState<Record<number, boolean>>({});

    // 手動觸發/重整 AI 總結（點擊後再運行）
    const handleRefreshAnalysis = async () => {
        if (savedQuestions.length === 0 || analysisLoading) return;
        setAnalysisLoading(true);
        setAnalysisError(null);
        try {
            const res = await analyzeSavedQuestions(savedQuestions);
            setAnalysisResult(res);
        } catch (e) {
            console.error("AI 總結載入失敗", e);
            setAnalysisError("唔好意思，暫時未能連接 AI 整理服務，請稍後再按一下重試。");
        } finally {
            setAnalysisLoading(false);
        }
    };

    // 加入/移除下次問診清單
    const toggleNextClinicQuestion = (qText: string) => {
        setProfile(toggleNextClinicQuestionOnProfile(profile, qText));
    };

    // 手動新增問題至全部保存記錄
    const handleAddQuestion = () => {
        const updated = addSavedDoctorQuestion(profile, newQuestionText);
        if (!updated) return;
        setProfile(updated);
        setNewQuestionText('');
        setIsAdding(false);
    };

    // 手動刪除保存問題
    const handleDeleteQuestion = (indexToDelete: number) => {
        setProfile(deleteSavedDoctorQuestion(profile, indexToDelete));
    };

    // 開始編輯保存問題
    const startEditing = (idx: number, text: string) => {
        setEditingIndex(idx);
        setEditingText(text);
    };

    // 儲存編輯後的問題
    const handleSaveEdit = () => {
        if (editingIndex === null) return;
        const updated = editSavedDoctorQuestion(profile, editingIndex, editingText);
        if (!updated) return;
        setProfile(updated);
        setEditingIndex(null);
        setEditingText('');
    };

    // 儲存下次問診時間
    const handleSaveClinicDate = () => {
        setProfile(saveNextClinicDate(profile, tempClinicDate));
        setIsEditingDate(false);
    };

    // 手動新增專屬下次問診清單問題
    const handleAddNextClinicQuestion = () => {
        const updated = addNextClinicQuestion(profile, newNextQText);
        if (!updated) return;
        setProfile(updated);
        setNewNextQText('');
        setIsAddingNextQ(false);
    };

    return {
        profile,
        setProfile,
        setView,
        isLargeFont,
        savedQuestions,
        nextClinicQuestions,
        nextClinicDate,
        isAdding, setIsAdding,
        newQuestionText, setNewQuestionText,
        editingIndex, setEditingIndex,
        editingText, setEditingText,
        isAddingNextQ, setIsAddingNextQ,
        newNextQText, setNewNextQText,
        isEditingDate, setIsEditingDate,
        tempClinicDate, setTempClinicDate,
        analysisLoading, setAnalysisLoading,
        analysisError, setAnalysisError,
        analysisResult, setAnalysisResult,
        isAnalysisExpanded, setIsAnalysisExpanded,
        isSavedListExpanded, setIsSavedListExpanded,
        checkedPrepItems, setCheckedPrepItems,
        handleRefreshAnalysis,
        toggleNextClinicQuestion,
        handleAddQuestion,
        handleDeleteQuestion,
        startEditing,
        handleSaveEdit,
        handleSaveClinicDate,
        handleAddNextClinicQuestion,
    };
}

export type SavedQuestionsViewModel = ReturnType<typeof useSavedQuestionsViewModel>;
