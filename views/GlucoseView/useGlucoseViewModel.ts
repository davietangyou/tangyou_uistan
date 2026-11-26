import {useEffect, useMemo, useState} from 'react';
import type {GlucoseViewProps} from './types';
import { PREDEFINED_SYMPTOMS, SYMPTOM_CLINICAL_CATEGORIES, PERIOD_OPTIONS } from './constants';
import {formatDisplayDateTime} from './datetime';

export function useGlucoseViewModel(props: GlucoseViewProps) {
    const {
        newGlucose,
        setNewGlucose,
        addGlucoseRecord,
        glucoseRecords,
        setGlucoseRecords,
        hba1cRecords,
        setHba1cRecords,
        newHbA1c,
        setNewHbA1c,
        addHbA1cRecord,
        isLargeFont = false
    } = props;

    const [activeTab, setActiveTab] = useState<'BG' | 'HBA1C' | 'SYMPTOM'>('BG');
    const [chartRange, setChartRange] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('WEEK');
    const [customStartDate, setCustomStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    });
    const [customEndDate, setCustomEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });
    
    // 症狀統計之時間範圍篩選 (週 / 月 / 年 / 自定義)
    const [symptomRange, setSymptomRange] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('WEEK');
    const [symptomCustomStartDate, setSymptomCustomStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    });
    const [symptomCustomEndDate, setSymptomCustomEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [selectedSymptomFilter, setSelectedSymptomFilter] = useState<string | null>(null);
    const [symptomTab, setSymptomTab] = useState<'CLOUD' | 'TIME_DIST' | 'CLINICAL'>('CLOUD');
    const [bgMode, setBgMode] = useState<'ADD' | 'DASHBOARD'>('DASHBOARD');
    const [symptomMode, setSymptomMode] = useState<'ADD' | 'DASHBOARD'>('DASHBOARD');
    const [hba1cMode, setHba1cMode] = useState<'ADD' | 'DASHBOARD'>('DASHBOARD');

    // 歷史記錄過濾 (全部 / 僅看異常 / 僅看正常) 與展開收起狀態
    const [recordFilter, setRecordFilter] = useState<'ALL' | 'ABNORMAL' | 'NORMAL'>('ALL');
    const [isRecordsExpanded, setIsRecordsExpanded] = useState<boolean>(false);
    const [isRecentRecordsVisible, setIsRecentRecordsVisible] = useState<boolean>(false);
    const [isSymptomRecentRecordsVisible, setIsSymptomRecentRecordsVisible] = useState<boolean>(false);
    const [isHba1cRecentRecordsVisible, setIsHba1cRecentRecordsVisible] = useState<boolean>(true);

    // 實時時間與自訂時間選擇器狀態
    const [recordDate, setRecordDate] = useState<Date>(() => new Date());
    const [isLiveTime, setIsLiveTime] = useState<boolean>(true);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null); // 'diet' | 'exercise' | 'symptoms' | 'medication' | 'bp' | 'weight' | 'note' | 'mood'

    const [customSymptomText, setCustomSymptomText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceTarget, setVoiceTarget] = useState<'symptom' | 'diet' | 'exercise' | 'note'>('symptom');

    // 💡 提示通知狀態：為長者提供大字體、高對比的儲存成功溫馨提示
    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

    // 💡 折疊狀態（相容舊有面板）
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [isSymptomsOpen, setIsSymptomsOpen] = useState(false);
    const [isMemosOpen, setIsMemosOpen] = useState(false);
    const [isSymptomTimeOpen, setIsSymptomTimeOpen] = useState(false);
    const [isSymptomSymptomsOpen, setIsSymptomSymptomsOpen] = useState(false);

    // 實時更新時鐘（當為即時模式時）
    useEffect(() => {
        if (!isLiveTime) return;
        const timer = setInterval(() => {
            setRecordDate(new Date());
        }, 10000);
        return () => clearInterval(timer);
    }, [isLiveTime]);

    // 初始化時段預設值（根據當前時間智能建議）
    useEffect(() => {
        if (!newGlucose.timeType) {
            const h = new Date().getHours();
            if (h >= 6 && h < 9) {
                setNewGlucose((prev) => ({ ...prev, timeType: '空腹', mealTag: undefined }));
            } else if (h >= 9 && h < 11) {
                setNewGlucose((prev) => ({ ...prev, timeType: '餐後2小時', mealTag: '早餐' }));
            } else if (h >= 11 && h < 13) {
                setNewGlucose((prev) => ({ ...prev, timeType: '餐前', mealTag: '午餐' }));
            } else if (h >= 13 && h < 16) {
                setNewGlucose((prev) => ({ ...prev, timeType: '餐後2小時', mealTag: '午餐' }));
            } else if (h >= 17 && h < 19) {
                setNewGlucose((prev) => ({ ...prev, timeType: '餐前', mealTag: '晚餐' }));
            } else if (h >= 19 && h < 21) {
                setNewGlucose((prev) => ({ ...prev, timeType: '餐後2小時', mealTag: '晚餐' }));
            } else if (h >= 21) {
                setNewGlucose((prev) => ({ ...prev, timeType: '睡前', mealTag: undefined }));
            } else {
                setNewGlucose((prev) => ({ ...prev, timeType: '日常其他時間', mealTag: undefined }));
            }
        }
    }, []);

    const handleSetTime = (newD: Date, isLive = false) => {
        setRecordDate(newD);
        setIsLiveTime(isLive);
        const formatted = formatDisplayDateTime(newD);
        setNewGlucose((prev) => ({
            ...prev,
            customTimestamp: isLive ? undefined : newD.getTime(),
            customDateStr: isLive ? undefined : formatted.dateStr
        }));
    };

    const handleSelectPeriod = (item: typeof PERIOD_OPTIONS[0]) => {
        setNewGlucose((prev) => ({
            ...prev,
            timeType: item.timeType,
            mealTag: item.mealTag
        }));
        setIsPeriodPickerOpen(false);
    };

    const currentPeriodInfo = useMemo(() => {
        const found = PERIOD_OPTIONS.find(p => {
            if (newGlucose.mealTag) {
                return p.timeType === newGlucose.timeType && p.mealTag === newGlucose.mealTag;
            }
            return p.timeType === newGlucose.timeType;
        });
        return found || {
            id: 'default',
            label: newGlucose.timeType || '選擇時段',
            en: 'Select Period',
            icon: '⏱️',
            desc: '點擊選擇測量時段'
        };
    }, [newGlucose.timeType, newGlucose.mealTag]);

    const handleVoiceInput = (target: 'symptom' | 'diet' | 'exercise' | 'note' = 'symptom') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的瀏覽器或設備不支援語音識別，請直接鍵盤輸入噢！');
            return;
        }

        if (isListening) {
            return;
        }

        setVoiceTarget(target);
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
            } else {
                alert('語音錄語發生錯誤，請多試一次或直接手動打字輸入噢！');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                const cleanText = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()？。，！；：]/g, "");
                if (target === 'symptom') {
                    setCustomSymptomText(prev => prev ? prev + '、' + cleanText : cleanText);
                } else if (target === 'diet') {
                    setNewGlucose((prev) => ({
                        ...prev,
                        dietNote: prev.dietNote ? prev.dietNote + '，' + cleanText : cleanText
                    }));
                } else if (target === 'exercise') {
                    setNewGlucose((prev) => ({
                        ...prev,
                        exerciseNote: prev.exerciseNote ? prev.exerciseNote + '，' + cleanText : cleanText
                    }));
                } else if (target === 'note') {
                    setNewGlucose((prev) => ({
                        ...prev,
                        illnessNote: prev.illnessNote ? prev.illnessNote + '，' + cleanText : cleanText
                    }));
                }
            }
        };

        recognition.start();
    };

    const handleAddCustomSymptom = () => {
        const text = customSymptomText.trim();
        if (!text) return;
        
        const symptomsToAdd = text.split(/[，、, \s]+/).filter(x => x.trim().length > 0);
        
        let next = [...(newGlucose.symptoms || [])];
        symptomsToAdd.forEach(s => {
            if (!next.includes(s)) {
                next.push(s);
            }
        });
        
        setNewGlucose((prev) => ({...prev, symptoms: next}));
        setCustomSymptomText('');
    };

    const handleRemoveCustomSymptom = (sym: string) => {
        const next = (newGlucose.symptoms || []).filter(x => x !== sym);
        setNewGlucose((prev) => ({...prev, symptoms: next}));
    };

    const selectedCustomSymptoms = useMemo(() => {
        return (newGlucose.symptoms || []).filter(s => !PREDEFINED_SYMPTOMS.includes(s));
    }, [newGlucose.symptoms]);

    const formattedTime = formatDisplayDateTime(recordDate);

    // 血糖测量时间点选项
    const timeOptions = ['空腹', '餐前', '餐後2小時', '睡前', '日常其他時間'];

    // 時間範圍過濾邊界計算 (週 / 月 / 年 / 自定義)
    const rangeTimeBounds = useMemo(() => {
        const now = new Date();
        let startTime = 0;
        let endTime = now.getTime();
        let label = '';
        let description = '';

        if (chartRange === 'WEEK') {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '週總結 (近 7 天)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (chartRange === 'MONTH') {
            const start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '月總結 (近 30 天)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (chartRange === 'YEAR') {
            const start = new Date();
            start.setFullYear(start.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '年總結 (近 1 年)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (chartRange === 'CUSTOM') {
            const s = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(0);
            const e = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
            startTime = s.getTime();
            endTime = e.getTime();
            label = '自定義時間總結';
            description = `${customStartDate || '最早'} ~ ${customEndDate || '今日'}`;
        }

        return { startTime, endTime, label, description };
    }, [chartRange, customStartDate, customEndDate]);

    // 根據所選時間區間篩選出血糖記錄
    const filteredGlucoseRecords = useMemo(() => {
        return glucoseRecords.filter(r => {
            let t = r.timestamp;
            if (!t && r.date) {
                t = new Date(r.date).getTime();
            }
            if (!t) return true;
            return t >= rangeTimeBounds.startTime && t <= rangeTimeBounds.endTime;
        });
    }, [glucoseRecords, rangeTimeBounds]);

    // 自定義區間快捷設定方法
    const setCustomPresetDays = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setCustomStartDate(start.toISOString().split('T')[0]);
        setCustomEndDate(end.toISOString().split('T')[0]);
    };

    const setCustomPresetThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setCustomStartDate(start.toISOString().split('T')[0]);
        setCustomEndDate(now.toISOString().split('T')[0]);
    };

    // 圖表數據處理 (根據所選區間即時過濾並格式化 X 軸)
    const chartData = useMemo(() => {
        if (activeTab === 'BG') {
            const valid = filteredGlucoseRecords
                .filter(r => r.value && !isNaN(parseFloat(r.value)))
                .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            return valid.map(r => {
                const d = r.timestamp ? new Date(r.timestamp) : null;
                let displayLabel = r.date.split(' ')[1] || r.date;
                if (d) {
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const hh = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    if (chartRange === 'WEEK') {
                        displayLabel = `${mm}/${dd} ${hh}:${min}`;
                    } else if (chartRange === 'MONTH') {
                        displayLabel = `${mm}/${dd}`;
                    } else if (chartRange === 'YEAR') {
                        displayLabel = `${d.getFullYear()}/${mm}/${dd}`;
                    } else {
                        displayLabel = `${mm}/${dd} ${hh}:${min}`;
                    }
                }

                return {
                    name: displayLabel,
                    value: parseFloat(r.value),
                    fullDate: r.date,
                    type: r.timeType,
                    mealTag: r.mealTag,
                    dietNote: r.dietNote,
                    exerciseNote: r.exerciseNote,
                    illnessNote: r.illnessNote,
                    symptoms: r.symptoms
                };
            });
        } else {
            // HbA1c 圖表
            const sorted = [...hba1cRecords].sort((a, b) => {
                const ta = a.timestamp || 0;
                const tb = b.timestamp || 0;
                return ta - tb;
            });
            return sorted.map(r => ({
                name: r.date,
                value: parseFloat(r.value),
                fullDate: r.date,
                type: 'HbA1c'
            }));
        }
    }, [filteredGlucoseRecords, hba1cRecords, chartRange, activeTab]);

    // 症狀時間範圍過濾邊界計算 (週 / 月 / 年 / 自定義)
    const symptomRangeTimeBounds = useMemo(() => {
        const now = new Date();
        let startTime = 0;
        let endTime = now.getTime();
        let label = '';
        let description = '';

        if (symptomRange === 'WEEK') {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '週總結 (近 7 天)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (symptomRange === 'MONTH') {
            const start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '月總結 (近 30 天)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (symptomRange === 'YEAR') {
            const start = new Date();
            start.setFullYear(start.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            startTime = start.getTime();
            label = '年總結 (近 1 年)';
            const startStr = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
            const endStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
            description = `${startStr} ~ ${endStr}`;
        } else if (symptomRange === 'CUSTOM') {
            const s = symptomCustomStartDate ? new Date(symptomCustomStartDate + 'T00:00:00') : new Date(0);
            const e = symptomCustomEndDate ? new Date(symptomCustomEndDate + 'T23:59:59') : new Date();
            startTime = s.getTime();
            endTime = e.getTime();
            label = '自定義時間總結';
            description = `${symptomCustomStartDate || '最早'} ~ ${symptomCustomEndDate || '今日'}`;
        }

        return { startTime, endTime, label, description };
    }, [symptomRange, symptomCustomStartDate, symptomCustomEndDate]);

    // 根據症狀所選時間區間篩選出記錄
    const filteredSymptomGlucoseRecords = useMemo(() => {
        return glucoseRecords.filter(r => {
            let t = r.timestamp;
            if (!t && r.date) {
                t = new Date(r.date).getTime();
            }
            if (!t) return true;
            return t >= symptomRangeTimeBounds.startTime && t <= symptomRangeTimeBounds.endTime;
        });
    }, [glucoseRecords, symptomRangeTimeBounds]);

    // 症狀自定義區間快捷設定方法
    const setSymptomCustomPresetDays = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setSymptomCustomStartDate(start.toISOString().split('T')[0]);
        setSymptomCustomEndDate(end.toISOString().split('T')[0]);
    };

    const setSymptomCustomPresetThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setSymptomCustomStartDate(start.toISOString().split('T')[0]);
        setSymptomCustomEndDate(now.toISOString().split('T')[0]);
    };

    // 症狀統計與字雲數據處理（基於所選時間區間）
    const symptomStats = useMemo(() => {
        const stats: Record<string, { count: number; timeTypes: Record<string, number>; dates: string[] }> = {};
        
        // 初始化已知症狀
        PREDEFINED_SYMPTOMS.forEach(sym => {
            stats[sym] = { count: 0, timeTypes: {}, dates: [] };
        });
        
        // 統計頻次與時段分佈（以區間過濾後的數據為準）
        let totalRecordsWithSymptom = 0;
        let totalSymptomOccurrences = 0;
        const timeSlotDistribution: Record<string, { total: number; symptoms: Record<string, number> }> = {};

        filteredSymptomGlucoseRecords.forEach(r => {
            if (r.symptoms && r.symptoms.length > 0) {
                totalRecordsWithSymptom++;
                const tt = r.mealTag ? `${r.mealTag}${r.timeType}` : (r.timeType || '日常隨機');
                if (!timeSlotDistribution[tt]) {
                    timeSlotDistribution[tt] = { total: 0, symptoms: {} };
                }

                r.symptoms.forEach(sym => {
                    totalSymptomOccurrences++;
                    if (!stats[sym]) {
                        stats[sym] = { count: 0, timeTypes: {}, dates: [] };
                    }
                    stats[sym].count += 1;
                    stats[sym].timeTypes[tt] = (stats[sym].timeTypes[tt] || 0) + 1;
                    timeSlotDistribution[tt].total += 1;
                    timeSlotDistribution[tt].symptoms[sym] = (timeSlotDistribution[tt].symptoms[sym] || 0) + 1;
                    if (r.date) stats[sym].dates.push(r.date);
                });
            }
        });

        const activeSymptomList = Object.entries(stats).map(([name, data]) => {
            // 找出最常發生此症狀的時間點
            let peakTime = '無';
            let peakCount = 0;
            Object.entries(data.timeTypes).forEach(([tt, c]) => {
                if (c > peakCount) {
                    peakCount = c;
                    peakTime = tt;
                }
            });

            const categoryInfo = SYMPTOM_CLINICAL_CATEGORIES[name] || {
                category: 'GENERAL' as const,
                categoryName: '其他/自訂症狀',
                badgeColor: 'text-slate-800 bg-slate-100/90 border-slate-300',
                clinicalNote: '自訂記錄之身體不適感受',
                clinicalConcern: '請隨時向主治醫生諮詢具體誘發情境'
            };

            const percentage = totalSymptomOccurrences > 0 
                ? Math.round((data.count / totalSymptomOccurrences) * 100) 
                : 0;
            
            return {
                name,
                count: data.count,
                percentage,
                peakTime,
                peakCount,
                dates: data.dates,
                timeTypes: data.timeTypes,
                categoryInfo,
            };
        });

        // 依出現次數由多到少排序
        const sortedList = activeSymptomList.sort((a, b) => b.count - a.count);
        const recordedList = sortedList.filter(s => s.count > 0);
        const maxCount = Math.max(...sortedList.map(s => s.count), 1);

        // 臨床三大病理分組統計
        const categorySummary = {
            lowBgCount: 0,
            highBgCount: 0,
            complicationCount: 0,
            generalCount: 0,
        };

        recordedList.forEach(s => {
            if (s.categoryInfo.category === 'LOW_BG') categorySummary.lowBgCount += s.count;
            else if (s.categoryInfo.category === 'HIGH_BG') categorySummary.highBgCount += s.count;
            else if (s.categoryInfo.category === 'COMPLICATION') categorySummary.complicationCount += s.count;
            else categorySummary.generalCount += s.count;
        });

        // 生成臨床就診摘要文字 (Doctor Visit Summary Memo)
        let clinicalMemoText = '';
        if (recordedList.length === 0) {
            clinicalMemoText = '患者近期暫無自覺不適或症狀紀錄。';
        } else {
            const topSymptomsDesc = recordedList.slice(0, 3).map((s, idx) => `${idx + 1}. ${s.name} (${s.count}次，高發時段：${s.peakTime})`).join('；');
            clinicalMemoText = `【門診主訴摘要】近度累計 ${totalRecordsWithSymptom} 筆不適紀錄（共 ${totalSymptomOccurrences} 症狀人次）。首要高頻症狀：${topSymptomsDesc}。`;
            if (categorySummary.lowBgCount > 0) {
                clinicalMemoText += ` ⚠️ 記錄低血糖相關警戒（冷汗/手震/頭暈等）共 ${categorySummary.lowBgCount} 次，建議排查降糖藥物劑量或延遲進餐情況。`;
            }
            if (categorySummary.highBgCount > 0) {
                clinicalMemoText += ` 📈 記錄高血糖滲透性症狀（口渴/頻尿/疲倦）共 ${categorySummary.highBgCount} 次，建議評估餐後血糖峰值。`;
            }
            if (categorySummary.complicationCount > 0) {
                clinicalMemoText += ` 👁️ 記錄周圍神經/微血管不適共 ${categorySummary.complicationCount} 次，建議安排下肢觸覺與眼底檢查。`;
            }
        }
        
        return {
            list: sortedList,
            recordedList,
            maxCount,
            totalRecordsWithSymptom,
            totalSymptomOccurrences,
            categorySummary,
            timeSlotDistribution,
            clinicalMemoText
        };
    }, [filteredSymptomGlucoseRecords]);

    // 💡 歷史記錄篩選 (全部 / 僅看異常 / 僅看正常)
    const filteredRecentRecords = useMemo(() => {
        return glucoseRecords.filter(r => {
            const hasValue = r.value !== undefined && r.value !== '' && !isNaN(parseFloat(r.value));
            const val = hasValue ? parseFloat(r.value!) : NaN;
            const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
            const isAbnormal = hasValue 
                ? (val < 4.0 || (isFasting && val > 7.0) || (!isFasting && val > 10.0))
                : (r.symptoms && r.symptoms.length > 0);

            if (recordFilter === 'ABNORMAL') {
                return isAbnormal;
            }
            if (recordFilter === 'NORMAL') {
                return hasValue && !isAbnormal;
            }
            return true;
        });
    }, [glucoseRecords, recordFilter]);

    // 異常記錄筆數統計
    const abnormalRecordsCount = useMemo(() => {
        return glucoseRecords.filter(r => {
            const hasValue = r.value !== undefined && r.value !== '' && !isNaN(parseFloat(r.value));
            const val = hasValue ? parseFloat(r.value!) : NaN;
            const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
            return hasValue 
                ? (val < 4.0 || (isFasting && val > 7.0) || (!isFasting && val > 10.0))
                : (r.symptoms && r.symptoms.length > 0);
        }).length;
    }, [glucoseRecords]);

    // 預設展示最近 6 筆，若點擊展開則展示全部符合條件之紀錄
    const visibleRecords = useMemo(() => {
        if (isRecordsExpanded) return filteredRecentRecords;
        return filteredRecentRecords.slice(0, 6);
    }, [filteredRecentRecords, isRecordsExpanded]);

    // 計算血糖統計分析，根據所選區間（週/月/年/自定義）動態精準計算
    const bgStats = useMemo(() => {
        const validRecords = filteredGlucoseRecords.filter(r => r.value && !isNaN(parseFloat(r.value)));
        if (validRecords.length === 0) return null;
        
        // 依時間排序找出最新紀錄
        const sortedDesc = [...validRecords].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const latest = sortedDesc[0];

        const values = validRecords.map(r => parseFloat(r.value!));
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        // 血糖波動標準差 (SD)
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
        const sd = Math.sqrt(variance);

        // 達標分析 (Time In Range)
        let inTargetCount = 0;
        let highCount = 0;
        let lowCount = 0;
        let fastingSum = 0;
        let fastingCount = 0;
        let postMealSum = 0;
        let postMealCount = 0;

        validRecords.forEach(r => {
            const v = parseFloat(r.value);
            const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
            if (v < 4.0) {
                lowCount++;
            } else if (isFasting && v > 7.0) {
                highCount++;
            } else if (!isFasting && v > 10.0) {
                highCount++;
            } else {
                inTargetCount++;
            }

            if (r.timeType === '空腹' || r.timeType === '餐前') {
                fastingSum += v;
                fastingCount++;
            } else if (r.timeType === '餐後2小時') {
                postMealSum += v;
                postMealCount++;
            }
        });

        const inTargetRate = ((inTargetCount / validRecords.length) * 100).toFixed(0);
        const fastingAvg = fastingCount > 0 ? (fastingSum / fastingCount).toFixed(1) : null;
        const postMealAvg = postMealCount > 0 ? (postMealSum / postMealCount).toFixed(1) : null;

        // 該區間內症狀次數統計
        let rangeSymptomCount = 0;
        filteredGlucoseRecords.forEach(r => {
            if (r.symptoms && r.symptoms.length > 0) {
                rangeSymptomCount += r.symptoms.length;
            }
        });

        return {
            latest,
            avg: avg.toFixed(1),
            max: max.toFixed(1),
            min: min.toFixed(1),
            sd: sd.toFixed(1),
            count: validRecords.length,
            inTargetRate,
            inTargetCount,
            highCount,
            lowCount,
            fastingAvg,
            fastingCount,
            postMealAvg,
            postMealCount,
            rangeSymptomCount,
            label: rangeTimeBounds.label,
            description: rangeTimeBounds.description
        };
    }, [filteredGlucoseRecords, rangeTimeBounds]);


    return {
        newGlucose,
        setNewGlucose,
        addGlucoseRecord,
        glucoseRecords,
        setGlucoseRecords,
        hba1cRecords,
        setHba1cRecords,
        newHbA1c,
        setNewHbA1c,
        addHbA1cRecord,
        isLargeFont,
        props,
        activeTab,
        setActiveTab,
        chartRange,
        setChartRange,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        symptomRange,
        setSymptomRange,
        symptomCustomStartDate,
        setSymptomCustomStartDate,
        symptomCustomEndDate,
        setSymptomCustomEndDate,
        selectedSymptomFilter,
        setSelectedSymptomFilter,
        symptomTab,
        setSymptomTab,
        bgMode,
        setBgMode,
        symptomMode,
        setSymptomMode,
        hba1cMode,
        setHba1cMode,
        recordFilter,
        setRecordFilter,
        isRecordsExpanded,
        setIsRecordsExpanded,
        isRecentRecordsVisible,
        setIsRecentRecordsVisible,
        isSymptomRecentRecordsVisible,
        setIsSymptomRecentRecordsVisible,
        isHba1cRecentRecordsVisible,
        setIsHba1cRecentRecordsVisible,
        recordDate,
        setRecordDate,
        isLiveTime,
        setIsLiveTime,
        isTimePickerOpen,
        setIsTimePickerOpen,
        isPeriodPickerOpen,
        setIsPeriodPickerOpen,
        activeAccordion,
        setActiveAccordion,
        customSymptomText,
        setCustomSymptomText,
        isListening,
        setIsListening,
        voiceTarget,
        setVoiceTarget,
        saveSuccessMessage,
        setSaveSuccessMessage,
        isTimeOpen,
        setIsTimeOpen,
        isSymptomsOpen,
        setIsSymptomsOpen,
        isMemosOpen,
        setIsMemosOpen,
        isSymptomTimeOpen,
        setIsSymptomTimeOpen,
        isSymptomSymptomsOpen,
        setIsSymptomSymptomsOpen,
        handleSetTime,
        handleSelectPeriod,
        currentPeriodInfo,
        handleVoiceInput,
        handleAddCustomSymptom,
        handleRemoveCustomSymptom,
        selectedCustomSymptoms,
        formattedTime,
        timeOptions,
        rangeTimeBounds,
        filteredGlucoseRecords,
        setCustomPresetDays,
        setCustomPresetThisMonth,
        chartData,
        symptomRangeTimeBounds,
        filteredSymptomGlucoseRecords,
        setSymptomCustomPresetDays,
        setSymptomCustomPresetThisMonth,
        symptomStats,
        filteredRecentRecords,
        abnormalRecordsCount,
        visibleRecords,
        bgStats
    };
}

export type GlucoseViewModel = ReturnType<typeof useGlucoseViewModel>;
