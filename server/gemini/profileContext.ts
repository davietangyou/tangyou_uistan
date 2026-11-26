import type { UserProfile } from "../../utils/types.ts";
import { conditionsList } from "../../utils/constants.ts";

const CONDITION_LABEL_MAP: Record<string, string> = {
    NONE: '無其他已知長期疾病',
    ...Object.fromEntries(conditionsList.map(c => [c.id, c.label]))
};

const DIET_HABIT_LABEL_MAP: Record<string, string> = {
    OUTSIDE_EATING: '經常出街食飯（外食為主）',
    REFINED_CARB: '主食偏好精製澱粉（如白飯、麵包、河粉、粥）',
    SUGARY_DRINK: '習慣飲含糖飲品（如奶茶、凍檸茶、汽水）',
    MIDNIGHT_SNACK: '有食宵夜或睡前點心習慣',
    HOME_COOK: '飲食定時定量，家中自煮為主'
};

const EXERCISE_INTENSITY_LABEL_MAP: Record<string, string> = {
    LIGHT: '輕度活動（輕鬆無明顯出汗）',
    MODERATE: '中等強度（微出汗、可說話但不能唱歌）',
    VIGOROUS: '劇烈強度（明顯氣喘）'
};

function buildProfileConstraints(profile?: Partial<UserProfile>): string[] {
    const safeProfile = profile || {};
    const constraints: string[] = [];
    const conditions = safeProfile.conditions || [];
    const dietHabits = safeProfile.dietHabits || [];

    if (conditions.includes('OA')) {
        constraints.push(
            '【運動安全約束（退化性關節炎）】：患者患有退化性關節炎。提供任何運動建議時，必須優先推薦低衝擊、保護關節的運動（如平地慢步、水中健體、坐姿椅子操、太極或溫和伸展），並明確提醒避開深蹲、跑跳、頻繁爬樓梯或陡坡行山等增加膝／髖關節負荷的動作。'
        );
    }
    if (conditions.includes('HD') || conditions.includes('ST') || safeProfile.isFrail) {
        constraints.push(
            '【運動安全約束（心腦血管／體弱風險）】：患者有心臟病、中風病史或屬高齡體弱情況。建議運動須循序漸進、以輕至中等負荷為主，並提醒若出現胸悶、氣喘或頭暈應立即停止休息。'
        );
    }
    if (conditions.includes('RD')) {
        constraints.push(
            '【運動安全約束（呼吸系統疾病）】：患者有呼吸系統疾病，建議運動時須注意調節呼吸節奏、避免過於劇烈或引發喘促的活動。'
        );
    }
    if (conditions.includes('CT')) {
        constraints.push(
            '【日常安全提示（白內障）】：患者有白內障，戶外運動或查看藥物標籤／血糖機數值時需提醒注意光線充足與防跌倒。'
        );
    }

    if (dietHabits.includes('OUTSIDE_EATING')) {
        constraints.push(
            '【飲食情境約束（外食為主）】：患者日常以外食為主。提供控糖飲食建議時，不可只建議「自己在家煮」，必須優先提供香港常見外食場景（茶餐廳、燒味飯、兩餸飯、粉麵店、飲茶點心）的具體點餐與改良技巧（如少飯／半碗飯、燒味去皮去肥、走汁或醬汁另上、加點灼菜走油、飲品走甜）。'
        );
    }
    if (dietHabits.includes('REFINED_CARB')) {
        constraints.push(
            '【飲食情境約束（偏好精製澱粉）】：患者主食偏好白飯、麵包、河粉或粥，建議時須提供易於執行的份量控制與替換技巧（如先菜肉後吃飯、白粥減量並配瘦肉蔬菜、半碗飯配高纖蔬菜）。'
        );
    }
    if (dietHabits.includes('SUGARY_DRINK')) {
        constraints.push(
            '【飲食情境約束（含糖飲品習慣）】：患者習慣飲用含糖飲品（如奶茶、凍檸茶、汽水），飲食建議須針對性提醒「走甜／少甜／轉無糖熱茶或檸檬水」等實際替代方案。'
        );
    }
    if (dietHabits.includes('MIDNIGHT_SNACK')) {
        constraints.push(
            '【飲食情境約束（宵夜習慣）】：患者有宵夜或睡前點心習慣，須針對性提醒減少高糖高澱粉宵夜，如因肚餓或防夜間低血糖需加餐，應建議低負擔選擇（如無糖豆漿、少量全麥梳打餅）並配合睡前血糖監測。'
        );
    }

    return constraints;
}


export function formatUserProfileSummary(profileInput?: Partial<UserProfile>): string {
    const profile = (profileInput || {}) as UserProfile;
    const riskFlags: string[] = [];
    if (profile.isInsulinUser) riskFlags.push("正在使用胰島素 (高風險)");
    if (profile.hasHypoHistory) riskFlags.push("有低血糖病史");
    if (profile.isFrail) riskFlags.push("高齡/體弱個體 (需放寬目標)");
    if (profile.hasHypoUnawareness) riskFlags.push("無感低血糖 (極高風險)");
    if (profile.hasNoCaregiverSupport) riskFlags.push("無家人或照顧者協助 (獨居高風險，需給予更安全、易操作的個人照護建議)");
    if (profile.hasCaregiverSupport) riskFlags.push("有家人或照顧者同住協助");
    const readableConditions = (profile.conditions || []).map(condId => {
        if (condId === 'OT') {
            const customName = (profile.otherConditions || profile.conditionDetails?.OT?.specificName || '').trim();
            const years = profile.conditionDetails?.OT?.years;
            const base = customName ? `其他（${customName}）` : '其他長期疾病';
            return years ? `${base}（${years}年）` : base;
        }
        const label = CONDITION_LABEL_MAP[condId] || condId;
        const years = condId === 'HT'
            ? (profile.hypertensionYears || profile.conditionDetails?.HT?.years)
            : (condId === 'DM' ? (profile.yearsWithDiabetes || profile.conditionDetails?.DM?.years) : profile.conditionDetails?.[condId]?.years);
        return years ? `${label}（${years}年）` : label;
    });
    if (readableConditions.length > 0) {
        riskFlags.push(`已知合併症/慢性病：${readableConditions.join('、')}`);
    }

    const clinicLabels: Record<string, string> = {
        'GOPC': '醫管局家庭醫學門診/普通科門診',
        'SOPC': '醫管局專科門診',
        'DHC': '地區康健中心 / 康健站',
        'PRIVATE': '私家診所 / 家庭醫生',
        'OTHER': '其他醫療機構',
        'NONE': '暫無定期覆診習慣'
    };
    const userClinics = profile.clinicTypes && profile.clinicTypes.length > 0
        ? profile.clinicTypes.map(c => clinicLabels[c] || c).join('、')
        : (profile.clinicType ? (clinicLabels[profile.clinicType] || profile.clinicType) : '未填寫');

    const exerciseTypesList = (profile.exerciseTypes || []).map(t => {
        if (t === 'WALK') return '散步/快步走';
        if (t === 'RESISTANCE') return '深蹲/俯臥撐/彈力帶/啞鈴抗阻肌力訓練';
        if (t === 'TAICHI') return '太極/八段錦/氣功';
        if (t === 'SWIM') return '游泳/水中健體';
        if (t === 'CYCLE') return '健身單車/慢跑';
        if (t === 'STRETCH') return '晨運拉筋/椅子操/提踵踮腳';
        if (t === 'HIKE') return '郊遊遠足';
        if (t === 'OTHER') return profile.exerciseTypesOther ? `其他(${profile.exerciseTypesOther})` : '其他運動';
        return t;
    });

    const exerciseSummary = [
        profile.exerciseWeekly === 'MET_150'
            ? `每週運動達標 (≥150分鐘/週${profile.exerciseDaysPerWeek ? `，約每週${profile.exerciseDaysPerWeek}日，每次${profile.exerciseMinutesPerSession}分鐘` : ''})`
            : profile.exerciseWeekly === 'UNDER_150'
            ? `每週運動不足 (<150分鐘/週${profile.exerciseDaysPerWeek ? `，約每週${profile.exerciseDaysPerWeek}日，每次${profile.exerciseMinutesPerSession}分鐘` : ''})`
            : profile.exerciseWeekly === 'NONE'
            ? '幾乎無運動習慣'
            : '未特別註明',
        profile.exerciseIntensity ? `運動強度：${EXERCISE_INTENSITY_LABEL_MAP[profile.exerciseIntensity] || profile.exerciseIntensity}` : '',
        exerciseTypesList.length > 0 ? `平時常做運動項目：${exerciseTypesList.join('、')}` : ''
    ].filter(Boolean).join('；');

    const dietParts: string[] = [];
    if (profile.dietHabits && profile.dietHabits.length > 0) {
        const readableDietHabits = profile.dietHabits.map(id => DIET_HABIT_LABEL_MAP[id] || id);
        dietParts.push(`日常飲食習慣：${readableDietHabits.join('、')}${profile.dietHabitsOther ? ` (其他備註: ${profile.dietHabitsOther})` : ''}`);
    }
    if (profile.favoriteFoods && profile.favoriteFoods.trim()) {
        dietParts.push(`【⭐ 患者平時最喜愛的食物 / 偏好】：${profile.favoriteFoods.trim()}`);
    }
    const dietSummary = dietParts.length > 0 ? dietParts.join('；\n  ') : '常規飲食（未特別填寫偏好食物）';

    const physicalMetrics = [
        profile.height ? `身高: ${profile.height} cm` : '',
        profile.weight ? `體重: ${profile.weight} ${profile.weightUnit || 'kg'}` : '',
        profile.bmi ? `BMI: ${profile.bmi}` : ''
    ].filter(Boolean).join('，');

    const profileConstraints = buildProfileConstraints(profile);
    const constraintsBlock = profileConstraints.length > 0
        ? `\n- 【❗個人檔案觸發之臨床與生活約束（回覆飲食與運動時必須嚴格遵守）】:\n  ${profileConstraints.join('\n  ')}`
        : '';

    return `- 患者稱呼/姓名: 「${profile.name || '用戶'}」（【極重要】：你在對話、回覆、建議中稱呼或提及病人時，必須且只能使用這個稱呼，例如「${profile.name || '用戶'}」，絕對不要使用其他虛構名字）
- 基本資料: 年齡 ${profile.age || '未填寫'} 歲，性別 ${profile.gender || '未填寫'}，糖尿病病齡 ${profile.yearsWithDiabetes || '未填寫'} 年
- 體格與檢驗指標: ${physicalMetrics || '未特別記錄'}
- 糖尿病類型與用藥背景: 診斷 ${profile.diabetesType || '2型糖尿病'}${profile.otherDiabetesType ? ` (${profile.otherDiabetesType})` : ''}；現有藥物處方: ${profile.medications || '無特別藥物記錄'}
- 臨床風險標誌與共病: ${riskFlags.length > 0 ? riskFlags.join('；') : '無特殊風險標誌'}
- 定期覆診醫療機構: ${userClinics}
- 運動習慣: ${exerciseSummary}
- 飲食習慣與喜愛食物:
  ${dietSummary}
- 識字與溝通偏好: ${profile.literacyLevel || '一般'} (如為低識字，請使用更簡短、生活化、口語化且親切的語言)${constraintsBlock}`;
}

