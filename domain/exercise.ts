/** Exercise type options shown in the profile lifestyle card (plain text, no emoji). */
export const EXERCISE_TYPE_OPTIONS = [
    { id: 'WALK', label: '散步 / 快步走' },
    { id: 'RESISTANCE', label: '深蹲 / 俯臥撐 / 阻力訓練' },
    { id: 'TAICHI', label: '太極 / 八段錦 / 氣功' },
    { id: 'SWIM', label: '游泳 / 水中健體' },
    { id: 'CYCLE', label: '健身單車 / 慢跑' },
    { id: 'STRETCH', label: '晨運拉筋 / 椅子操' },
    { id: 'HIKE', label: '郊遊遠足 / 行山' },
    { id: 'OTHER', label: '其他運動 / 暫無特定項目' }
];

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
