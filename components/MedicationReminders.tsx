/**
 * components/MedicationReminders.tsx
 *
 * 專為香港長者設計的「溫馨用藥提醒與守護」組件。
 * 亮點功能：
 * 1. 支援「老友大字」與標準字型切換。
 * 2. 每日自動重設服藥狀態（基於 YYYY-MM-DD 鍵值）。
 * 3. 根據當前時間（早上、中午、晚上、睡前）動態高亮當前時段，防漏服。
 * 4. 支援從個人檔案一鍵「匯入就醫用藥」，省去老人家打字麻煩。
 * 5. 精緻的進度條和服藥成就回饋，鼓勵長者積極控糖。
 *
 * 接線狀態（請勿刪除）：本組件已完整實作，但目前沒有任何頁面 import 或掛載它。
 * 將來 UI 重構若要接上用藥提醒，應復用本組件。本檔使用 package.json 中的 motion 依賴。
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../utils/types';
import { motion, AnimatePresence } from 'motion/react';
import {loadReminders, persistReminders, loadTakenLogs, persistTakenLogs} from '../domain';

interface MedicationRemindersProps {
    profile: UserProfile;
    isLargeFont: boolean;
    onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

export interface ReminderItem {
    id: string;
    name: string;
    dosage: string;
    period: 'morning' | 'noon' | 'evening' | 'bedtime';
    active: boolean;
}

// 香港常用糖尿與三高專科藥物預設選單，方便長者快速選擇
const HK_COMMON_MEDS = [
    { name: '美獲平 Metformin (二甲雙胍)', dosage: '500mg', period: 'morning' as const },
    { name: '達美康 Diamicron (格列齊特)', dosage: '80mg', period: 'morning' as const },
    { name: '捷諾維 Januvia (西格列汀)', dosage: '100mg', period: 'morning' as const },
    { name: '適糖達 Jardiance (恩格列淨)', dosage: '10mg', period: 'morning' as const },
    { name: '庫魯糖 Glucophage', dosage: '500mg', period: 'evening' as const },
    { name: '胰島素注射 Insulin', dosage: '10單位', period: 'morning' as const }
];

export const MedicationReminders: React.FC<MedicationRemindersProps> = ({
    profile,
    isLargeFont,
    onProfileUpdate
}) => {
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
            const triggerKey = `dia_auto_triggered_${todayStr}_${currentPeriod}`;
            const alreadyTriggered = localStorage.getItem(triggerKey);

            if (!alreadyTriggered) {
                // 標記已自動觸發過
                localStorage.setItem(triggerKey, 'true');
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
    const handleTakeAll = (meds: any[]) => {
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

    return (
        <div className="space-y-1.5">
            {/* 1. 頂部懸浮/醒目未服藥橫幅：如果當前時段有藥未吃，進行溫馨提醒 */}
            {currentPeriodUnfinished.length > 0 && (
                <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-2 px-3 rounded-xl shadow-xs animate-pulse flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">⏰</span>
                        <div className="min-w-0">
                            <p className="font-black text-[11px] leading-tight">吃藥時間到啦！</p>
                            <p className="text-[9px] opacity-95 font-extrabold truncate">
                                【{periodConfigs[currentPeriod].label}】有 {currentPeriodUnfinished.length} 種藥物待服
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const element = document.getElementById('med-timeline-anchor');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        className="bg-white text-rose-600 px-2 py-0.5 rounded-lg font-black text-[10px] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                        立即登記
                    </button>
                </div>
            )}

            {/* 慶祝全服藥完成特效 */}
            {showCelebration && (
                <div className="bg-emerald-500 text-white p-2 px-3 rounded-xl shadow-xs text-center animate-bounce space-y-0.5">
                    <p className="font-black text-[11px]">🎉 非常棒！今日所需藥物已全部服妥！</p>
                    <p className="text-[9px] font-extrabold opacity-95">積極配合醫生用藥，守護健康！</p>
                </div>
            )}

            {/* 2. 主卡片：今日用藥守護 */}
            <div 
                id="med-timeline-anchor"
                className="bg-white rounded-xl p-2.5 border border-slate-100/80 shadow-xs space-y-1.5"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm shrink-0">⏰</span>
                        <div className="min-w-0">
                            <h3 className={`font-black text-slate-800 flex items-center gap-1 truncate ${isLargeFont ? 'text-sm' : 'text-[11px] sm:text-xs'}`}>
                                今日用藥守護
                                {totalCount > 0 && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full font-black shrink-0 border border-emerald-100">
                                        {takenCount}/{totalCount}服
                                    </span>
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* 🔔 測試提醒彈窗 */}
                        <button
                            onClick={() => {
                                setIsTestMode(true);
                                setShowReminderPopup(true);
                            }}
                            className={`font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-lg active:scale-[0.97] transition-all cursor-pointer flex items-center gap-0.5 shrink-0 ${
                                isLargeFont ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'
                            }`}
                        >
                            <span>🔔</span> 測試提醒
                        </button>

                        {/* 管理按鈕 */}
                        <button
                            onClick={() => setIsManageOpen(true)}
                            className={`font-black text-[#4A6E85] bg-[#4A6E85]/10 hover:bg-[#4A6E85]/15 border border-[#4A6E85]/20 rounded-lg active:scale-[0.97] transition-all cursor-pointer flex items-center gap-0.5 shrink-0 ${
                                isLargeFont ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'
                            }`}
                        >
                            <span>⚙️</span> 設定
                        </button>
                    </div>
                </div>

                {/* 輕量極簡微進度條 */}
                {totalCount > 0 && (
                    <div className="w-full bg-slate-100 h-0.5 rounded-full overflow-hidden shrink-0">
                        <div 
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500"
                            style={{ width: `${(takenCount / totalCount) * 100}%` }}
                        />
                    </div>
                )}

                {/* 極致緊湊四時段 Tab 切換列 */}
                {totalCount > 0 && (
                    <div className="grid grid-cols-4 gap-0.5 bg-slate-100/60 p-0.5 rounded-lg">
                        {(['morning', 'noon', 'evening', 'bedtime'] as const).map(pKey => {
                            const pConfig = periodConfigs[pKey];
                            const isSelected = selectedPeriod === pKey;
                            const isCurrent = currentPeriod === pKey;
                            const pMeds = todayReminders.filter(r => r.period === pKey);
                            const pTotal = pMeds.length;
                            const pTaken = pMeds.filter(r => takenLogs[getTakenKey(r.id)]).length;

                            let statusDot = null;
                            if (pTotal > 0) {
                                if (pTaken === pTotal) {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />;
                                } else if (isCurrent) {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shrink-0" />;
                                } else {
                                    statusDot = <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />;
                                }
                            }

                            return (
                                <button
                                    key={pKey}
                                    type="button"
                                    onClick={() => setSelectedPeriod(pKey)}
                                    className={`flex items-center justify-center gap-0.5 py-0.5 rounded transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-white text-[#4A6E85] shadow-xs font-black' 
                                            : 'text-slate-500 hover:bg-white/30 font-extrabold'
                                    }`}
                                >
                                    <span className="text-xs leading-none">{pConfig.icon}</span>
                                    <span className="text-[9px] tracking-tight">
                                        {pKey === 'morning' ? '晨' : pKey === 'noon' ? '午' : pKey === 'evening' ? '晚' : '睡'}
                                    </span>
                                    {statusDot}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 選中時段的服藥細項列表 */}
                <div className="mt-0.5">
                    {totalCount === 0 ? (
                        <div className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200/50">
                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <span>💊</span> 暫無啟用中的用藥提醒
                            </p>
                            <button
                                onClick={() => setIsManageOpen(true)}
                                className="text-[9px] font-black text-[#4A6E85] hover:underline cursor-pointer bg-[#4A6E85]/5 px-2 py-0.5 rounded border border-[#4A6E85]/10"
                            >
                                點此新增
                            </button>
                        </div>
                    ) : (
                        (() => {
                            const pMeds = todayReminders.filter(r => r.period === selectedPeriod);
                            const pConfig = periodConfigs[selectedPeriod];

                            return (
                                <div className="space-y-1">
                                    {/* 緊湊服藥清單 */}
                                    {pMeds.length === 0 ? (
                                        <div className="text-center py-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold">
                                                🍀 此時段無登錄之藥物。
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {pMeds.map(med => {
                                                const isTaken = !!takenLogs[getTakenKey(med.id)];
                                                return (
                                                    <div 
                                                        key={med.id}
                                                        className={`flex items-center justify-between gap-2 p-1 px-2 rounded-lg border transition-all ${
                                                            isTaken 
                                                                ? 'bg-emerald-50/40 border-emerald-100/50 text-emerald-950' 
                                                                : 'bg-slate-50/40 border-slate-100/50 text-slate-800'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-grow">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] shrink-0">💊</span>
                                                                <p className={`font-black text-[10px] sm:text-[11px] truncate ${isTaken ? 'line-through text-slate-400' : ''}`}>
                                                                    {med.name}
                                                                </p>
                                                            </div>
                                                            <p className={`text-[8px] pl-3.5 font-extrabold ${isTaken ? 'text-slate-400' : 'text-slate-400'}`}>
                                                                劑量: {med.dosage}
                                                            </p>
                                                        </div>
                                                        {/* 登記按鈕 */}
                                                        <button
                                                            onClick={() => toggleTaken(med.id)}
                                                            className={`flex items-center gap-0.5 py-0.5 px-1.5 rounded text-[9px] font-black cursor-pointer active:scale-95 transition-all shrink-0 ${
                                                                isTaken
                                                                    ? 'bg-emerald-500 text-white shadow-xs'
                                                                    : 'bg-[#4A6E85]/10 text-[#4A6E85] border border-[#4A6E85]/20 hover:bg-[#4A6E85]/15'
                                                            }`}
                                                        >
                                                            <span>{isTaken ? '🟢 已服' : '⚪ 登記'}</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>

            {/* 3. 設定與管理對話框 Overlay / Modal */}
            {isManageOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8">
                        
                        {/* 對話框頭部 */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5">
                                    <span>⚙️</span> 設定您的用藥提醒
                                </h3>
                                <p className="text-[10px] text-slate-400 font-extrabold">管理服藥方案，預防忘記服藥</p>
                            </div>
                            <button
                                onClick={() => setIsManageOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* 對話框主內容 */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-grow">
                            
                            {/* 一鍵匯入區 */}
                            <div className="bg-gradient-to-r from-[#E8DED2]/20 to-orange-50/20 p-4 rounded-2xl border border-orange-200/40 space-y-2">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>📥</span> 一鍵匯入健康資料
                                </h4>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    AI 能讀取您在「個人設定」中登記服用之專科藥物，並自動建立每天提醒。
                                </p>
                                <button
                                    type="button"
                                    onClick={handleImportMeds}
                                    className="w-full bg-[#4A6E85] hover:bg-[#3d5b70] text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center"
                                >
                                    📥 匯入個人已登記藥物
                                </button>
                            </div>

                            {/* 手動新增表單 */}
                            <form onSubmit={handleAddReminder} className="space-y-3.5 border-t border-slate-100 pt-4">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>➕</span> 手動新增提醒項目
                                </h4>

                                <div className="space-y-2">
                                    {/* 快速選藥 dropdown */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 block mb-1">快速選藥 (可在此直接選擇香港常用藥物)：</label>
                                        <select
                                            className="w-full bg-slate-50 p-2.5 rounded-xl font-extrabold text-xs text-slate-700 outline-none border border-slate-200 cursor-pointer"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const selected = HK_COMMON_MEDS.find(m => m.name === e.target.value);
                                                if (selected) {
                                                    setNewMedName(selected.name);
                                                    setNewDosage(selected.dosage);
                                                    setNewPeriod(selected.period);
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">-- 點此選擇常用藥物 --</option>
                                            {HK_COMMON_MEDS.map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 藥物名稱輸入 */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 block mb-1">藥物名稱 (可自行手動修改)：</label>
                                        <input
                                            type="text"
                                            placeholder="請輸入藥物名稱，如：美獲平 Metformin"
                                            required
                                            value={newMedName}
                                            onChange={(e) => setNewMedName(e.target.value)}
                                            className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-[#4A6E85]/50 focus:bg-white"
                                        />
                                    </div>

                                    {/* 劑量與時段二合一 */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1">劑量：</label>
                                            <input
                                                type="text"
                                                placeholder="如：500mg, 1粒"
                                                value={newDosage}
                                                onChange={(e) => setNewDosage(e.target.value)}
                                                className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-[#4A6E85]/50 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1">服用時段：</label>
                                            <select
                                                value={newPeriod}
                                                onChange={(e: any) => setNewPeriod(e.target.value)}
                                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold text-xs text-slate-700 outline-none border border-slate-200 cursor-pointer"
                                            >
                                                <option value="morning">🌄 早上/早餐後</option>
                                                <option value="noon">☀️ 中午/午餐後</option>
                                                <option value="evening">🌆 晚上/晚餐後</option>
                                                <option value="bedtime">🌙 睡前</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-center"
                                >
                                    ＋ 登記此用藥提醒
                                </button>
                            </form>

                            {/* 目前提醒列表與管理 */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>📋</span> 目前提醒清單 ({reminders.length})
                                </h4>

                                {reminders.length === 0 ? (
                                    <p className="text-center py-4 text-slate-400 font-bold text-xs">暫無設定之用藥清單。</p>
                                ) : (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {reminders.map(rem => (
                                            <div 
                                                key={rem.id} 
                                                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                                                    rem.active 
                                                        ? 'bg-slate-50 border-slate-200/60' 
                                                        : 'bg-slate-100/50 border-slate-200/30 opacity-60'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-grow">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">{periodConfigs[rem.period].icon}</span>
                                                        <p className="font-extrabold text-xs text-slate-800 truncate">{rem.name}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-extrabold pl-4">
                                                        劑量: {rem.dosage} • 時段: {periodConfigs[rem.period].label}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* 開關 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(rem.id)}
                                                        className={`text-[10px] font-black px-2 py-1 rounded-lg border cursor-pointer active:scale-95 transition-all ${
                                                            rem.active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                                                : 'bg-slate-200 text-slate-500 border-slate-300/40'
                                                        }`}
                                                    >
                                                        {rem.active ? '啟用中' : '已關閉'}
                                                    </button>
                                                    {/* 刪除 */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReminder(rem.id)}
                                                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 底部關閉 */}
                        <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl">
                            <button
                                type="button"
                                onClick={() => setIsManageOpen(false)}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs py-3 rounded-xl transition-all text-center cursor-pointer"
                            >
                                完成設定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. 溫馨用藥提醒互動彈窗 */}
            <AnimatePresence>
                {showReminderPopup && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* 彈窗頭部：溫暖和煦的配色，凸顯健康守護 */}
                            <div className="bg-gradient-to-r from-[#4A6E85] to-[#7FA0B4] p-5 sm:p-6 text-white shrink-0 relative">
                                <div className="absolute right-4 top-4">
                                    <button
                                        onClick={() => setShowReminderPopup(false)}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl animate-bounce">⏰</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {periodConfigs[currentPeriod].icon} {periodConfigs[currentPeriod].label}
                                            </span>
                                            {isTestMode && (
                                                <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                                                    🛠️ 模擬測試中
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-lg sm:text-xl mt-1.5">老友記，吃藥時間到啦！</h3>
                                    </div>
                                </div>
                            </div>

                            {/* 溫馨提示卡片 */}
                            <div className="px-5 py-4 sm:px-6 bg-orange-50/50 border-b border-orange-100 flex items-start gap-2.5 shrink-0">
                                <span className="text-lg">❤️</span>
                                <div className="space-y-1">
                                    <p className="text-xs sm:text-sm font-bold text-orange-900 leading-relaxed">
                                        適時用藥可以更穩定控制血糖。請記得準備一杯溫開水，不要空腹服藥（除非醫生另有指示）喔！
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const meds = (isTestMode && reminders.filter(r => r.active && r.period === currentPeriod).length === 0)
                                                    ? ['美獲平 Metformin', '達美康 Diamicron']
                                                    : reminders.filter(r => r.active && r.period === currentPeriod).map(r => r.name);
                                                const names = meds.join('、');
                                                speakReminder(`老友記，現在是${periodConfigs[currentPeriod].label}。您需要服用：${names || '您設定的藥物'}。記得用溫水送服。`);
                                            }}
                                            className="text-[10px] font-black text-[#4A6E85] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            🔊 廣東話念讀藥單
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 待服藥物清單 */}
                            <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-4">
                                {(() => {
                                    const meds = (isTestMode && reminders.filter(r => r.active && r.period === currentPeriod).length === 0)
                                        ? [
                                            { id: 'mock_1', name: '美獲平 Metformin (二甲雙胍)', dosage: '500mg (1粒)', period: currentPeriod, active: true },
                                            { id: 'mock_2', name: '達美康 Diamicron (格列齊特)', dosage: '80mg (1粒)', period: currentPeriod, active: true }
                                          ]
                                        : reminders.filter(r => r.active && r.period === currentPeriod);

                                    if (meds.length === 0) {
                                        return (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-3xl block mb-2">🍀</span>
                                                <p className="text-sm text-slate-500 font-extrabold">此時段沒有安排服用藥物。</p>
                                                <p className="text-xs text-slate-400 font-bold mt-1">您可以點擊「設定」新增在此時段服用的藥物。</p>
                                            </div>
                                        );
                                    }

                                    const allFinished = meds.every(m => {
                                        const isMock = m.id.startsWith('mock_');
                                        return isMock ? !!mockTaken[m.id] : !!takenLogs[getTakenKey(m.id)];
                                    });

                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs text-slate-400 font-black px-1">
                                                <span>💊 應服藥物 ({meds.length})</span>
                                                <span>狀態</span>
                                            </div>

                                            {meds.map(med => {
                                                const isMock = med.id.startsWith('mock_');
                                                const isTaken = isMock ? !!mockTaken[med.id] : !!takenLogs[getTakenKey(med.id)];

                                                return (
                                                    <div
                                                        key={med.id}
                                                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                            isTaken
                                                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-inner'
                                                                : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100'
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {isTaken ? (
                                                                    <span className="text-emerald-600 text-sm">✅</span>
                                                                ) : (
                                                                    <span className="text-rose-500 text-sm animate-pulse">💊</span>
                                                                )}
                                                                <h4 className={`font-black truncate ${isTaken ? 'line-through text-slate-400' : 'text-slate-800'} ${isLargeFont ? 'text-base' : 'text-sm sm:text-base'}`}>
                                                                    {med.name}
                                                                </h4>
                                                            </div>
                                                            <p className={`text-xs pl-5 font-black mt-0.5 ${isTaken ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                服用劑量：{med.dosage}
                                                            </p>
                                                        </div>

                                                        {/* 獨立已服藥按鈕 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePopupToggleTaken(med.id, isMock)}
                                                            className={`px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                                                                isTaken
                                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                    : 'bg-[#4A6E85] text-white hover:bg-[#3D5B70]'
                                                            }`}
                                                        >
                                                            {isTaken ? '🟢 已服藥' : '⚪ 登記服藥'}
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {/* 一鍵全部服藥按鈕 */}
                                            {!allFinished && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTakeAll(meds)}
                                                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    <span>✨</span> 我已吃完本時段所有藥物
                                                </button>
                                            )}

                                            {allFinished && (
                                                <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1 mt-3">
                                                    <p className="font-black text-emerald-800 text-sm">🎉 恭喜！本時段所需藥物已全部服妥！</p>
                                                    <p className="text-xs text-emerald-600 font-extrabold">積極配合醫生用藥，血糖守護更安心！</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* 底部按鈕 */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        speakReminder("稍後會再次提醒您服藥，請保重身體喔！");
                                        setShowReminderPopup(false);
                                    }}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs sm:text-sm py-3 rounded-2xl transition-all cursor-pointer text-center"
                                >
                                    稍後提醒我 ⏰
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReminderPopup(false)}
                                    className="flex-1 bg-[#4A6E85] hover:bg-[#3D5B70] text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md transition-all cursor-pointer text-center"
                                >
                                    我知道了 👍
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
