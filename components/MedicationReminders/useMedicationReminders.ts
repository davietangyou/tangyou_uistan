import { useState, useEffect } from 'react';
import {loadReminders, persistReminders, loadTakenLogs, persistTakenLogs, hasAutoTriggered, markAutoTriggered} from '../../domain';
import type { MedicationRemindersProps, ReminderItem } from './types';
import { HK_COMMON_MEDS } from './constants';

export function useMedicationReminders({
    profile,
    isLargeFont,
    onProfileUpdate
}: MedicationRemindersProps) {
    // 1. 初始化狀態
    const [reminders, setReminders] = useState<ReminderItem[]>(() => {
        // 預設空的提醒
        return loadReminders<ReminderItem>([]);
    });

    const [takenLogs, setTakenLogs] = useState<Record<string, boolean>>(() => loadTakenLogs({}));

    const [isManageOpen, setIsManageOpen] = useState(false);
    const [newMedName, setNewMedName] = useState('');
    const [newDosage, setNewDosage] = useState('');
    const [newPeriod, setNewPeriod] = useState<'morning' | 'noon' | 'evening' | 'bedtime'>('morning');
    const [showCelebration, setShowCelebration] = useState(false);

    // 2a. 用藥提醒互動彈窗狀態
    const [showReminderPopup, setShowReminderPopup] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);
    const [mockTaken, setMockTaken] = useState<Record<string, boolean>>({});

    // 2b. 獲取當前日期字串 (YYYY-MM-DD)
    const getTodayStr = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayStr = getTodayStr();

    // 保存提醒到 localStorage
    useEffect(() => {
        persistReminders(reminders);
    }, [reminders]);

    // 保存服藥記錄到 localStorage
    useEffect(() => {
        persistTakenLogs(takenLogs);
    }, [takenLogs]);

    // 3. 獲取當前時段
    const [currentPeriod, setCurrentPeriod] = useState<'morning' | 'noon' | 'evening' | 'bedtime'>('morning');

    useEffect(() => {
        const checkPeriod = () => {
            const h = new Date().getHours();
            if (h >= 5 && h < 12) {
                setCurrentPeriod('morning');
            } else if (h >= 12 && h < 17) {
                setCurrentPeriod('noon');
            } else if (h >= 17 && h < 21) {
                setCurrentPeriod('evening');
            } else {
                setCurrentPeriod('bedtime');
            }
        };
        checkPeriod();
        const interval = setInterval(checkPeriod, 60000); // 每分鐘檢查一次
        return () => clearInterval(interval);
    }, []);

    const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'noon' | 'evening' | 'bedtime'>('morning');

    // 當 currentPeriod 改變時，自動同步 selectedPeriod
    useEffect(() => {
        setSelectedPeriod(currentPeriod);
    }, [currentPeriod]);

    // 溫馨廣東話/中文語音提示
    const speakReminder = (text: string) => {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-HK'; // 香港廣東話
                utterance.rate = 0.85;    // 專為長者放慢語速
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.error("Speech synthesis failed", err);
            }
        }
    };

    // 自動彈窗溫馨提醒：當到達服藥時段，且有未服藥物時，自動彈出溫馨提醒 (每天每個時段只自動彈出一次，避免干擾)
    useEffect(() => {
        if (reminders.length === 0) return;

        // 篩選出當前時段需要服用的未服藥物
        const currentPeriodMeds = reminders.filter(r => r.active && r.period === currentPeriod);
        const unfinished = currentPeriodMeds.filter(r => !takenLogs[`${todayStr}_${r.id}`]);

        if (unfinished.length > 0) {
            const alreadyTriggered = hasAutoTriggered(todayStr, currentPeriod);

            if (!alreadyTriggered) {
                // 標記已自動觸發過
                markAutoTriggered(todayStr, currentPeriod);
                setIsTestMode(false);
                setShowReminderPopup(true);
                
                // 廣東話溫馨語音播報
                const medNames = unfinished.map(m => m.name).join('、');
                speakReminder(`老友記，吃藥時間到啦！您有${unfinished.length}種藥物需要服用，包括：${medNames}。記得用溫水送服，保重身體呀！`);
            }
        }
    }, [currentPeriod, reminders, takenLogs, todayStr]);

    // 4. 時段中文化與圖示定義
    const periodConfigs = {
        morning: { label: '早上/早餐後', icon: '🌄', color: 'from-amber-50 to-orange-100/30 border-orange-200/50 text-orange-800' },
        noon: { label: '中午/午餐後', icon: '☀️', color: 'from-sky-50 to-blue-100/30 border-sky-200/50 text-sky-800' },
        evening: { label: '晚上/晚餐後', icon: '🌆', color: 'from-orange-50 to-rose-100/30 border-rose-200/50 text-rose-800' },
        bedtime: { label: '睡前', icon: '🌙', color: 'from-indigo-50 to-indigo-100/30 border-indigo-200/50 text-indigo-900' }
    };

    // 5. 判斷是否有未服藥提醒，用於頂部緊急提醒
    const activeReminders = reminders.filter(r => r.active);
    const todayReminders = activeReminders;

    const getTakenKey = (id: string) => `${todayStr}_${id}`;

    const takenCount = todayReminders.filter(r => takenLogs[getTakenKey(r.id)]).length;
    const totalCount = todayReminders.length;

    // 處理勾選服藥狀態
    const toggleTaken = (id: string) => {
        const key = getTakenKey(id);
        const wasTaken = !!takenLogs[key];
        const nextLogs = { ...takenLogs, [key]: !wasTaken };
        setTakenLogs(nextLogs);

        // 如果這次是「已服藥」，且勾選後剛好全部服完，播放一個小動畫
        if (!wasTaken) {
            const tempTakenCount = todayReminders.filter(r => nextLogs[getTakenKey(r.id)]).length;
            if (tempTakenCount === totalCount && totalCount > 0) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);
            }
        }
    };

    // 處理彈窗中個別藥物的服藥登記
    const handlePopupToggleTaken = (medId: string, isMock: boolean) => {
        if (isMock) {
            setMockTaken(prev => {
                const updated = { ...prev, [medId]: !prev[medId] };
                if (updated[medId]) {
                    speakReminder("登錄成功，您已服用此藥物！非常棒！");
                }
                return updated;
            });
        } else {
            const key = getTakenKey(medId);
            const wasTaken = !!takenLogs[key];
            toggleTaken(medId);
            if (!wasTaken) {
                speakReminder("登錄成功，您已服用此藥物！非常棒！");
            }
        }
    };

    // 處理一鍵登記時段內所有藥物已服用
    const handleTakeAll = (meds: ReminderItem[]) => {
        meds.forEach(med => {
            const isMock = med.id.startsWith('mock_');
            if (isMock) {
                setMockTaken(prev => ({ ...prev, [med.id]: true }));
            } else {
                const key = getTakenKey(med.id);
                if (!takenLogs[key]) {
                    toggleTaken(med.id);
                }
            }
        });
        speakReminder("太棒了！您已吃完了這個時段的所有藥物。請繼續保持健康習慣，守護健康！");
        
        // 顯示主進度條慶祝動畫
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
        
        // 延遲關閉彈窗以提供視覺回饋
        setTimeout(() => setShowReminderPopup(false), 1200);
    };

    // 一鍵匯入用戶在「就醫用藥」中登記的糖尿藥物
    const handleImportMeds = () => {
        if (!profile.medicationDetails || profile.medicationDetails.length === 0) {
            alert('您目前尚未在「個人設定」中登記常用藥物。請先到「個人設定 -> 修改健康資料 -> 醫療用藥」中新增！');
            return;
        }

        const imported: ReminderItem[] = profile.medicationDetails.map((med, idx) => {
            // 推測時段 (根據 usage 欄位中文化關鍵字)
            let period: 'morning' | 'noon' | 'evening' | 'bedtime' = 'morning';
            const usageLower = med.usage.toLowerCase();
            if (usageLower.includes('晚') || usageLower.includes('夜') || usageLower.includes('pm')) {
                period = 'evening';
            } else if (usageLower.includes('中') || usageLower.includes('午') || usageLower.includes('12')) {
                period = 'noon';
            } else if (usageLower.includes('睡')) {
                period = 'bedtime';
            }

            return {
                id: `import_${idx}_${Date.now()}`,
                name: med.name,
                dosage: med.dosage || '適量',
                period,
                active: true
            };
        });

        // 避免重複
        const merged = [...reminders];
        imported.forEach(imp => {
            if (!merged.some(m => m.name === imp.name && m.period === imp.period)) {
                merged.push(imp);
            }
        });

        setReminders(merged);
        alert(`成功匯入 ${imported.length} 種服藥項目！您可以手動微調服用時段。`);
    };

    // 手動新增提醒
    const handleAddReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMedName.trim()) return;

        const newItem: ReminderItem = {
            id: `manual_${Date.now()}`,
            name: newMedName.trim(),
            dosage: newDosage.trim() || '1粒',
            period: newPeriod,
            active: true
        };

        setReminders([...reminders, newItem]);
        setNewMedName('');
        setNewDosage('');
    };

    // 刪除提醒
    const handleDeleteReminder = (id: string) => {
        setReminders(reminders.filter(r => r.id !== id));
    };

    // 切換啟用狀態
    const toggleActive = (id: string) => {
        setReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    // 判斷哪些時段有藥要吃
    const groupedReminders = {
        morning: todayReminders.filter(r => r.period === 'morning'),
        noon: todayReminders.filter(r => r.period === 'noon'),
        evening: todayReminders.filter(r => r.period === 'evening'),
        bedtime: todayReminders.filter(r => r.period === 'bedtime')
    };

    // 當前時段未服藥的醒目提醒
    const currentPeriodUnfinished = groupedReminders[currentPeriod].filter(r => !takenLogs[getTakenKey(r.id)]);


    return {
        profile,
        isLargeFont,
        onProfileUpdate,
        reminders, setReminders,
        takenLogs, setTakenLogs,
        isManageOpen, setIsManageOpen,
        newMedName, setNewMedName,
        newDosage, setNewDosage,
        newPeriod, setNewPeriod,
        showCelebration, setShowCelebration,
        showReminderPopup, setShowReminderPopup,
        isTestMode, setIsTestMode,
        mockTaken, setMockTaken,
        getTodayStr,
        todayStr,
        currentPeriod, setCurrentPeriod,
        selectedPeriod, setSelectedPeriod,
        speakReminder,
        periodConfigs,
        activeReminders,
        todayReminders,
        getTakenKey,
        takenCount,
        totalCount,
        toggleTaken,
        handlePopupToggleTaken,
        handleTakeAll,
        handleImportMeds,
        handleAddReminder,
        handleDeleteReminder,
        toggleActive,
        groupedReminders,
        currentPeriodUnfinished,
        HK_COMMON_MEDS,
    };
}

export type MedicationRemindersViewModel = ReturnType<typeof useMedicationReminders>;
