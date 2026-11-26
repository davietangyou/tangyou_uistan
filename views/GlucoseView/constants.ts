export const PREDEFINED_SYMPTOMS = [
    '頭暈', '冒冷汗', '心悸手震', '極度飢餓', 
    '口乾口渴', '頻尿', '極度疲倦', '視力模糊', 
    '噁心不適', '手腳發麻'
];

export const SYMPTOM_CLINICAL_CATEGORIES: Record<string, {
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

export const TIME_DETAILS: Record<string, { icon: string; label: string; desc: string }> = {
    '空腹': { icon: '🌅', label: '起床空腹', desc: '吃早餐前 / 空腹至少8小時' },
    '餐前': { icon: '🍽️', label: '飯前準備', desc: '午餐或晚餐開餐前測量' },
    '餐後2小時': { icon: '⏰', label: '飯後2小時', desc: '吃第一口飯起計滿2小時' },
    '睡前': { icon: '🌙', label: '臨睡之前', desc: '晚上睡覺前測量數值' },
    '日常其他時間': { icon: '🧪', label: '日常其他時間', desc: '任意時間或感覺不舒服時' }
};

export const PERIOD_OPTIONS = [
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

export const SYMPTOM_DETAILS: Record<string, { icon: string; name: string; desc: string }> = {
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
