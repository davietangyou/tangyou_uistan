import React, {useState, useMemo, useEffect} from 'react';
import {GlucoseRecord} from '../utils/types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine
} from 'recharts';

const PREDEFINED_SYMPTOMS = [
    '頭暈', '冒冷汗', '心悸手震', '極度飢餓', 
    '口乾口渴', '頻尿', '極度疲倦', '視力模糊', 
    '噁心不適', '手腳發麻'
];

const SYMPTOM_CLINICAL_CATEGORIES: Record<string, {
    category: 'LOW_BG' | 'HIGH_BG' | 'COMPLICATION' | 'GENERAL';
    categoryName: string;
    badgeColor: string;
    clinicalNote: string;
    clinicalConcern: string;
}> = {
    '冒冷汗': { 
        category: 'LOW_BG', 
        categoryName: '低血糖警示群', 
        badgeColor: 'text-amber-800 bg-amber-100/90 border-amber-300', 
        clinicalNote: '交感神經過度興奮信號，好發於餐前、空腹或活動後',
        clinicalConcern: '提示降糖藥物劑量可能偏大、餐食延遲或未及時加餐'
    },
    '心悸手震': { 
        category: 'LOW_BG', 
        categoryName: '低血糖警示群', 
        badgeColor: 'text-amber-800 bg-amber-100/90 border-amber-300', 
        clinicalNote: '腎上腺素激增早期低血糖預警信號',
        clinicalConcern: '需即時測量血糖，若 <4.0 mmol/L 需按「15-15原則」補糖'
    },
    '頭暈': { 
        category: 'LOW_BG', 
        categoryName: '低血糖/腦供血警示', 
        badgeColor: 'text-amber-800 bg-amber-100/90 border-amber-300', 
        clinicalNote: '大腦葡萄糖供應不足或血壓波動，注意防跌倒',
        clinicalConcern: '若多發於空腹或起立時，需聯合同步監測血壓與血糖'
    },
    '極度飢餓': { 
        category: 'LOW_BG', 
        categoryName: '低血糖警示群', 
        badgeColor: 'text-amber-800 bg-amber-100/90 border-amber-300', 
        clinicalNote: '下丘腦攝食中樞受刺激，常伴隨低血糖早期',
        clinicalConcern: '評估主食攝入量與進餐間隔時間是否規律'
    },
    '口乾口渴': { 
        category: 'HIGH_BG', 
        categoryName: '高血糖滲透性群', 
        badgeColor: 'text-rose-800 bg-rose-100/90 border-rose-300', 
        clinicalNote: '血漿滲透壓升高刺激口渴中樞，多在餐後或高血糖時加重',
        clinicalConcern: '提示餐後血糖峰值可能過高或全天血糖控制未達標'
    },
    '頻尿': { 
        category: 'HIGH_BG', 
        categoryName: '高血糖滲透性群', 
        badgeColor: 'text-rose-800 bg-rose-100/90 border-rose-300', 
        clinicalNote: '血糖超出腎糖閾引發滲透性利尿',
        clinicalConcern: '關注長者夜尿頻繁帶來的脫水及夜間跌倒風險'
    },
    '極度疲倦': { 
        category: 'HIGH_BG', 
        categoryName: '代謝利用不良', 
        badgeColor: 'text-rose-800 bg-rose-100/90 border-rose-300', 
        clinicalNote: '細胞葡萄糖利用不良或血糖大幅波動所致',
        clinicalConcern: '需評估全天血糖波動幅度和基礎代謝狀態'
    },
    '視力模糊': { 
        category: 'COMPLICATION', 
        categoryName: '眼底/滲透壓警示', 
        badgeColor: 'text-purple-800 bg-purple-100/90 border-purple-300', 
        clinicalNote: '晶狀體滲透壓急性改變引起屈光不正，或微血管病變',
        clinicalConcern: '建議定期安排散瞳眼底檢查，排除糖尿病視網膜病變'
    },
    '手腳發麻': { 
        category: 'COMPLICATION', 
        categoryName: '周圍神經病變警示', 
        badgeColor: 'text-purple-800 bg-purple-100/90 border-purple-300', 
        clinicalNote: '長期高血糖毒性累及周圍神經纖維（對稱性手套襪套樣分佈）',
        clinicalConcern: '提示需進行 10g 單絲觸覺檢查及音叉震動覺篩查'
    },
    '噁心不適': { 
        category: 'GENERAL', 
        categoryName: '消化道/代謝反應', 
        badgeColor: 'text-slate-800 bg-slate-100/90 border-slate-300', 
        clinicalNote: '胃腸動力異常、胃輕癱或降糖藥物胃腸道副反應',
        clinicalConcern: '若伴隨血糖極高，需警惕糖尿病酮症酸中毒 (DKA)'
    },
};

const TIME_DETAILS: Record<string, { icon: string; label: string; desc: string }> = {
    '空腹': { icon: '🌅', label: '起床空腹', desc: '吃早餐前 / 空腹至少8小時' },
    '餐前': { icon: '🍽️', label: '飯前準備', desc: '午餐或晚餐開餐前測量' },
    '餐後2小時': { icon: '⏰', label: '飯後2小時', desc: '吃第一口飯起計滿2小時' },
    '睡前': { icon: '🌙', label: '臨睡之前', desc: '晚上睡覺前測量數值' },
    '日常其他時間': { icon: '🧪', label: '日常其他時間', desc: '任意時間或感覺不舒服時' }
};

const PERIOD_OPTIONS = [
    { id: 'fasting', label: '起床空腹', en: 'Fasting', timeType: '空腹' as const, mealTag: undefined, icon: '🌅', desc: '早餐前 / 空腹至少8小時' },
    { id: 'before_breakfast', label: '早餐前', en: 'Before Breakfast', timeType: '餐前' as const, mealTag: '早餐' as const, icon: '🥪', desc: '吃早餐前測量' },
    { id: 'after_breakfast', label: '早餐後 2 小時', en: 'After Breakfast', timeType: '餐後2小時' as const, mealTag: '早餐' as const, icon: '🍞', desc: '早餐第1口起計滿2小時' },
    { id: 'before_lunch', label: '午餐前', en: 'Before Lunch', timeType: '餐前' as const, mealTag: '午餐' as const, icon: '🍱', desc: '吃午餐前測量' },
    { id: 'after_lunch', label: '午餐後 2 小時', en: 'After Lunch', timeType: '餐後2小時' as const, mealTag: '午餐' as const, icon: '🍲', desc: '午餐第1口起計滿2小時' },
    { id: 'before_dinner', label: '晚餐前', en: 'Before Dinner', timeType: '餐前' as const, mealTag: '晚餐' as const, icon: '🍜', desc: '吃晚餐前測量' },
    { id: 'after_dinner', label: '晚餐後 2 小時', en: 'After Dinner', timeType: '餐後2小時' as const, mealTag: '晚餐' as const, icon: '🥗', desc: '晚餐第1口起計滿2小時' },
    { id: 'bedtime', label: '睡前', en: 'Bedtime', timeType: '睡前' as const, mealTag: undefined, icon: '🌙', desc: '臨睡前測量' },
    { id: 'night', label: '夜間', en: 'Night', timeType: '日常其他時間' as const, mealTag: undefined, icon: '🌌', desc: '半夜或清晨測量' },
    { id: 'other', label: '日常隨機', en: 'Other / Random', timeType: '日常其他時間' as const, mealTag: undefined, icon: '🧪', desc: '身體不適或隨機測量' },
];

const formatDisplayDateTime = (dateObj: Date) => {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const dayEn = daysEn[dateObj.getDay()];
    const dayZh = daysZh[dateObj.getDay()];
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return {
        en: `${dayEn}, ${dd}/${mm}/${yyyy}, ${hour12}:${minutes} ${ampm}`,
        zh: `${yyyy}年${mm}月${dd}日 (${dayZh}) ${String(hours).padStart(2, '0')}:${minutes}`,
        dateStr: `${yyyy}/${mm}/${dd} ${String(hours).padStart(2, '0')}:${minutes}`,
        isoForPicker: `${yyyy}-${mm}-${dd}T${String(hours).padStart(2, '0')}:${minutes}`
    };
};

const SYMPTOM_DETAILS: Record<string, { icon: string; name: string; desc: string }> = {
    '冒冷汗': { icon: '🥶', name: '冒冷汗', desc: '全身發冷、手心出冷汗' },
    '手震': { icon: '🤝', name: '手腳震顫', desc: '手部抖動、雙腳發軟無力' },
    '頭暈': { icon: '🌀', name: '頭暈眼花', desc: '頭重腳輕、看東西天旋地轉' },
    '心跳加速': { icon: '💓', name: '心跳加速', desc: '覺得心慌慌、心跳特別快' },
    '極度飢餓': { icon: '🍗', name: '極度飢餓', desc: '肚子極度餓、心慌想找東西吃' },
    '視力模糊': { icon: '👁️', name: '視線模糊', desc: '看東西不清楚、眼睛矇查查' },
    '口乾口渴': { icon: '🥛', name: '異常口渴', desc: '口乾舌燥、喝很多水依然口渴' },
    '頻尿': { icon: '🚽', name: '頻繁小便', desc: '一直想去廁所、排尿次數增多' },
    '極度疲倦': { icon: '🥱', name: '非常疲倦', desc: '身體好累、整個人無精打采' },
    '噁心不適': { icon: '🤢', name: '嘔吐胃脹', desc: '胃口不好、肚子脹氣、感到想嘔' }
};

interface GlucoseViewProps {
    newGlucose: { 
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
    };
    setNewGlucose: (val: any) => void;
    addGlucoseRecord: () => void;
    glucoseRecords: GlucoseRecord[];
    setGlucoseRecords: (records: GlucoseRecord[]) => void;
    hba1cRecords: any[];
    setHba1cRecords: (records: any[]) => void;
    newHbA1c: { value: string; date: string };
    setNewHbA1c: (val: { value: string; date: string }) => void;
    addHbA1cRecord: () => void;
    [key: string]: any;
}

export const GlucoseView: React.FC<GlucoseViewProps> = (props) => {
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
                setNewGlucose((prev: any) => ({ ...prev, timeType: '空腹', mealTag: undefined }));
            } else if (h >= 9 && h < 11) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '餐後2小時', mealTag: '早餐' }));
            } else if (h >= 11 && h < 13) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '餐前', mealTag: '午餐' }));
            } else if (h >= 13 && h < 16) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '餐後2小時', mealTag: '午餐' }));
            } else if (h >= 17 && h < 19) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '餐前', mealTag: '晚餐' }));
            } else if (h >= 19 && h < 21) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '餐後2小時', mealTag: '晚餐' }));
            } else if (h >= 21) {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '睡前', mealTag: undefined }));
            } else {
                setNewGlucose((prev: any) => ({ ...prev, timeType: '日常其他時間', mealTag: undefined }));
            }
        }
    }, []);

    const handleSetTime = (newD: Date, isLive = false) => {
        setRecordDate(newD);
        setIsLiveTime(isLive);
        const formatted = formatDisplayDateTime(newD);
        setNewGlucose((prev: any) => ({
            ...prev,
            customTimestamp: isLive ? undefined : newD.getTime(),
            customDateStr: isLive ? undefined : formatted.dateStr
        }));
    };

    const handleSelectPeriod = (item: typeof PERIOD_OPTIONS[0]) => {
        setNewGlucose((prev: any) => ({
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
                    setNewGlucose((prev: any) => ({
                        ...prev,
                        dietNote: prev.dietNote ? prev.dietNote + '，' + cleanText : cleanText
                    }));
                } else if (target === 'exercise') {
                    setNewGlucose((prev: any) => ({
                        ...prev,
                        exerciseNote: prev.exerciseNote ? prev.exerciseNote + '，' + cleanText : cleanText
                    }));
                } else if (target === 'note') {
                    setNewGlucose((prev: any) => ({
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
        
        setNewGlucose((prev: any) => ({...prev, symptoms: next}));
        setCustomSymptomText('');
    };

    const handleRemoveCustomSymptom = (sym: string) => {
        const next = (newGlucose.symptoms || []).filter(x => x !== sym);
        setNewGlucose((prev: any) => ({...prev, symptoms: next}));
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

    return (
        <div className={`space-y-10 animate-soft pb-20 ${isLargeFont ? 'spacy-container' : ''}`}>
            {/* 顶部分段選擇器：柔和按鈕 */}
            <div className={`flex bg-slate-100/50 rounded-2xl ring-1 ring-slate-150 ${isLargeFont ? 'p-2' : 'p-1.5'}`}>
                <button 
                    onClick={() => setActiveTab('BG')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'BG' ? 'bg-white shadow-md text-[#4A6E85]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🩸 血糖紀錄
                </button>
                <button 
                    onClick={() => setActiveTab('SYMPTOM')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'SYMPTOM' ? 'bg-white shadow-md text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🤒 症狀紀錄
                </button>
                <button 
                    onClick={() => setActiveTab('HBA1C')}
                    className={`flex-grow font-black transition-all cursor-pointer ${isLargeFont ? 'py-5 text-xl rounded-xl' : 'py-3 text-sm rounded-xl'} ${activeTab === 'HBA1C' ? 'bg-white shadow-md text-[#7FA0B4]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🧬 糖化
                </button>
            </div>

            {activeTab === 'BG' && (
                <div className="space-y-6 animate-soft">
                    {/* 溫馨提示 / 成功提示通知 */}
                    {saveSuccessMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
                            <span className="text-2xl">✅</span>
                            <div className="flex-grow">
                                <p className="font-black text-emerald-800 text-sm sm:text-base">{saveSuccessMessage}</p>
                                <p className="text-emerald-600 font-bold text-xs">數據已即時同步到下方的數據看板及走勢圖中！</p>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                    ✍️ 1. 登記血糖與狀況紀錄表單（即時時間、時段自選、血糖數值、生活情境）
                    ========================================================= */}
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 測量時間選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⏱️</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                            測量時間
                                        </span>
                                        {isLiveTime ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                即時
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                ✏️ 補選時間
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-200 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span className="truncate max-w-[170px] sm:max-w-none">
                                        {formattedTime.zh}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {isTimePickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時間挑選面板 */}
                            {isTimePickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3 animate-soft">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="datetime-local"
                                            value={formattedTime.isoForPicker}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleSetTime(new Date(e.target.value), false);
                                                }
                                            }}
                                            className="w-full sm:w-auto flex-grow bg-white border-2 border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-inner"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSetTime(new Date(), true);
                                                setIsTimePickerOpen(false);
                                            }}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                                                isLiveTime 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            設為現在時間
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🏷️ 2. 測量時段選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                        測量時段
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsPeriodPickerOpen(!isPeriodPickerOpen)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-300 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span>{currentPeriodInfo.icon}</span>
                                    <span>{currentPeriodInfo.label}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {isPeriodPickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時段選擇九宮格 */}
                            {isPeriodPickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-2.5 animate-soft">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {PERIOD_OPTIONS.map((item) => {
                                            const isSelected = 
                                                (item.mealTag 
                                                    ? newGlucose.timeType === item.timeType && newGlucose.mealTag === item.mealTag 
                                                    : newGlucose.timeType === item.timeType);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectPeriod(item)}
                                                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${
                                                        isSelected
                                                            ? 'bg-[#2A9D8F] border-[#2A9D8F] text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl">{item.icon}</span>
                                                        {isSelected && <span className="text-xs">✓</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs sm:text-sm">{item.label}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🩸 3. 血糖數值輸入卡片 */}
                        <div className="bg-white border-2 border-[#2A9D8F]/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💧</span>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                                        血糖數值
                                    </h4>
                                </div>
                                {newGlucose.value && (
                                    <button
                                        type="button"
                                        onClick={() => setNewGlucose((prev: any) => ({ ...prev, value: '' }))}
                                        className="text-xs font-bold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                        ✕ 清除
                                    </button>
                                )}
                            </div>

                            {/* 血糖數值主要輸入行 */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 sm:px-6 sm:py-4">
                                <span className={`font-black text-slate-600 ${isLargeFont ? 'text-xl' : 'text-sm sm:text-base'}`}>
                                    血糖數值
                                </span>

                                <div className="flex items-baseline gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        inputMode="decimal"
                                        placeholder="請輸入"
                                        value={newGlucose.value || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setNewGlucose((prev: any) => ({ ...prev, value: '' }));
                                            } else {
                                                const num = parseFloat(val);
                                                if (!isNaN(num) && num < 0) {
                                                    setNewGlucose((prev: any) => ({ ...prev, value: '0' }));
                                                } else {
                                                    setNewGlucose((prev: any) => ({ ...prev, value: val }));
                                                }
                                            }
                                        }}
                                        className={`bg-transparent text-right font-black text-[#2A9D8F] outline-none placeholder:text-slate-300 w-32 sm:w-40 ${
                                            isLargeFont ? 'text-4xl' : 'text-3xl sm:text-4xl'
                                        }`}
                                    />
                                    <span className="font-black text-slate-400 text-xs sm:text-sm">
                                        mmol/L
                                    </span>
                                </div>
                            </div>

                            {/* 即時健康範圍警報提示 */}
                            {newGlucose.value && !isNaN(parseFloat(newGlucose.value)) && (() => {
                                const val = parseFloat(newGlucose.value);
                                if (val < 4.0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-900 shadow-sm">
                                            <span className="text-xl">⚠️</span>
                                            <div className="text-xs">
                                                <p className="font-black text-amber-850">低血糖警報 ({val} mmol/L)</p>
                                                <p className="font-bold text-amber-700">數值低於 4.0，請立即補充 15g 快速碳水化合物（如果汁或糖果），15分鐘後重測。</p>
                                            </div>
                                        </div>
                                    );
                                }
                                const isFasting = newGlucose.timeType === '空腹' || newGlucose.timeType === '餐前';
                                const limit = isFasting ? 7.0 : 10.0;
                                if (val > limit) {
                                    return (
                                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2 text-rose-900 shadow-sm">
                                            <span className="text-xl">🚨</span>
                                            <div className="text-xs">
                                                <p className="font-black text-rose-850">血糖偏高 ({val} mmol/L)</p>
                                                <p className="font-bold text-rose-700">超出標準範圍，建議飲用溫開水，並記錄下方飲食與運動細節。</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center gap-2 text-emerald-900 shadow-sm">
                                        <span className="text-lg">💚</span>
                                        <p className="font-bold text-xs text-emerald-800">
                                            血糖正常理想（{val} mmol/L），請繼續保持！
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ➕ 4. 測量血糖值的其他信息 */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="font-black text-slate-700 text-sm flex items-center gap-1.5">
                                    <span>📋</span>
                                    <span>測量血糖值的其他資訊</span>
                                </h4>
                            </div>

                            <div className="space-y-2">
                                {/* 🍽️ 1. 吃了什麼 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
                                                🍽️
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    吃了什麼
                                                </span>
                                                {newGlucose.dietNote && (
                                                    <span className="text-[11px] text-emerald-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已填：{newGlucose.dietNote}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'diet' ? null : 'diet')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.dietNote 
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'diet' ? '▲' : (newGlucose.dietNote ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'diet' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            {/* 快捷標籤 */}
                                            <div className="flex flex-wrap gap-1.5 pt-3">
                                                {['清淡少油', '多蔬菜/高纖', '白飯/澱粉主食', '茶餐廳/高油外賣', '低GI雜糧糙米', '水果甜點', '無糖茶飲', '少吃了一餐'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewGlucose((prev: any) => ({
                                                                ...prev,
                                                                dietNote: prev.dietNote ? `${prev.dietNote}、${tag}` : tag
                                                            }));
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                                    >
                                                        ＋ {tag}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="例如：半碗糙米飯、蒸肉餅、少油菜心"
                                                    value={newGlucose.dietNote || ''}
                                                    onChange={(e) => setNewGlucose((prev: any) => ({ ...prev, dietNote: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A9D8F] focus:bg-white rounded-xl py-2.5 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleVoiceInput('diet')}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center w-7 h-7 text-sm ${
                                                        isListening && voiceTarget === 'diet' ? 'bg-rose-500 text-white animate-pulse' : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    title="語音輸入食物"
                                                >
                                                    🎙️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 🏃 2. 做了什麼運動 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base">
                                                🏃
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    做了什麼運動
                                                </span>
                                                {newGlucose.exerciseNote && (
                                                    <span className="text-[11px] text-blue-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已填：{newGlucose.exerciseNote}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'exercise' ? null : 'exercise')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.exerciseNote 
                                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'exercise' ? '▲' : (newGlucose.exerciseNote ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'exercise' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            {/* 快捷標籤 */}
                                            <div className="flex flex-wrap gap-1.5 pt-3">
                                                {['散步 20-30分鐘', '深蹲/坐站 15-20次', '太極 / 八段錦', '彈力帶/啞鈴肌力', '靠牆俯臥撐/提踵', '慢跑 / 快走', '居家伸展操', '做家務 / 走樓梯', '今天未做運動'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewGlucose((prev: any) => ({
                                                                ...prev,
                                                                exerciseNote: prev.exerciseNote ? `${prev.exerciseNote}、${tag}` : tag
                                                            }));
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                                    >
                                                        ＋ {tag}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="例如：飯後公園散步 25 分鐘"
                                                    value={newGlucose.exerciseNote || ''}
                                                    onChange={(e) => setNewGlucose((prev: any) => ({ ...prev, exerciseNote: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#2A9D8F] focus:bg-white rounded-xl py-2.5 pl-3 pr-10 text-xs font-bold text-slate-800 outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleVoiceInput('exercise')}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center w-7 h-7 text-sm ${
                                                        isListening && voiceTarget === 'exercise' ? 'bg-rose-500 text-white animate-pulse' : 'text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                    title="語音輸入運動"
                                                >
                                                    🎙️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 🤒 3. 有什麼症狀 */}
                                <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl transition-all overflow-hidden">
                                    <div className="flex items-center justify-between p-3.5 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-base">
                                                🤒
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-800 text-xs sm:text-sm block">
                                                    有什麼症狀
                                                </span>
                                                {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                                    <span className="text-[11px] text-rose-700 font-bold truncate max-w-[180px] sm:max-w-xs block">
                                                        ✓ 已選 {newGlucose.symptoms.length} 個症狀（{newGlucose.symptoms.join('、')}）
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveAccordion(activeAccordion === 'symptoms' ? null : 'symptoms')}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base transition-all cursor-pointer ${
                                                newGlucose.symptoms && newGlucose.symptoms.length > 0
                                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' 
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {activeAccordion === 'symptoms' ? '▲' : (newGlucose.symptoms && newGlucose.symptoms.length > 0 ? '✓' : '＋')}
                                        </button>
                                    </div>

                                    {activeAccordion === 'symptoms' && (
                                        <div className="p-4 pt-0 border-t border-dashed border-slate-200 space-y-3 bg-white animate-soft">
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
                                                {PREDEFINED_SYMPTOMS.map((symptomId) => {
                                                    const detail = SYMPTOM_DETAILS[symptomId] || { icon: '❓', name: symptomId };
                                                    const isSelected = newGlucose.symptoms?.includes(symptomId) || false;
                                                    return (
                                                        <button
                                                            key={symptomId}
                                                            type="button"
                                                            onClick={() => {
                                                                let next = [...(newGlucose.symptoms || [])];
                                                                if (next.includes(symptomId)) {
                                                                  next = next.filter(x => x !== symptomId);
                                                                } else {
                                                                  next.push(symptomId);
                                                                }
                                                                setNewGlucose((prev: any) => ({ ...prev, symptoms: next }));
                                                            }}
                                                            className={`p-2 rounded-xl border font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs ${
                                                                isSelected
                                                                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span>{detail.icon}</span>
                                                            <span className="truncate">{detail.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* 手動輸入其他症狀 */}
                                            <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                                <div className="relative flex-grow">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#2A9D8F] rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold"
                                                        placeholder="手動補充其他不適"
                                                        value={customSymptomText}
                                                        onChange={(e) => setCustomSymptomText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCustomSymptom();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVoiceInput('symptom')}
                                                        className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center w-6 h-6 text-sm ${
                                                            isListening && voiceTarget === 'symptom' ? 'bg-rose-500 text-white animate-pulse' : 'text-rose-500 hover:bg-rose-50'
                                                        }`}
                                                        title="語音錄音"
                                                    >
                                                        🎙️
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomSymptom}
                                                    className="bg-[#2A9D8F] text-white rounded-lg font-black px-3 py-1.5 text-xs hover:bg-[#238276] cursor-pointer"
                                                >
                                                    加入
                                                </button>
                                            </div>

                                            {selectedCustomSymptoms.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {selectedCustomSymptoms.map((sym) => (
                                                        <button
                                                            key={sym}
                                                            type="button"
                                                            onClick={() => handleRemoveCustomSymptom(sym)}
                                                            className="bg-rose-500 text-white hover:bg-rose-600 rounded-full flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <span>{sym}</span>
                                                            <span>×</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 🔘 5. 底部操作按鈕 */}
                        <div className="pt-5 border-t border-slate-200/80 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setNewGlucose({
                                        value: '',
                                        timeType: '空腹',
                                        symptoms: [],
                                        mealTag: undefined,
                                        dietNote: '',
                                        exerciseNote: '',
                                        customTimestamp: undefined,
                                        customDateStr: undefined
                                    });
                                    handleSetTime(new Date(), true);
                                    setActiveAccordion(null);
                                }}
                                className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-[#2A9D8F] text-[#2A9D8F] hover:bg-emerald-50/50 font-black text-sm transition-all cursor-pointer text-center"
                            >
                                清空重填
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!newGlucose.value) {
                                        alert('請先輸入測量的血糖值（例如：5.5）噢！');
                                        return;
                                    }
                                    if (!newGlucose.timeType) {
                                        setNewGlucose((prev: any) => ({ ...prev, timeType: '空腹' }));
                                    }
                                    addGlucoseRecord();
                                    setSaveSuccessMessage('🎉 血糖紀錄已成功儲存！');
                                    setTimeout(() => setSaveSuccessMessage(null), 4500);
                                    
                                    // 關閉展開項保持乾淨
                                    setActiveAccordion(null);
                                    setIsTimePickerOpen(false);
                                    setIsPeriodPickerOpen(false);
                                    handleSetTime(new Date(), true);
                                }}
                                className="flex-2 py-3.5 px-6 rounded-2xl bg-[#2A9D8F] hover:bg-[#238276] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                                <span>完成儲存</span>
                                <span>✓</span>
                            </button>
                        </div>
                    </div>

                    {/* =========================================================
                    📊 2. 數據分析看板 (一頁展示，無縫銜接於登記表單下方)
                    ========================================================= */}
                    <div id="glucose-dashboard-anchor" className="space-y-6 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <h3 className="text-lg font-black text-[#4A6E85]">血糖數據分析</h3>
                                    <p className="text-xs text-slate-400 font-bold">
                                        當前篩選：{rangeTimeBounds.label} ({rangeTimeBounds.description})
                                    </p>
                                </div>
                            </div>

                            {/* ⏳ 時間範圍切換：週 / 月 / 年 / 自定義 */}
                            <div className={`flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto`}>
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setChartRange(item.id)}
                                        className={`font-black transition-all cursor-pointer ${
                                            isLargeFont 
                                                ? 'px-5 py-2 rounded-xl text-base' 
                                                : 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm'
                                        } ${
                                            chartRange === item.id 
                                                ? 'bg-white shadow-sm text-[#4A6E85]' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 📅 自定義時間選擇器模組 (僅在選擇「自定義」時展開) */}
                        {chartRange === 'CUSTOM' && (
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-soft">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">起始</span>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-slate-300 font-black text-center hidden sm:inline">至</span>
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">結束</span>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 快捷時間範圍標籤 */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">快捷選擇：</span>
                                    {[
                                        { label: '近 3 天', onClick: () => setCustomPresetDays(3) },
                                        { label: '近 14 天', onClick: () => setCustomPresetDays(14) },
                                        { label: '近 30 天', onClick: () => setCustomPresetDays(30) },
                                        { label: '近 90 天', onClick: () => setCustomPresetDays(90) },
                                        { label: '本月', onClick: () => setCustomPresetThisMonth() }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={preset.onClick}
                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 統計概覽卡片 (隨選擇之時間範圍動態更新，僅顯示 Mean, Min, Max) */}
                        {bgStats ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">
                                        平均值 (Mean)
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-emerald-600 text-2xl sm:text-3xl">{bgStats.avg}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-bold block mt-2">
                                        {chartRange === 'WEEK' ? '週平均血糖' : chartRange === 'MONTH' ? '月平均血糖' : chartRange === 'YEAR' ? '年平均血糖' : '區間平均血糖'}
                                    </span>
                                </div>

                                <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">最低值 (Min)</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-amber-600 text-2xl sm:text-3xl">{bgStats.min}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-bold block mt-2">
                                        {bgStats.lowCount > 0 ? `⚠️ 低血糖 ${bgStats.lowCount} 次` : '無低血糖記錄'}
                                    </span>
                                </div>

                                <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 border border-rose-100 p-4 sm:p-5 rounded-2xl">
                                    <span className="text-slate-400 font-extrabold text-xs block mb-1">最高值 (Max)</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-rose-500 text-2xl sm:text-3xl">{bgStats.max}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-2">
                                        {bgStats.highCount > 0 ? `偏高 ${bgStats.highCount} 次` : '無超標記錄'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                <p className="text-slate-400 font-black text-sm">🌱 該時間區間內暫無血糖紀錄數據，您可以更換時間區間或在上方記錄新數值！</p>
                            </div>
                        )}
                    </div>

                    {/* 📈 趨勢匯總圖：隨選取範圍即時變更 */}
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-10' : 'p-6 sm:p-8 space-y-6'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className={`font-black text-[#4A6E85] flex items-center gap-2 ${isLargeFont ? 'text-2xl' : 'text-lg'}`}>
                                    📈 血糖趨勢走勢
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                    {rangeTimeBounds.label} ({chartData.length} 個數據點)
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setChartRange(r.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            chartRange === r.id
                                                ? 'bg-[#4A6E85] text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isLargeFont ? 'h-[360px]' : 'h-[280px]'} w-full`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            fontSize={isLargeFont ? 13 : 10}
                                            fontWeight="600"
                                            tick={{ fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 'auto']} 
                                            fontSize={isLargeFont ? 13 : 10} 
                                            fontWeight="600" 
                                            axisLine={false} 
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-1.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="font-bold text-slate-400">{data.fullDate}</span>
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-black">{data.type}</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1.5 pt-1">
                                                                <span className="text-xl font-black text-[#4A6E85]">{data.value}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                                            </div>
                                                            {data.mealTag && (
                                                                <div className="text-slate-600 font-bold">🍱 {data.mealTag}</div>
                                                            )}
                                                            {data.symptoms && data.symptoms.length > 0 && (
                                                                <div className="text-rose-500 font-bold flex flex-wrap gap-1">
                                                                    <span>⚠️ 症狀：</span>
                                                                    <span>{data.symptoms.join(', ')}</span>
                                                                </div>
                                                            )}
                                                            {data.dietNote && (
                                                                <div className="text-slate-500 font-medium truncate max-w-[200px]">🍽️ {data.dietNote}</div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        { /* @ts-ignore */ }
                                        <ReferenceArea y1={4} y2={7} fill="#10B981" fillOpacity={0.08} />
                                        <ReferenceLine y={4} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '過低 (4)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="3 3" label={{ value: '餐前目標 (7)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={10} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '餐後上限 (10)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#F59E0B', fontWeight: 'bold' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#4A6E85" 
                                            strokeWidth={3.5} 
                                            dot={{ r: 4.5, fill: '#4A6E85', strokeWidth: 2.5, stroke: '#fff' }} 
                                            activeDot={{ r: 7, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">該區間暫無記錄</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={`flex justify-center flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-slate-100 ${isLargeFont ? 'text-sm' : 'text-[10px]'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-emerald-500 border-t-2 border-dashed border-emerald-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐前目標 (4-7)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐後上限 (10)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#4A6E85]"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>實際紀錄</span>
                            </div>
                        </div>
                    </div>

                    {/* 歷史紀錄 */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">📋</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    最近紀錄報告
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    (共 {glucoseRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsRecentRecordsVisible(!isRecentRecordsVisible)}
                                    className="ml-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                    {isRecentRecordsVisible ? '收起隱藏 ▲' : '展開顯示 ▼'}
                                </button>
                            </div>

                            {/* 💡 異常數值快速篩選標籤 */}
                            {isRecentRecordsVisible && (
                                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('ALL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            recordFilter === 'ALL'
                                                ? 'bg-white text-slate-800 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        全部 ({glucoseRecords.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('ABNORMAL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                            recordFilter === 'ABNORMAL'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-rose-600 hover:bg-rose-50'
                                        }`}
                                    >
                                        <span>⚠️ 僅看異常</span>
                                        {abnormalRecordsCount > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                recordFilter === 'ABNORMAL' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {abnormalRecordsCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecordFilter('NORMAL');
                                            setIsRecordsExpanded(false);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            recordFilter === 'NORMAL'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-emerald-700 hover:bg-emerald-50'
                                        }`}
                                    >
                                        🟢 僅看正常
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 記錄卡片列表 */}
                        {isRecentRecordsVisible && (
                            visibleRecords.length > 0 ? (
                                <div className="space-y-3">
                                {visibleRecords.map(r => {
                                    const hasValue = r.value !== undefined && r.value !== '';
                                    const val = hasValue ? parseFloat(r.value) : NaN;
                                    const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
                                    
                                    let statusColor = 'bg-emerald-400';

                                    if (!hasValue) {
                                        statusColor = 'bg-[#7FA0B4]';
                                    } else if (val < 4.0) {
                                        statusColor = 'bg-amber-400';
                                    } else if (isFasting && val > 7.0) {
                                        statusColor = 'bg-rose-400';
                                    } else if (!isFasting && val > 10.0) {
                                        statusColor = 'bg-rose-400';
                                    }

                                    return (
                                        <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-5 sm:p-6'}`}>
                                            <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-5'}`}>
                                                <div className={`rounded-full opacity-70 ${isLargeFont ? 'w-5 h-24' : 'w-3 h-14'} ${statusColor}`}></div>
                                                <div className="space-y-1">
                                                    {hasValue ? (
                                                        <div className="flex flex-wrap items-baseline gap-2">
                                                            <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-6xl' : 'text-3xl sm:text-4xl'}`}>{r.value}</p>
                                                            <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-xs sm:text-sm'}`}>mmol/L</span>
                                                            {val < 4.0 && (
                                                                <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>低血糖風險</span>
                                                            )}
                                                            {(isFasting && val > 7.0) || (!isFasting && val > 10.0) ? (
                                                                <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>血糖偏高</span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-black text-[#4A6E85] flex items-center gap-1.5 bg-slate-50 rounded-2xl border border-slate-100 ${isLargeFont ? 'text-xl px-5 py-3' : 'text-base px-3.5 py-1.5'}`}>
                                                                🤒 身體症狀紀錄
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {r.symptoms && r.symptoms.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-xs sm:max-w-md">
                                                            {r.symptoms.map((sym, index) => (
                                                                <span key={index} className={`font-black bg-rose-50 text-rose-600 border border-rose-100 rounded-full whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-2' : 'text-xs px-2.5 py-1'}`}>
                                                                    {sym}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <p className={`text-slate-400 font-extrabold uppercase tracking-wide mt-1 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                        【{r.mealTag ? `${r.mealTag} • ${r.timeType}` : r.timeType}】 {r.date}
                                                    </p>

                                                    {/* 📋 飲食、運動、症狀、用藥、血壓等詳細情境顯示 */}
                                                    {(r.dietNote || r.exerciseNote || r.illnessNote || r.medicationNote || r.bpSystolic || r.bpDiastolic || r.pulse || r.weight || r.mood) && (
                                                        <div className="mt-2.5 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-[11px] font-extrabold text-slate-600 max-w-xs sm:max-w-md">
                                                            {r.dietNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🍕 飲食:</span>
                                                                    <span className="text-slate-700 font-black">{r.dietNote}</span>
                                                                </div>
                                                            )}
                                                            {r.exerciseNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🏃 運動:</span>
                                                                    <span className="text-slate-700 font-black">{r.exerciseNote}</span>
                                                                </div>
                                                            )}
                                                            {r.illnessNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-slate-400">🤒 狀況:</span>
                                                                    <span className="text-slate-700 font-black">{r.illnessNote}</span>
                                                                </div>
                                                            )}
                                                            {r.medicationNote && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-amber-500">💊 用藥:</span>
                                                                    <span className="text-slate-700 font-black">{r.medicationNote}</span>
                                                                </div>
                                                            )}
                                                            {(r.bpSystolic || r.bpDiastolic || r.pulse) && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-indigo-500">❤️ 血壓:</span>
                                                                    <span className="text-slate-700 font-black">
                                                                        {r.bpSystolic || '--'}/{r.bpDiastolic || '--'} mmHg {r.pulse ? `(心率 ${r.pulse} bpm)` : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {r.weight && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-teal-600">⚖️ 體重:</span>
                                                                    <span className="text-slate-700 font-black">{r.weight} kg</span>
                                                                </div>
                                                            )}
                                                            {r.mood && (
                                                                <div className="flex gap-1.5 items-start">
                                                                    <span className="flex-shrink-0 text-amber-500">😊 心情:</span>
                                                                    <span className="text-slate-700 font-black">{r.mood}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id))}
                                                className={`rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-9 h-9 text-2xl'}`}
                                                title="刪除紀錄"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* 💡 展開更多 / 收起紀錄 按鈕 */}
                                {filteredRecentRecords.length > 6 && (
                                    <div className="pt-2 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsRecordsExpanded(!isRecordsExpanded)}
                                            className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                                        >
                                            {isRecordsExpanded ? (
                                                <>
                                                    <span>▲ 收起記錄</span>
                                                    <span className="text-slate-400 text-xs font-normal">（僅看最近 6 筆）</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>▼ 展開更多紀錄</span>
                                                    <span className="text-[#4A6E85] font-black">（共 {filteredRecentRecords.length} 筆，還有 {filteredRecentRecords.length - 6} 筆）</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                                <span className="text-2xl">🎉</span>
                                <p className="text-slate-600 font-black text-sm">
                                    {recordFilter === 'ABNORMAL' ? '無異常數值記錄，血糖控制得非常平穩！' : '暫無相關記錄'}
                                </p>
                                {recordFilter !== 'ALL' && (
                                    <button
                                        type="button"
                                        onClick={() => setRecordFilter('ALL')}
                                        className="text-xs text-[#4A6E85] font-black underline cursor-pointer"
                                    >
                                        查看全部紀錄
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'SYMPTOM' && (
                <div className="space-y-6 animate-soft">
                    {/* 溫馨提示 / 成功提示通知 */}
                    {saveSuccessMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-bounce">
                            <span className="text-2xl">✅</span>
                            <div className="flex-grow">
                                <p className="font-black text-emerald-800 text-sm sm:text-base">{saveSuccessMessage}</p>
                                <p className="text-emerald-600 font-bold text-xs">數據已即時同步到下方的數據看板及字雲中！</p>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                    ✍️ 1. 症狀紀錄表單（與血糖紀錄一致的設計：紀錄時間、紀錄時段、症狀選擇）
                    ========================================================= */}
                    <div className="premium-card bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl space-y-6 shadow-md">
                        
                        {/* 🕒 1. 紀錄時間選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">⏱️</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                            紀錄時間
                                        </span>
                                        {isLiveTime ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                即時
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                ✏️ 補選時間
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-200 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span className="truncate max-w-[170px] sm:max-w-none">
                                        {formattedTime.zh}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {isTimePickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時間挑選面板 */}
                            {isTimePickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3 animate-soft">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="datetime-local"
                                            value={formattedTime.isoForPicker}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleSetTime(new Date(e.target.value), false);
                                                }
                                            }}
                                            className="w-full sm:w-auto flex-grow bg-white border-2 border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-inner"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSetTime(new Date(), true);
                                                setIsTimePickerOpen(false);
                                            }}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                                                isLiveTime 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            設為現在時間
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🏷️ 2. 紀錄時段選擇行 */}
                        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    <span className={`font-black text-slate-800 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                        紀錄時段
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsPeriodPickerOpen(!isPeriodPickerOpen)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50/60 border border-emerald-300 rounded-xl text-[#2A9D8F] font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                                >
                                    <span>{currentPeriodInfo.icon}</span>
                                    <span>{currentPeriodInfo.label}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {isPeriodPickerOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>

                            {/* 展開時段選擇九宮格 */}
                            {isPeriodPickerOpen && (
                                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-2.5 animate-soft">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {PERIOD_OPTIONS.map((item) => {
                                            const isSelected = 
                                                (item.mealTag 
                                                    ? newGlucose.timeType === item.timeType && newGlucose.mealTag === item.mealTag 
                                                    : newGlucose.timeType === item.timeType);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectPeriod(item)}
                                                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${
                                                        isSelected
                                                            ? 'bg-[#2A9D8F] border-[#2A9D8F] text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl">{item.icon}</span>
                                                        {isSelected && <span className="text-xs">✓</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs sm:text-sm">{item.label}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🤒 3. 身體症狀選擇卡片（純文字無 emoji，可多選 + 其他症狀自訂添加） */}
                        <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤒</span>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                                        身體症狀選擇（可多選）
                                    </h4>
                                    {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                        <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                            已選 {newGlucose.symptoms.length} 個
                                        </span>
                                    )}
                                </div>

                                {newGlucose.symptoms && newGlucose.symptoms.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setNewGlucose({ ...newGlucose, symptoms: [] })}
                                        className="text-xs font-bold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                        ✕ 清除全部
                                    </button>
                                )}
                            </div>

                            {/* 預設症狀列表（純文字關鍵詞標籤，無解釋） */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {PREDEFINED_SYMPTOMS.map((symptomName) => {
                                    const isSelected = newGlucose.symptoms?.includes(symptomName) || false;
                                    return (
                                        <button
                                            key={symptomName}
                                            type="button"
                                            onClick={() => {
                                                let next = [...(newGlucose.symptoms || [])];
                                                if (next.includes(symptomName)) {
                                                    next = next.filter(x => x !== symptomName);
                                                } else {
                                                    next.push(symptomName);
                                                }
                                                setNewGlucose({ ...newGlucose, symptoms: next });
                                            }}
                                            className={`p-3 rounded-xl border-2 font-black transition-all flex items-center justify-between cursor-pointer active:scale-95 text-left ${
                                                isLargeFont ? 'text-base p-4' : 'text-xs sm:text-sm'
                                            } ${
                                                isSelected
                                                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                            }`}
                                            style={{ minHeight: '46px' }}
                                        >
                                            <span className="font-extrabold">{symptomName}</span>
                                            <div className={`rounded-md flex items-center justify-center transition-all flex-shrink-0 ml-1 ${
                                                isLargeFont ? 'w-5 h-5 border-2' : 'w-4 h-4 border'
                                            } ${
                                                isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <span className="text-[10px] font-black">✓</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ✍️ 其他症狀自定義添加（手動打字 / 語音輸入） */}
                            <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`font-black text-slate-700 text-xs sm:text-sm flex items-center gap-1.5`}>
                                        ✍️ 其他症狀自訂添加（支援多項或語音）
                                    </span>
                                    {isListening && (
                                        <span className="text-rose-500 font-extrabold flex items-center gap-1 animate-pulse text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                            正在聆聽語音...
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            className={`w-full bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/15 transition-all outline-none rounded-xl ${
                                                isLargeFont ? 'py-3.5 pl-4 pr-10 text-base font-bold' : 'py-2.5 pl-3.5 pr-10 text-xs font-bold'
                                            }`}
                                            placeholder="輸入其他自訂症狀（如：胃脹、胸悶、腰痠，支援逗號或空格）"
                                            value={customSymptomText}
                                            onChange={(e) => setCustomSymptomText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomSymptom();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleVoiceInput('symptom')}
                                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                                isLargeFont ? 'w-8 h-8 text-base' : 'w-7 h-7 text-xs'
                                            } ${
                                                isListening 
                                                    ? 'bg-rose-500 text-white animate-pulse' 
                                                    : 'hover:bg-rose-50 text-rose-500'
                                            }`}
                                            title="點擊語音輸入"
                                        >
                                            🎙️
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSymptom}
                                        className={`bg-[#4A6E85] text-white rounded-xl font-black hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                                            isLargeFont ? 'px-6 py-3 text-sm' : 'px-4 py-2.5 text-xs'
                                        }`}
                                    >
                                        添加
                                    </button>
                                </div>

                                {selectedCustomSymptoms.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        <p className="font-black text-slate-500 text-xs">
                                            已添加自訂症狀（點擊 ✕ 移除）：
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCustomSymptoms.map((sym) => (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    onClick={() => handleRemoveCustomSymptom(sym)}
                                                    className="font-black bg-rose-500 text-white hover:bg-rose-600 rounded-full flex items-center gap-1.5 transition-all shadow-sm cursor-pointer text-xs px-3 py-1"
                                                >
                                                    <span>{sym}</span>
                                                    <span className="text-[10px] bg-white text-rose-500 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                                                        ×
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 💾 4. 儲存症狀紀錄按鈕 */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!newGlucose.timeType) {
                                        alert('請先選擇「測量時段」噢！');
                                        return;
                                    }
                                    if (!newGlucose.symptoms || newGlucose.symptoms.length === 0) {
                                        alert('請至少勾選或添加一項症狀噢！');
                                        return;
                                    }
                                    const originalVal = newGlucose.value;
                                    newGlucose.value = '';
                                    addGlucoseRecord();
                                    setSaveSuccessMessage('🎉 身體症狀紀錄儲存成功！');
                                    setTimeout(() => setSaveSuccessMessage(null), 4500);
                                }}
                                disabled={!(newGlucose.symptoms && newGlucose.symptoms.length > 0)}
                                className={`w-full sm:w-2/3 bg-rose-500 text-white font-black shadow-md hover:bg-rose-600 active:scale-98 transition-all disabled:opacity-35 flex items-center justify-center gap-2 rounded-2xl cursor-pointer ${
                                    isLargeFont ? 'py-4 text-xl' : 'py-3 text-base'
                                }`}
                            >
                                <span>💾 儲存症狀紀錄</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                    已選 {newGlucose.symptoms ? newGlucose.symptoms.length : 0} 個症狀
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* =========================================================
                    📊 2. 症狀視覺字雲與頻次統計
                    ========================================================= */}
                    <div className="premium-card p-5 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-lg space-y-6">
                        
                        {/* 頂部標題與時間範圍切換 */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-[#4A6E85] flex items-center gap-2">
                                    <span>☁️</span>
                                    <span>症狀視覺字雲與統計</span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    當前統計區間：<span className="font-extrabold text-slate-700">{symptomRangeTimeBounds.label}</span> ({symptomRangeTimeBounds.description})
                                </p>
                            </div>

                            {/* ⏳ 時間範圍切換：週 / 月 / 年 / 自定義 */}
                            <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start md:self-auto">
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSymptomRange(item.id)}
                                        className={`font-black transition-all cursor-pointer ${
                                            isLargeFont 
                                                ? 'px-5 py-2 rounded-xl text-base' 
                                                : 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm'
                                        } ${
                                            symptomRange === item.id 
                                                ? 'bg-white shadow-sm text-rose-600' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 📅 自定義時間選擇器模組 (僅在選擇「自定義」時展開) */}
                        {symptomRange === 'CUSTOM' && (
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-soft">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">起始</span>
                                        <input
                                            type="date"
                                            value={symptomCustomStartDate}
                                            onChange={(e) => setSymptomCustomStartDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-slate-300 font-black text-center hidden sm:inline">至</span>
                                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-black text-slate-400 whitespace-nowrap">結束</span>
                                        <input
                                            type="date"
                                            value={symptomCustomEndDate}
                                            onChange={(e) => setSymptomCustomEndDate(e.target.value)}
                                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 快捷時間範圍標籤 */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[11px] font-bold text-slate-400 mr-1">快捷選擇：</span>
                                    {[
                                        { label: '近 3 天', onClick: () => setSymptomCustomPresetDays(3) },
                                        { label: '近 14 天', onClick: () => setSymptomCustomPresetDays(14) },
                                        { label: '近 30 天', onClick: () => setSymptomCustomPresetDays(30) },
                                        { label: '本月', onClick: () => setSymptomCustomPresetThisMonth() }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={preset.onClick}
                                            className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 📊 症狀分類統計指標卡片 */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* 1. 低血糖相關症狀 */}
                            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🔴 低血糖相關症狀</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-amber-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.lowBgCount}
                                    </p>
                                    <span className="text-xs text-amber-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-amber-700/80 font-medium truncate">
                                    冷汗、心悸手震、頭暈、飢餓
                                </p>
                            </div>

                            {/* 2. 高血糖滲透症狀 */}
                            <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🟠 高血糖滲透症狀</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-rose-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.highBgCount}
                                    </p>
                                    <span className="text-xs text-rose-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-rose-700/80 font-medium truncate">
                                    口乾口渴、頻尿、極度疲倦
                                </p>
                            </div>

                            {/* 3. 神經與微血管警示 */}
                            <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">🟣 神經/微血管警示</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <p className="font-black text-purple-700 text-xl sm:text-2xl">
                                        {symptomStats.categorySummary.complicationCount}
                                    </p>
                                    <span className="text-xs text-purple-600 font-bold">次</span>
                                </div>
                                <p className="text-[10px] text-purple-700/80 font-medium truncate">
                                    手腳發麻、視力模糊
                                </p>
                            </div>

                            {/* 4. 最常發生的症狀 */}
                            <div className="bg-sky-50/70 border border-sky-200/80 p-3.5 sm:p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-extrabold text-[11px] sm:text-xs">📈 最常出現症狀</span>
                                </div>
                                {symptomStats.recordedList.length > 0 ? (
                                    <>
                                        <p className="font-black text-[#4A6E85] text-base sm:text-lg truncate mt-1">
                                            {symptomStats.recordedList[0].name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold">
                                            累計 {symptomStats.recordedList[0].count} 次 ({symptomStats.recordedList[0].percentage}%)
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold italic mt-2">此區間暫無紀錄</p>
                                )}
                            </div>
                        </div>

                        {symptomStats.totalRecordsWithSymptom === 0 ? (
                            <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-4xl">💭</p>
                                <p className="text-sm text-slate-500 font-extrabold">在「{symptomRangeTimeBounds.label}」內暫無症狀數據</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    您可切換上方時間範圍（如切換至「月」、「年」或自定義日期），或在上方登記新的症狀紀錄！
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-soft">
                                {/* 篩選提示與重置 */}
                                {selectedSymptomFilter && (
                                    <div className="flex justify-between items-center bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200">
                                        <span className="text-xs text-rose-700 font-black flex items-center gap-1.5">
                                            <span>🔍</span>
                                            <span>正在查看「{selectedSymptomFilter}」的歷史紀錄</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSymptomFilter(null)}
                                            className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm cursor-pointer"
                                        >
                                            清除篩選 ✕
                                        </button>
                                    </div>
                                )}

                                {/* 純文字自適應字雲畫布 */}
                                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 p-6 sm:p-8 bg-slate-50/70 rounded-3xl min-h-[200px] border border-dashed border-slate-200">
                                    {symptomStats.list.map((s) => {
                                        if (s.count === 0) {
                                            return (
                                                <span
                                                    key={s.name}
                                                    className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-lg border border-slate-100 bg-white/40 opacity-40 select-none"
                                                    title="此區間未曾記錄此症狀"
                                                >
                                                    {s.name}
                                                </span>
                                            );
                                        }

                                        // 計算相對權重大小
                                        const ratio = s.count / symptomStats.maxCount;
                                        
                                        let sizeClass = "text-xs sm:text-sm";
                                        let colorClass = "text-slate-600 bg-white hover:bg-slate-100 border-slate-200";
                                        let fontClass = "font-bold";

                                        if (ratio >= 0.8) {
                                            sizeClass = "text-xl sm:text-3xl";
                                            colorClass = "text-rose-700 bg-rose-100 hover:bg-rose-200 border-rose-300 shadow-sm";
                                            fontClass = "font-black tracking-tight";
                                        } else if (ratio >= 0.5) {
                                            sizeClass = "text-lg sm:text-2xl";
                                            colorClass = "text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200";
                                            fontClass = "font-black";
                                        } else if (ratio >= 0.25) {
                                            sizeClass = "text-sm sm:text-lg";
                                            colorClass = "text-slate-800 bg-white hover:bg-rose-50 border-slate-300";
                                            fontClass = "font-extrabold";
                                        }

                                        const isFiltered = selectedSymptomFilter === s.name;

                                        return (
                                            <button
                                                key={s.name}
                                                type="button"
                                                onClick={() => {
                                                    if (isFiltered) {
                                                        setSelectedSymptomFilter(null);
                                                    } else {
                                                        setSelectedSymptomFilter(s.name);
                                                        setIsSymptomRecentRecordsVisible(true);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-2 select-none ${sizeClass} ${fontClass} ${colorClass} ${
                                                    isFiltered 
                                                        ? 'ring-4 ring-rose-500/30 border-rose-500 bg-rose-500 text-white scale-105 shadow-md' 
                                                        : 'hover:scale-105 active:scale-95'
                                                }`}
                                                title={`點擊篩選「${s.name}」紀錄，累計 ${s.count} 次`}
                                            >
                                                <span>{s.name}</span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-inner leading-none ${
                                                    isFiltered ? 'bg-white text-rose-600' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    {s.count}次
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 歷史紀錄 (預設收起，下拉點擊才顯示詳細紀錄) */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base">📋</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    {selectedSymptomFilter 
                                        ? `已篩選症狀：「${selectedSymptomFilter}」的歷史紀錄` 
                                        : `最近紀錄報告`}
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    ({symptomRangeTimeBounds.label} • 共 {filteredSymptomGlucoseRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsSymptomRecentRecordsVisible(!isSymptomRecentRecordsVisible)}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                    {isSymptomRecentRecordsVisible ? '收起詳細紀錄 ▲' : '下拉查看詳細紀錄 ▼'}
                                </button>
                            </div>
                            {selectedSymptomFilter && (
                                <button
                                    onClick={() => setSelectedSymptomFilter(null)}
                                    className={`text-rose-500 hover:underline font-black cursor-pointer ${isLargeFont ? 'text-sm' : 'text-xs'}`}
                                >
                                    清除症狀篩選 ✕
                                </button>
                            )}
                        </div>

                        {/* 僅在下拉展開時顯示詳細紀錄內容 */}
                        {isSymptomRecentRecordsVisible ? (
                            <div className="space-y-4 animate-soft">
                                {(() => {
                                    const baseList = filteredSymptomGlucoseRecords;
                                    const filteredRecords = selectedSymptomFilter 
                                        ? baseList.filter(r => r.symptoms && r.symptoms.includes(selectedSymptomFilter))
                                        : baseList;

                                    if (filteredRecords.length === 0) {
                                        return (
                                            <div className={`bg-white rounded-3xl text-center border-2 border-slate-100 ${isLargeFont ? 'py-16 space-y-4' : 'py-12 space-y-2'}`}>
                                                <p className="text-3xl">🧩</p>
                                                <p className={`text-slate-400 font-extrabold ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                                                    {selectedSymptomFilter 
                                                        ? `在「${symptomRangeTimeBounds.label}」內查無與「${selectedSymptomFilter}」相關的紀錄`
                                                        : `在「${symptomRangeTimeBounds.label}」內暫無歷史紀錄`}
                                                </p>
                                                {selectedSymptomFilter && (
                                                    <button
                                                        onClick={() => setSelectedSymptomFilter(null)}
                                                        className={`text-rose-500 hover:underline font-black cursor-pointer ${isLargeFont ? 'text-base' : 'text-xs'}`}
                                                    >
                                                        查看該時段全部紀錄
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }

                                    return filteredRecords.map(r => {
                                        const hasValue = r.value !== undefined && r.value !== '';
                                        const val = hasValue ? parseFloat(r.value) : NaN;
                                        const isFasting = r.timeType === '空腹' || r.timeType === '餐前';
                                        
                                        let statusColor = 'bg-emerald-400';

                                        if (!hasValue) {
                                            statusColor = 'bg-rose-450';
                                        } else if (val < 4.0) {
                                            statusColor = 'bg-amber-400';
                                        } else if (isFasting && val > 7.0) {
                                            statusColor = 'bg-rose-400';
                                        } else if (!isFasting && val > 10.0) {
                                            statusColor = 'bg-rose-400';
                                        }

                                        return (
                                            <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-6'}`}>
                                                <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-6'}`}>
                                                    <div className={`rounded-full opacity-70 ${isLargeFont ? 'w-5 h-24' : 'w-3.5 h-16'} ${statusColor}`}></div>
                                                    <div className="space-y-1">
                                                        {hasValue ? (
                                                            <div className="flex flex-wrap items-baseline gap-2">
                                                                <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-6xl' : 'text-4xl'}`}>{r.value}</p>
                                                                <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>mmol/L</span>
                                                                {val < 4.0 && (
                                                                    <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>低血糖風險</span>
                                                                )}
                                                                {(isFasting && val > 7.0) || (!isFasting && val > 10.0) ? (
                                                                    <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-1.5' : 'text-xs px-2.5 py-1'}`}>血糖偏高</span>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-black text-rose-500 flex items-center gap-1.5 bg-rose-50/50 rounded-2xl border border-rose-100 ${isLargeFont ? 'text-xl px-5 py-3' : 'text-base px-3.5 py-1.5'}`}>
                                                                    🤒 身體症狀紀錄
                                                                </span>
                                                            </div>
                                                        )}
                                                        
                                                        {r.symptoms && r.symptoms.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2 max-w-xs sm:max-w-md">
                                                                {r.symptoms.map((sym, index) => (
                                                                    <span key={index} className={`font-black bg-rose-50 text-rose-600 border border-rose-100 rounded-full whitespace-nowrap ${isLargeFont ? 'text-sm px-4.5 py-2' : 'text-xs px-2.5 py-1'}`}>
                                                                        {sym}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <p className={`text-slate-400 font-extrabold uppercase tracking-wide mt-1.5 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                            【{r.timeType}】 {r.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setGlucoseRecords(glucoseRecords.filter(rec => rec.id !== r.id))}
                                                    className={`rounded-full flex items-center justify-center text-slate-305 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-10 h-10 text-3xl'}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsSymptomRecentRecordsVisible(true)}
                                className="p-5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center cursor-pointer transition-all space-y-1.5 shadow-xs group"
                            >
                                <p className="text-xs sm:text-sm font-black text-slate-600 flex items-center justify-center gap-2 group-hover:text-[#4A6E85]">
                                    <span>📑</span>
                                    <span>點擊下拉展開查看 <strong>{symptomRangeTimeBounds.label}</strong> 的詳細測量與症狀紀錄 (共 {filteredSymptomGlucoseRecords.length} 筆)</span>
                                    <span className="text-rose-500 font-black transition-transform group-hover:translate-y-0.5">▼</span>
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    預設收起詳細紀錄，點擊此處或上方按鈕即可展開查看
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'HBA1C' && (
                <div className="space-y-6 animate-soft">
                    {/* 輸入檢查結果 */}
                    <div className="premium-card bg-white border border-slate-200/60 p-4 sm:p-6 rounded-3xl space-y-5">
                        <div className="space-y-4">
                            <h3 className={`font-black text-[#4A6E85] text-center ${isLargeFont ? 'text-xl' : 'text-base'}`}>🧬 紀錄糖化血紅素 (HbA1c) 數值</h3>
                            
                            <div className="max-w-[180px] mx-auto relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    inputMode="decimal"
                                    className={`w-full bg-slate-50 border-2 border-[#7FA0B4]/30 text-center focus:border-[#7FA0B4] focus:bg-white outline-none transition-all shadow-sm text-[#4A6E85] font-black rounded-2xl p-4 ${
                                        isLargeFont ? 'text-5xl' : 'text-4xl'
                                    }`}
                                    placeholder="6.0"
                                    value={newHbA1c.value}
                                    onChange={e => setNewHbA1c({...newHbA1c, value: e.target.value})}
                                />
                                <span className={`absolute text-slate-400 font-black pointer-events-none ${isLargeFont ? 'right-5 bottom-4 text-sm' : 'right-4 bottom-3 text-xs'}`}>%</span>
                            </div>

                            {/* Medical Advice Banner based on HbA1c */}
                            {newHbA1c.value && !isNaN(parseFloat(newHbA1c.value)) && (() => {
                                const val = parseFloat(newHbA1c.value);
                                if (val < 6.0) {
                                    return (
                                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2 text-emerald-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">💚</span>
                                            <p className="font-bold text-xs text-emerald-800">
                                                太棒了！糖化血紅素控制在非糖尿病/非常理想的範圍。
                                            </p>
                                        </div>
                                    );
                                } else if (val < 7.0) {
                                    return (
                                        <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 flex items-center gap-2 text-blue-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">👍</span>
                                            <p className="font-bold text-xs text-blue-800">
                                                控制滿意！一般長者糖化血紅素控制在 7.0% 以下為良好。
                                            </p>
                                        </div>
                                    );
                                } else if (val < 8.0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-lg">⚠️</span>
                                            <p className="font-bold text-xs text-amber-800 text-left">
                                                控制尚可。部分高齡或有併發症長者目標可放寬至 8.0% 以下，請遵循醫囑。
                                            </p>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 max-w-md mx-auto shadow-sm">
                                            <span className="text-xl">🚨</span>
                                            <div className="text-xs text-left">
                                                <p className="font-black text-rose-850">數值偏高 ({val}%)</p>
                                                <p className="font-bold text-rose-700">糖化血紅素較高，請配合醫生調整藥物與飲食方案噢。</p>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            <div className="max-w-md mx-auto w-full space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400">📅 選擇檢查/抽血日期：</label>
                                    <input 
                                        type="date"
                                        className={`w-full bg-slate-50 border border-slate-200 font-bold text-slate-600 focus:outline-none focus:border-[#7FA0B4] py-2 px-3 rounded-xl text-sm ${isLargeFont ? 'py-3' : ''}`}
                                        value={newHbA1c.date}
                                        onChange={e => setNewHbA1c({...newHbA1c, date: e.target.value})}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => {
                                            if (newHbA1c.value) {
                                                addHbA1cRecord();
                                            }
                                        }}
                                        disabled={!newHbA1c.value}
                                        className={`w-full bg-[#7FA0B4] text-white font-black shadow-md hover:bg-[#6c91a7] active:scale-95 transition-all cursor-pointer py-3 rounded-xl text-base disabled:opacity-40`}
                                    >
                                        💾 儲存糖化血紅素
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HbA1c 視圖：柔和科學藍系 (Trend/Chart) */}
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-8' : 'p-8 space-y-6'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`bg-[#7FA0B4]/10 rounded-2xl flex items-center justify-center ${isLargeFont ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'}`}>
                                📈
                            </div>
                            <div>
                                <h2 className={`font-black text-[#4A6E85] ${isLargeFont ? 'text-2xl' : 'text-xl'}`}>糖化血紅素趨勢</h2>
                                <p className={`font-medium text-slate-400 ${isLargeFont ? 'text-base' : 'text-sm'}`}>長期血糖控制與平均水平走勢圖</p>
                            </div>
                        </div>
                        
                        <div className={`w-full mt-8 ${isLargeFont ? 'h-[320px]' : 'h-[240px]'}`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" fontSize={isLargeFont ? 13 : 10} fontWeight="600" tick={{ fill: '#94a3b8' }} />
                                        <YAxis domain={[4, 'auto']} fontSize={isLargeFont ? 13 : 10} fontWeight="600" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '1.25rem', 
                                                border: 'none', 
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                                                fontWeight: 'bold',
                                                padding: '12px 16px',
                                                fontSize: isLargeFont ? '1rem' : '0.85rem'
                                            }}
                                        />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="5 5" label={{ value: '目標 (<7%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="5 5" label={{ value: '過高 (>8%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="value" stroke="#7FA0B4" strokeWidth={4} dot={{ r: 6, fill: '#7FA0B4', strokeWidth: 3, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">暫無 HbA1c 趨勢數據</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HbA1c 歷史紀錄報告 */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🧬</span>
                                <h3 className={`font-black text-slate-700 ${isLargeFont ? 'text-xl' : 'text-base'}`}>
                                    最近 HbA1c 紀錄報告
                                </h3>
                                <span className="text-xs font-bold text-slate-400">
                                    (共 {hba1cRecords.length} 筆)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsHba1cRecentRecordsVisible(!isHba1cRecentRecordsVisible)}
                                    className="ml-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                    {isHba1cRecentRecordsVisible ? '收起隱藏 ▲' : '展開顯示 ▼'}
                                </button>
                            </div>
                        </div>

                        {isHba1cRecentRecordsVisible && (
                            <div className="space-y-3 animate-soft">
                                {hba1cRecords.length === 0 ? (
                                    <div className={`bg-white rounded-3xl text-center border-2 border-dashed border-slate-100 ${isLargeFont ? 'py-16 space-y-3 animate-soft' : 'py-12 space-y-2'}`}>
                                        <p className="text-3xl">🧬</p>
                                        <p className={`font-extrabold text-slate-400 ${isLargeFont ? 'text-base' : 'text-sm'}`}>暫無歷史 HbA1c 紀錄數據</p>
                                    </div>
                                ) : (
                                    hba1cRecords.map(r => {
                                        const val = parseFloat(r.value);
                                        let statusColor = 'bg-emerald-400';
                                        if (val >= 8.0) {
                                            statusColor = 'bg-rose-400';
                                        } else if (val >= 7.0) {
                                            statusColor = 'bg-amber-400';
                                        }

                                        return (
                                            <div key={r.id} className={`premium-card flex justify-between items-start bg-white border border-slate-100 shadow-md ${isLargeFont ? 'p-8' : 'p-6'}`}>
                                                <div className={`flex items-center ${isLargeFont ? 'gap-8' : 'gap-6'}`}>
                                                    <div className={`rounded-full opacity-70 ${statusColor} ${isLargeFont ? 'w-5 h-20' : 'w-3.5 h-12'}`}></div>
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-baseline gap-2">
                                                            <p className={`font-black text-slate-800 tracking-tighter ${isLargeFont ? 'text-5xl' : 'text-3xl'}`}>{r.value}</p>
                                                            <span className={`font-black text-slate-400 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>%</span>
                                                            {val >= 8.0 ? (
                                                                <span className={`font-black bg-rose-50 text-rose-500 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>控制不理想</span>
                                                            ) : val >= 7.0 ? (
                                                                <span className={`font-black bg-amber-50 text-amber-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>偏高 需注意</span>
                                                            ) : (
                                                                <span className={`font-black bg-emerald-50 text-emerald-600 rounded-full ml-1 whitespace-nowrap ${isLargeFont ? 'text-sm px-4 px-1.5' : 'text-[10px] px-2.5 py-0.5'}`}>控制理想</span>
                                                            )}
                                                        </div>
                                                        <p className={`text-slate-400 font-extrabold uppercase tracking-wide ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
                                                            📅 檢查日期: {r.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setHba1cRecords(hba1cRecords.filter(rec => rec.id !== r.id))}
                                                    className={`rounded-full flex items-center justify-center text-slate-305 hover:text-rose-500 hover:bg-rose-50 transition-all font-black cursor-pointer ${isLargeFont ? 'w-14 h-14 text-5xl' : 'w-10 h-10 text-3xl'}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
