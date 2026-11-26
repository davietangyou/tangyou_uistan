export const calculateBmi = (height: string, weight: string, unit: 'kg' | 'lb' = 'kg') => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && h > 0 && !isNaN(w) && w > 0) {
        const wKg = unit === 'lb' ? w * 0.45359237 : w;
        return (wKg / Math.pow(h / 100, 2)).toFixed(1);
    }
    return '';
};

// 根據每週天數、每次分鐘數與運動強度，計算每週累計時數與 ADA 等級
export const calculateExerciseFromHabits = (days: string, mins: string, intensity?: 'LIGHT' | 'MODERATE' | 'VIGOROUS'): { category: 'NONE' | 'UNDER_150' | 'MET_150'; estimatedMins: number } => {
    if (!days || days === '0' || !mins || mins === '0') {
        return { category: 'NONE', estimatedMins: 0 };
    }
    let d = 0;
    if (days === '1-2') d = 1.5;
    else if (days === '3-4') d = 3.5;
    else if (days === '5+') d = 5.5;

    let m = 0;
    if (mins === '15') m = 15;
    else if (mins === '30') m = 30;
    else if (mins === '45') m = 45;
    else if (mins === '60+') m = 60;

    const total = Math.round(d * m);
    if (total === 0) return { category: 'NONE', estimatedMins: 0 };
    
    // 醫學標準：輕度活動(無出汗/無心跳加快)即使時間長，對胰島素抗性改善亦有限
    if (intensity === 'LIGHT') {
        return { category: 'UNDER_150', estimatedMins: total };
    }

    if (total >= 150) return { category: 'MET_150', estimatedMins: total };
    return { category: 'UNDER_150', estimatedMins: total };
};
