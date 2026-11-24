export const COMMON_CONDITIONS = [
    {id: 'HT', label: '高血壓'},
    {id: 'DM', label: '糖尿病'},
    {id: 'CH', label: '高膽固醇'},
    {id: 'CT', label: '白內障'},
    {id: 'HD', label: '心臟病'},
    {id: 'ST', label: '中風'},
];

export const OTHER_CONDITIONS = [
    {id: 'CA', label: '癌症'},
    {id: 'RD', label: '呼吸系統疾病'},
    {id: 'OA', label: '退化性關節炎'},
    {id: 'TD', label: '甲狀腺疾病'},
    {id: 'GD', label: '腸胃疾病'},
    {id: 'LD', label: '肝病'},
    {id: 'OT', label: '其他'},
];

export const conditionsList = [
    ...COMMON_CONDITIONS,
    ...OTHER_CONDITIONS
];

export interface HkDiabetesMedication {
    name: string;
    label: string;
    class: string;
    classZh: string;
}

export const HK_HA_MEDICATION_GROUPS = [
    {
        category: 'Biguanides (雙胍類)',
        meds: [
            { name: 'Metformin (Glucophage)', label: 'Metformin / Glucophage (美福明 / 雙胍)', class: 'Biguanides', classZh: '雙胍類' },
            { name: 'Metformin XR (Glucophage XR)', label: 'Metformin XR / Glucophage XR (美福明緩釋片)', class: 'Biguanides', classZh: '雙胍類' },
        ]
    },
    {
        category: 'Sulfonylureas (磺酰脲類促泌劑)',
        meds: [
            { name: 'Gliclazide (Diamicron)', label: 'Gliclazide / Diamicron (格列齊特 / 達美康)', class: 'Sulfonylureas', classZh: '磺酰脲類' },
            { name: 'Gliclazide MR (Diamicron MR)', label: 'Gliclazide MR / Diamicron MR (達美康緩釋片)', class: 'Sulfonylureas', classZh: '磺酰脲類' },
            { name: 'Glipizide (Minidiab)', label: 'Glipizide / Minidiab (格列吡嗪)', class: 'Sulfonylureas', classZh: '磺酰脲類' },
            { name: 'Glimepiride (Amaryl)', label: 'Glimepiride / Amaryl (格列美脲)', class: 'Sulfonylureas', classZh: '磺酰脲類' },
        ]
    },
    {
        category: 'DPP-4 Inhibitors (DPP-4 抑制劑)',
        meds: [
            { name: 'Sitagliptin (Januvia)', label: 'Sitagliptin / Januvia (西格列汀 / 捷諾維)', class: 'DPP-4 Inhibitors', classZh: 'DPP-4 抑制劑' },
            { name: 'Linagliptin (Trajenta)', label: 'Linagliptin / Trajenta (利格列汀 / 糖適平)', class: 'DPP-4 Inhibitors', classZh: 'DPP-4 抑制劑' },
            { name: 'Vildagliptin (Galvus)', label: 'Vildagliptin / Galvus (維格列汀 / 佳維樂)', class: 'DPP-4 Inhibitors', classZh: 'DPP-4 抑制劑' },
            { name: 'Alogliptin (Nesina)', label: 'Alogliptin / Nesina (阿格列汀)', class: 'DPP-4 Inhibitors', classZh: 'DPP-4 抑制劑' },
            { name: 'Saxagliptin (Onglyza)', label: 'Saxagliptin / Onglyza (沙格列汀)', class: 'DPP-4 Inhibitors', classZh: 'DPP-4 抑制劑' },
        ]
    },
    {
        category: 'SGLT-2 Inhibitors (SGLT-2 抑制劑 / 排糖藥)',
        meds: [
            { name: 'Empagliflozin (Jardiance)', label: 'Empagliflozin / Jardiance (恩格列淨 / 恩排糖)', class: 'SGLT-2 Inhibitors', classZh: 'SGLT-2 抑制劑' },
            { name: 'Dapagliflozin (Forxiga)', label: 'Dapagliflozin / Forxiga (達格列淨 / 安達糖)', class: 'SGLT-2 Inhibitors', classZh: 'SGLT-2 抑制劑' },
            { name: 'Canagliflozin (Invokana)', label: 'Canagliflozin / Invokana (卡格列淨)', class: 'SGLT-2 Inhibitors', classZh: 'SGLT-2 抑制劑' },
        ]
    },
    {
        category: 'GLP-1 Receptor Agonists (GLP-1 激動劑)',
        meds: [
            { name: 'Semaglutide (Ozempic / Rybelsus)', label: 'Semaglutide / Ozempic / Rybelsus (司美格魯肽)', class: 'GLP-1 RA', classZh: 'GLP-1 激動劑' },
            { name: 'Dulaglutide (Trulicity)', label: 'Dulaglutide / Trulicity (度拉糖肽)', class: 'GLP-1 RA', classZh: 'GLP-1 激動劑' },
            { name: 'Liraglutide (Victoza)', label: 'Liraglutide / Victoza (利拉魯肽 / 諾和力)', class: 'GLP-1 RA', classZh: 'GLP-1 激動劑' },
            { name: 'Tirzepatide (Mounjaro)', label: 'Tirzepatide / Mounjaro (替爾泊肽 GIP/GLP-1)', class: 'GLP-1 RA', classZh: 'GLP-1 激動劑' },
        ]
    },
    {
        category: 'Oral Combination Drugs (HA 常用口服複方)',
        meds: [
            { name: 'Janumet (Metformin + Sitagliptin)', label: 'Janumet (Metformin + Sitagliptin 捷諾達)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Janumet XR (Metformin XR + Sitagliptin)', label: 'Janumet XR (Metformin XR + Sitagliptin)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Galvus Met (Metformin + Vildagliptin)', label: 'Galvus Met (Metformin + Vildagliptin 宜妥達)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Trajenta Duo (Metformin + Linagliptin)', label: 'Trajenta Duo (Metformin + Linagliptin 歐唐寧)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Synjardy (Metformin + Empagliflozin)', label: 'Synjardy (Metformin + Empagliflozin 恩排糖複方)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Xigduo XR (Metformin XR + Dapagliflozin)', label: 'Xigduo XR (Metformin XR + Dapagliflozin 安達糖複方)', class: 'Combinations', classZh: '口服複方' },
            { name: 'Glyxambi (Empagliflozin + Linagliptin)', label: 'Glyxambi (Empagliflozin + Linagliptin)', class: 'Combinations', classZh: '口服複方' },
        ]
    },
    {
        category: 'Thiazolidinediones & Others (增敏劑及其他口服藥)',
        meds: [
            { name: 'Pioglitazone (Actos)', label: 'Pioglitazone / Actos (吡格列酮)', class: 'TZDs', classZh: '胰島素增敏劑' },
            { name: 'Acarbose (Glucobay)', label: 'Acarbose / Glucobay (阿卡波糖 / 拜糖平)', class: 'Alpha-glucosidase', classZh: '葡萄糖苷酶抑制劑' },
        ]
    },
    {
        category: 'Insulins (香港 HA 常用胰島素針劑)',
        meds: [
            { name: 'Insulin Glargine (Lantus / Toujeo)', label: 'Insulin Glargine (Lantus / Toujeo 長效基礎)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin Degludec (Tresiba)', label: 'Insulin Degludec (Tresiba 超長效基礎)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin Detemir (Levemir)', label: 'Insulin Detemir (Levemir 長效基礎)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin NPH / Isophane (Humulin N / Insulatard)', label: 'Insulin NPH / Isophane (Humulin N / Insulatard 中效)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin Aspart (NovoRapid)', label: 'Insulin Aspart (NovoRapid 諾和速效)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin Lispro (Humalog)', label: 'Insulin Lispro (Humalog 優泌樂速效)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Insulin Glulisine (Apidra)', label: 'Insulin Glulisine (Apidra 艾倍得速效)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Regular Human Insulin (Actrapid / Humulin R)', label: 'Regular Insulin (Actrapid / Humulin R 短效常規)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Biphasic Insulin Aspart 30 (NovoMix 30)', label: 'NovoMix 30 (雙相門冬胰島素 30)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Biphasic Insulin Lispro (Humalog Mix 25/50)', label: 'Humalog Mix 25/50 (優泌樂預混型)', class: 'Insulins', classZh: '胰島素' },
            { name: 'Biphasic Isophane Insulin (Mixtard 30)', label: 'Mixtard 30 (雙相等糖胰島素 30)', class: 'Insulins', classZh: '胰島素' },
        ]
    }
];

export const HK_DIABETES_MEDICATIONS = HK_HA_MEDICATION_GROUPS.flatMap(g => g.meds);

export interface BmiEvaluation {
    bmi: number;
    category: string;
    isElderly: boolean;
    colorClass: string;
    badgeBg: string;
    description: string;
    guidelineNote: string;
}

/**
 * 依年齡與糖尿病長者指引 (ADA Older Adults / 香港基層醫療長者指南 / 華人老年糖尿病共識) 評估 BMI
 * - 65 歲以上長者糖友：理想範圍放寬至 20.0 - 26.9 kg/m²（微胖保護區間，預防肌少症與跌倒風險，避免過瘦）
 * - 65 歲以下一般成人：採用香港衛生署/WHO 華人標準（18.5 - 22.9 適中，23.0 - 24.9 過重，≥25.0 肥胖）
 */
export function getBmiEvaluation(bmi: string | number, ageVal?: string | number): BmiEvaluation | null {
    const bmiNum = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    if (isNaN(bmiNum) || bmiNum <= 0) return null;

    const ageNum = typeof ageVal === 'string' ? parseInt(ageVal, 10) : (typeof ageVal === 'number' ? ageVal : NaN);
    const isElderly = !isNaN(ageNum) && ageNum >= 65;

    if (isElderly) {
        // 長者糖友指引 (Diabetic Elderly Guidelines)
        if (bmiNum < 20.0) {
            return {
                bmi: bmiNum,
                category: '偏輕消瘦 (< 20.0)',
                isElderly: true,
                colorClass: 'text-sky-600',
                badgeBg: 'bg-sky-50 text-sky-700 border border-sky-200',
                description: '長者體重偏輕可能伴隨肌少症或營養不良風險，應避免刻意節食減重，宜補充足夠蛋白質與熱量。',
                guidelineNote: '長者糖友指引：建議維持足夠體重儲備，預防肌少症與衰弱。'
            };
        } else if (bmiNum <= 26.9) {
            return {
                bmi: bmiNum,
                category: '長者黃金理想 (20.0 - 26.9)',
                isElderly: true,
                colorClass: 'text-emerald-600',
                badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                description: '符合長者糖友最佳保護區間！適度微胖有助於抵禦疾病消耗、維持肌力與抵抗力。',
                guidelineNote: '長者糖友指引：長者適度微胖存活率與抗病力最佳（微胖是福）。'
            };
        } else if (bmiNum <= 29.9) {
            return {
                bmi: bmiNum,
                category: '長者微重 (27.0 - 29.9)',
                isElderly: true,
                colorClass: 'text-amber-600',
                badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
                description: '體重稍高，建議以規律散步、維持肌力為主，不建議長者進行過度嚴苛節食。',
                guidelineNote: '長者糖友指引：重在「維持肌肉量與日常活力」，不宜盲目追求減重。'
            };
        } else {
            return {
                bmi: bmiNum,
                category: '長者顯著肥胖 (≥ 30.0)',
                isElderly: true,
                colorClass: 'text-rose-600',
                badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
                description: '可能增加膝關節負擔及心血管負荷，建議在醫生及營養師指導下進行溫和調整。',
                guidelineNote: '建議諮詢醫護人員進行溫和、不流失肌肉的安全體重管理。'
            };
        }
    } else {
        // 一般成人 (香港衛生署華人標準)
        if (bmiNum < 18.5) {
            return {
                bmi: bmiNum,
                category: '體重過輕 (< 18.5)',
                isElderly: false,
                colorClass: 'text-sky-600',
                badgeBg: 'bg-sky-50 text-sky-700 border border-sky-200',
                description: '體重過輕，建議注意均衡營養與熱量攝取。',
                guidelineNote: '香港衛生署華人成人標準'
            };
        } else if (bmiNum <= 22.9) {
            return {
                bmi: bmiNum,
                category: '適中理想 (18.5 - 22.9)',
                isElderly: false,
                colorClass: 'text-emerald-600',
                badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                description: '身材指標非常理想，請繼續保持！',
                guidelineNote: '香港衛生署華人成人理想標準'
            };
        } else if (bmiNum <= 24.9) {
            return {
                bmi: bmiNum,
                category: '過重偏高 (23.0 - 24.9)',
                isElderly: false,
                colorClass: 'text-amber-600',
                badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
                description: '略高於華人成人理想上限，建議適度控制糖分及增加運動量。',
                guidelineNote: '香港衛生署華人成人超重標準'
            };
        } else {
            return {
                bmi: bmiNum,
                category: '肥胖指標 (≥ 25.0)',
                isElderly: false,
                colorClass: 'text-rose-600',
                badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
                description: '肥胖會增加胰島素阻抗，建議逐步調整飲食與運動改善體態。',
                guidelineNote: '香港衛生署華人成人肥胖標準'
            };
        }
    }
}
