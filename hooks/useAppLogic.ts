/**
 * hooks/useAppLogic.ts
 *
 * 核心业务逻辑 Hook（對外入口，維持不變）。
 *
 * 職責：
 * 1. 整合所有頁面視圖需要的狀態 (Profile, Glucose, Consult等)。
 * 2. 管理數據的持久化 (LocalStorage)。
 * 3. 包含具體的業務處理函數 (如添加血糖、生成報告、文件下載)。
 * 4. 協調數據服務 (DataService) 進行上傳。
 * 5. 整合語音服務 (useSpeechFocus)。
 *
 * 實作已拆到 hooks/appLogic/*，本檔只負責組合並回傳與拆分前相同的公開介面。
 */

import {useMemo, useState} from 'react';
import {View} from '../utils/types';
import {useSpeechFocus} from './useSpeechFocus';
import {useConsultState} from './appLogic/useConsultState';
import {useDataUpload} from './appLogic/useDataUpload';
import {useFontPreference} from './appLogic/useFontPreference';
import {useProfileState} from './appLogic/useProfileState';
import {useRecordsState} from './appLogic/useRecordsState';

export const useAppLogic = () => {
    // 1. 引入拆分出的語音 Hook
    // 包含：語音識別狀態、錄音日誌、播放狀態、麥克風點擊處理、音頻播放處理
    const speechLogic = useSpeechFocus();
    const {audioLogs} = speechLogic; // 我们需要获取 audioLogs 用于上传流程

    // 2. Profile State (個人資料)
    const {
        profile, setProfile,
        onboardingStep, setOnboardingStep,
        updateProfileWithExtraction, toggleCondition, saveDoctorQuestions,
    } = useProfileState();

    // 3. Navigation State (导航与视图)
    const [view, setView] = useState<View>(() => {
        if (!profile.age || !profile.gender) return View.Onboarding;
        return View.Home;
    });

    // 4. Glucose State (血糖记录)
    const {
        glucoseRecords, setGlucoseRecords,
        newGlucose, setNewGlucose,
        hba1cRecords, setHba1cRecords,
        newHbA1c, setNewHbA1c,
        addGlucoseRecord, addHbA1cRecord,
    } = useRecordsState();

    // 5. Consult State (AI 问诊)
    const {
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
    } = useConsultState();

    // 7. Accessibility State (老友大字模式 / 護眼大字體色調)
    const {isLargeFont, setIsLargeFont} = useFontPreference();

    // 8. URL Params Logic (页面参数检查)
    // 未接線：此旗標恒為 true，但目前沒有導航或頁面讀取它以進入 DetailView。請勿刪除。
    const showDetailTab = useMemo(() => {
        // const params = new URLSearchParams(window.location.search);
        // return params.get('showdetail') === 'true'; // 不做判定，改为默认展示 (参考原代码注释)
        return true;
    }, []);

    // 6. Upload State (数据上报) — 在依賴項齊備後初始化，公開回傳形狀不變
    const {isUploading, uploadLogs, handleUploadData} = useDataUpload({
        audioLogs,
        profile,
        glucoseRecords,
        concern,
        clarifications,
        answers,
        supplementalAnswer,
        result,
        consultStep,
    });

    return {
        // 状态
        profile, setProfile,
        view, setView,
        onboardingStep, setOnboardingStep,
        glucoseRecords, setGlucoseRecords,
        newGlucose, setNewGlucose,
        concern, setConcern,
        consultStep, setConsultStep,
        clarifications, setClarifications,
        answers, setAnswers,
        supplementalAnswer, setSupplementalAnswer,
        suggestedQuestions, setSuggestedQuestions,
        selectedQuestionTexts, setSelectedQuestionTexts,
        result, setResult,
        history, setHistory,
        loading, setLoading,
        selectedQuestions, setSelectedQuestions,
        hba1cRecords, setHba1cRecords,
        newHbA1c, setNewHbA1c,

        // 上传状态
        isUploading, uploadLogs,

        // 配置
        showDetailTab,
        isLargeFont, setIsLargeFont,

        // 业务方法
        addGlucoseRecord,
        addHbA1cRecord,
        handleDownload,
        updateProfileWithExtraction,
        toggleCondition,
        saveDoctorQuestions,
        handleUploadData,

        // 语音相关 (透传自 useSpeechFocus，供 UI 组件使用)
        ...speechLogic
    };
};
