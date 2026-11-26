/**
 * Shared localStorage seed for DOM snapshots and interaction flows.
 * Key names and JSON shapes must stay identical to production keys.
 */
export function buildSeed(now = Date.now()) {
    const day = 24 * 60 * 60 * 1000;
    const fmt = (ts) => {
        // Format in Asia/Hong_Kong regardless of the Node process timezone.
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(new Date(ts));
        const get = (type) => parts.find((p) => p.type === type)?.value;
        return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
    };
    const profile = {
        name: '陳生',
        age: '72',
        gender: '男',
        height: '168',
        weight: '70',
        weightUnit: 'kg',
        bmi: '24.8',
        lifestyle: '',
        diabetesType: 'TYPE_2',
        yearsWithDiabetes: '12',
        hypertensionYears: '8',
        livingSituation: '',
        medications: 'Metformin (Glucophage); Gliclazide (Diamicron)',
        medicationDetails: [
            { name: 'Metformin (Glucophage)', dosage: '500mg', usage: '每日兩次，隨餐' },
            { name: 'Gliclazide (Diamicron)', dosage: '80mg', usage: '每日一次，早餐前' },
        ],
        otherConditions: '',
        conditions: ['DM', 'HT'],
        conditionDetails: { DM: { years: '12' }, HT: { years: '8' } },
        dietHabits: ['HOME_COOK'],
        favoriteFoods: '叉燒飯、奶茶',
        exerciseWeekly: 'UNDER_150',
        exerciseDaysPerWeek: '3-4',
        exerciseMinutesPerSession: '30',
        exerciseIntensity: 'MODERATE',
        exerciseTypes: ['WALK'],
        clinicType: 'GOPC',
        clinicTypes: ['GOPC'],
        isInsulinUser: false,
        hasCaregiverSupport: true,
        hasNoCaregiverSupport: false,
        nextClinicDate: '',
        nextClinicQuestions: ['我想問醫生可否減藥？'],
        savedDoctorQuestions: ['我想問醫生可否減藥？', '運動幾多先算足夠？'],
    };
    const glucose = [
        { id: 'g1', timeType: '空腹', value: '7.2', date: fmt(now - day), timestamp: now - day, symptoms: [], mealTag: '早餐', dietNote: '一碗白粥', exerciseNote: '', illnessNote: '', medicationNote: '已服早餐藥' },
        { id: 'g2', timeType: '餐後2小時', value: '9.8', date: fmt(now - 2 * day), timestamp: now - 2 * day, symptoms: ['口乾口渴'], mealTag: '午餐', dietNote: '叉燒飯', exerciseNote: '散步 20 分鐘', illnessNote: '', medicationNote: '' },
        { id: 'g3', timeType: '睡前', value: '6.4', date: fmt(now - 4 * day), timestamp: now - 4 * day, symptoms: [], dietNote: '', exerciseNote: '', illnessNote: '', medicationNote: '' },
    ];
    const hba1c = [
        { id: 'h1', value: '7.1', date: '2026-08-01', timestamp: Date.parse('2026-08-01T00:00:00+08:00') },
        { id: 'h2', value: '6.8', date: '2026-11-01', timestamp: Date.parse('2026-11-01T00:00:00+08:00') },
    ];
    const chat = [
        { id: 'c1', role: 'assistant', content: '陳生，你好！今日有咩想問我？' },
    ];
    return {
        dia_profile: JSON.stringify(profile),
        dia_glucose: JSON.stringify(glucose),
        dia_hba1c: JSON.stringify(hba1c),
        dia_large_font: 'true',
        dia_chat_messages: JSON.stringify(chat),
        dia_reminders_v2: JSON.stringify([{ id: 'r1', name: 'Metformin (Glucophage)', time: '08:00' }]),
        dia_taken_logs_v2: JSON.stringify({}),
    };
}
