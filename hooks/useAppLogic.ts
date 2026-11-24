/**
 * src/hooks/useAppLogic.ts
 *
 * 核心业务逻辑 Hook
 *
 * 职责：
 * 1. 整合所有页面视图需要的状态 (Profile, Glucose, Consult等)。
 * 2. 管理数据的持久化 (LocalStorage)。
 * 3. 包含具体的业务处理函数 (如添加血糖、生成报告、文件下载)。
 * 4. 协调数据服务 (DataService) 进行上传。
 * 5. 整合语音服务 (useSpeechFocus)。
 */

import {useEffect, useMemo, useState} from 'react';
import {ClarificationQuestion, DecisionResult, GlucoseRecord, UserProfile, View, HbA1cRecord, ChatTurn} from '../utils/types';
import {useSpeechFocus} from './useSpeechFocus';
import * as DataService from '../services/dataService';

export const useAppLogic = () => {
    // 1. 引入拆分出的语音 Hook
    // 包含：语音识别状态、录音日志、播放状态、麦克风点击处理、音频播放处理
    const speechLogic = useSpeechFocus();
    const {audioLogs} = speechLogic; // 我们需要获取 audioLogs 用于上传流程

    // 2. Profile State (個人資料)
    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('dia_profile');
        if (saved) {
            const parsed = JSON.parse(saved);
            const conditionDetails = parsed.conditionDetails || {};
            const dmYears = parsed.yearsWithDiabetes || conditionDetails?.DM?.years || '';
            if (dmYears) {
                conditionDetails.DM = { ...(conditionDetails.DM || {}), years: dmYears };
            }
            // 賦予預設值以防舊數據缺失新欄位
            return {
                diabetesType: parsed.diabetesType || 'UNKNOWN',
                isInsulinUser: parsed.isInsulinUser || false,
                hasCaregiverSupport: parsed.hasCaregiverSupport || false,
                hasNoCaregiverSupport: parsed.hasNoCaregiverSupport || false,
                savedDoctorQuestions: parsed.savedDoctorQuestions || [],
                nextClinicDate: parsed.nextClinicDate || '',
                nextClinicQuestions: parsed.nextClinicQuestions || [],
                bmi: parsed.bmi || '',
                ...parsed,
                yearsWithDiabetes: dmYears,
                conditionDetails: conditionDetails,
                clinicTypes: parsed.clinicTypes || (parsed.clinicType ? [parsed.clinicType] : [])
            };
        }
        return {
            age: '',
            gender: '',
            bmi: '',
            height: '',
            weight: '',
            weightUnit: 'kg',
            lifestyle: '',
            diabetesType: 'UNKNOWN',
            otherDiabetesType: '',
            yearsWithDiabetes: '',
            hypertensionYears: '',
            livingSituation: '',
            medications: '',
            otherConditions: '',
            conditions: [],
            conditionDetails: {},
            hypoExperience: '',
            glucoseMonitoring: '',
            dietHabits: [],
            dietHabitsOther: '',
            exerciseWeekly: '',
            exerciseDaysPerWeek: '',
            exerciseMinutesPerSession: '',
            exerciseTypes: [],
            sleepQuality: '',
            stressMood: '',
            clinicType: undefined,
            clinicTypes: [],
            clinicTypeOther: '',
            isInsulinUser: false,
            hasCaregiverSupport: false,
            hasNoCaregiverSupport: false,
            savedDoctorQuestions: [],
            nextClinicDate: '',
            nextClinicQuestions: []
        };
    });

    // 3. Navigation State (导航与视图)
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [view, setView] = useState<View>(() => {
        if (!profile.age || !profile.gender) return View.Onboarding;
        return View.Home;
    });

    // 4. Glucose State (血糖记录)
    const [glucoseRecords, setGlucoseRecords] = useState<GlucoseRecord[]>(() => {
        const saved = localStorage.getItem('dia_glucose');
        return saved ? JSON.parse(saved) : [];
    });

    const [hba1cRecords, setHba1cRecords] = useState<HbA1cRecord[]>(() => {
        const saved = localStorage.getItem('dia_hba1c');
        return saved ? JSON.parse(saved) : [];
    });

    const [newGlucose, setNewGlucose] = useState<{
        value: string;
        timeType: GlucoseRecord['timeType'] | '';
        symptoms: string[];
        mealTag?: GlucoseRecord['mealTag'];
        dietNote?: string;
        exerciseNote?: string;
        illnessNote?: string;
        medicationNote?: string;
        bpSystolic?: string;
        bpDiastolic?: string;
        pulse?: string;
        weight?: string;
        mood?: string;
        customTimestamp?: number;
        customDateStr?: string;
    }>({
        value: '',
        timeType: '',
        symptoms: [],
        mealTag: undefined,
        dietNote: '',
        exerciseNote: '',
        illnessNote: '',
        medicationNote: '',
        bpSystolic: '',
        bpDiastolic: '',
        pulse: '',
        weight: '',
        mood: '',
        customTimestamp: undefined,
        customDateStr: undefined
    });
    const [newHbA1c, setNewHbA1c] = useState({value: '', date: new Date().toISOString().split('T')[0]});

    // 5. Consult State (AI 问诊)
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

    // 6. Upload State (数据上报)
    const [isUploading, setIsUploading] = useState(false);
    const [uploadLogs, setUploadLogs] = useState<string[]>([]);

    // 7. Accessibility State (老友大字模式 / 護眼大字體色調)
    const [isLargeFont, setIsLargeFont] = useState<boolean>(() => {
        const saved = localStorage.getItem('dia_large_font');
        return saved ? saved === 'true' : true; // 預設開啟大字護老模式
    });

    // 8. URL Params Logic (页面参数检查)
    const showDetailTab = useMemo(() => {
        // const params = new URLSearchParams(window.location.search);
        // return params.get('showdetail') === 'true'; // 不做判定，改为默认展示 (参考原代码注释)
        return true;
    }, []);

    // 9. Persistence Effects (数据持久化)
    useEffect(() => localStorage.setItem('dia_profile', JSON.stringify(profile)), [profile]);
    useEffect(() => localStorage.setItem('dia_glucose', JSON.stringify(glucoseRecords)), [glucoseRecords]);
    useEffect(() => localStorage.setItem('dia_hba1c', JSON.stringify(hba1cRecords)), [hba1cRecords]);
    useEffect(() => localStorage.setItem('dia_large_font', String(isLargeFont)), [isLargeFont]);

    // === Helper Functions ===

    // 添加血糖或症狀記錄
    const addGlucoseRecord = () => {
        let val = parseFloat(newGlucose.value);
        if (!isNaN(val) && val < 0) {
            val = 0;
        }
        const hasSymptoms = newGlucose.symptoms && newGlucose.symptoms.length > 0;
        
        // 如果既沒有輸入有效數值，也沒有選擇任何症狀，則不作處理
        if (isNaN(val) && !hasSymptoms) return;

        // 如果沒有選擇測量時間點，提示用戶選擇
        if (!newGlucose.timeType) {
            alert('請先選擇「測量時間點」噢！');
            return;
        }

        const recordDate = newGlucose.customTimestamp 
            ? new Date(newGlucose.customTimestamp) 
            : new Date();
        const timestamp = recordDate.getTime();
        
        // Format display date: YYYY/MM/DD HH:mm or MM/DD HH:mm
        const dateStr = newGlucose.customDateStr || recordDate.toLocaleDateString('zh-HK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(/\//g, '/');

        const record: GlucoseRecord = {
            id: timestamp.toString() + '_' + Math.random().toString(36).substr(2, 4),
            value: isNaN(val) ? '' : val.toFixed(1),
            timeType: newGlucose.timeType as GlucoseRecord['timeType'],
            timestamp: timestamp,
            date: dateStr,
            symptoms: newGlucose.symptoms || [],
            mealTag: newGlucose.mealTag,
            dietNote: newGlucose.dietNote || '',
            exerciseNote: newGlucose.exerciseNote || '',
            illnessNote: newGlucose.illnessNote || '',
            medicationNote: newGlucose.medicationNote || '',
            bpSystolic: newGlucose.bpSystolic || '',
            bpDiastolic: newGlucose.bpDiastolic || '',
            pulse: newGlucose.pulse || '',
            weight: newGlucose.weight || '',
            mood: newGlucose.mood || ''
        };
        setGlucoseRecords([record, ...glucoseRecords].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        setNewGlucose({
            value: '', 
            timeType: '', 
            symptoms: [], 
            mealTag: undefined, 
            dietNote: '', 
            exerciseNote: '', 
            illnessNote: '',
            medicationNote: '',
            bpSystolic: '',
            bpDiastolic: '',
            pulse: '',
            weight: '',
            mood: '',
            customTimestamp: undefined,
            customDateStr: undefined
        });
    };

    // 添加 HbA1c 記錄
    const addHbA1cRecord = () => {
        const val = parseFloat(newHbA1c.value);
        if (isNaN(val)) return;
        const record: HbA1cRecord = {
            id: new Date().getTime().toString(),
            value: val.toFixed(1),
            date: newHbA1c.date,
            timestamp: new Date(newHbA1c.date).getTime()
        };
        setHba1cRecords([record, ...hba1cRecords].sort((a, b) => b.timestamp - a.timestamp));
        setNewHbA1c({...newHbA1c, value: ''});
    };

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
    const updateProfileWithExtraction = (extracted?: DecisionResult['extractedProfileData']) => {
        if (!extracted) return;
        const updated = DataService.applyProfileUpdate(profile, extracted);
        setProfile(updated);
    };

    // 切換病症狀態
    const toggleCondition = (cond: string) => {
        const current = profile.conditions || [];
        if (cond === 'NONE') {
            setProfile({...profile, conditions: ['NONE']});
            return;
        }
        let next = current.filter(c => c !== 'NONE');
        if (next.includes(cond)) {
            next = next.filter(c => c !== cond);
        } else {
            next = [...next, cond];
        }
        setProfile({...profile, conditions: next});
    };

    // 保存醫生問題
    const saveDoctorQuestions = (questions: string[]) => {
        if (!questions.length) return;
        const current = profile.savedDoctorQuestions || [];
        // 合併並去重，保持最新
        const updated = [...new Set([...questions, ...current])];
        setProfile({...profile, savedDoctorQuestions: updated});
    };

    // 上报完整数据流程 (Refactored using DataService)
    // 核心逻辑保留：遍历录音 -> 上传 -> 获取URL -> 组装JSON -> 上传JSON
    const handleUploadData = async () => {
        setIsUploading(true);
        setUploadLogs([]);
        const addLog = (msg: string) => setUploadLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            addLog('準備開始上報...');

            // 1. 上傳錄音
            const processedAudioLogs = [];
            for (let i = 0; i < audioLogs.length; i++) {
                const log = audioLogs[i];
                const ext = log.blob.type.includes('webm') ? 'webm' :
                    log.blob.type.includes('mp4') ? 'mp4' : 'bin';
                const filename = `audio_${log.timestamp}_${i}.${ext}`;

                addLog(`正在上傳錄音 (${i + 1}/${audioLogs.length}): ${filename}...`);

                try {
                    // 调用 DataService 上传单文件
                    const downloadUrl = await DataService.uploadFile(log.blob, filename);
                    processedAudioLogs.push({
                        id: log.id,
                        timestamp: log.timestamp,
                        transcript: log.transcript,
                        url: downloadUrl
                    });
                    addLog(`錄音 ${i + 1} 上傳成功`);
                } catch (e: any) {
                    addLog(`錄音 ${i + 1} 上傳失敗: ${e.message}`);
                    // 即使失敗也保留紀錄，但沒有 URL
                    processedAudioLogs.push({
                        id: log.id,
                        timestamp: log.timestamp,
                        transcript: log.transcript,
                        url: null,
                        error: e.message
                    });
                }
            }

            // 2. 構建大 JSON
            addLog('正在生成完整數據報告...');
            const fullReport = {
                meta: {
                    generatedAt: new Date().toISOString(),
                    version: '1.0'
                },
                profile: profile,
                glucoseRecords: glucoseRecords,
                consultation: {
                    concern: concern,
                    clarifications: clarifications,
                    answers: answers,
                    supplementalAnswer: supplementalAnswer,
                    result: result
                },
                audioLogs: processedAudioLogs
            };

            const jsonString = JSON.stringify(fullReport, null, 2);
            const jsonBlob = new Blob([jsonString], {type: 'application/json'});
            const jsonFilename = `report_${new Date().getTime()}.json`;

            // 3. 上傳大 JSON
            addLog('正在上傳總覽數據文件...');
            // 调用 DataService 上传报告
            const reportUrl = await DataService.uploadFile(jsonBlob, jsonFilename);

            addLog(`數據文件上傳成功！`);
            addLog(`文件 ID: ${reportUrl.split('/').pop()}`);
            addLog('=== 上報流程完成 ===');

        } catch (e: any) {
            console.error(e);
            addLog(`[錯誤] 上報失敗: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Effect: 當問診報告生成後自動觸發上報
    useEffect(() => {
        if (consultStep === 'RESULT' && result && !isUploading && uploadLogs.length === 0) {
            handleUploadData();
        }
    }, [consultStep, result]);

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