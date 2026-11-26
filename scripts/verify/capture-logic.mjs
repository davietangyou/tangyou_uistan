/**
 * Pure-logic / contract snapshotter.
 * Does not call Gemini. Imports server helpers with fixed fixtures so
 * prompt assembly, safety gate, taxonomy, and HTTP route shapes can be
 * compared before vs after a refactor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stableStringify } from './lib/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseSourceContracts() {
    const routeRe = /app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;
    const routes = [];
    const harvestRoutes = (src) => {
        let match;
        const re = new RegExp(routeRe.source, 'g');
        while ((match = re.exec(src))) {
            routes.push({ method: match[1].toUpperCase(), path: match[2] });
        }
    };
    harvestRoutes(fs.readFileSync(path.join(repoRoot, 'server.ts'), 'utf8'));
    const walkRoutes = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walkRoutes(full);
            else if (/\.(ts|js)$/.test(entry.name)) {
                harvestRoutes(fs.readFileSync(full, 'utf8'));
            }
        }
    };
    walkRoutes(path.join(repoRoot, 'server'));

    function returnKeysFrom(filePath) {
        const src = fs.readFileSync(filePath, 'utf8');
        const returnIdx = src.lastIndexOf('return {');
        const returnBlock = returnIdx >= 0 ? src.slice(returnIdx, src.indexOf('};', returnIdx) + 2) : '';
        const keys = new Set();
        for (const m of returnBlock.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*,/g)) {
            if (m[1] === 'return') continue;
            keys.add(m[1]);
        }
        const closing = returnBlock.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\n\s*\}/);
        if (closing) keys.add(closing[1]);
        const spreads = [...returnBlock.matchAll(/\.\.\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]);
        return { keys: [...keys].sort(), spreads, returnBlock };
    }
    const appLogic = returnKeysFrom(path.join(repoRoot, 'hooks/useAppLogic.ts'));
    const speech = returnKeysFrom(path.join(repoRoot, 'hooks/useSpeechFocus.ts'));
    const allHookKeys = new Set(appLogic.keys);
    if (appLogic.spreads.includes('speechLogic')) {
        for (const k of speech.keys) allHookKeys.add(k);
    }
    const hookMeta = {
        useAppLogicOwnKeys: appLogic.keys,
        useAppLogicSpreads: appLogic.spreads,
        useSpeechFocusKeys: speech.keys,
    };

    const typesSrc = fs.readFileSync(path.join(repoRoot, 'utils/types.ts'), 'utf8');
    const viewValues = [...typesSrc.matchAll(/^\s+[A-Za-z]+ = '([^']+)'/gm)].map((m) => m[1]);

    const storageKeys = new Set();
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'verify-results') continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
                const src = fs.readFileSync(full, 'utf8');
                for (const m of src.matchAll(/localStorage\.(?:get|set|remove)Item\(\s*['"]([^'"]+)['"]/g)) {
                    storageKeys.add(m[1]);
                }
                // Also harvest canonical key literals (STORAGE_KEYS.profile = 'dia_profile', etc.)
                // so a centralized accessor does not drop keys from the contract snapshot.
                for (const m of src.matchAll(/['"](dia_[a-z0-9_]+)['"]/g)) {
                    storageKeys.add(m[1]);
                }
            }
        }
    };
    walk(repoRoot);

    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

    return {
        httpRoutes: routes,
        useAppLogicReturnKeys: [...allHookKeys].sort(),
        hookMeta,
        viewEnumValues: viewValues,
        localStorageKeys: [...storageKeys].sort(),
        npmScripts: pkg.scripts,
    };
}

function fixtureProfile() {
    return {
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
        savedDoctorQuestions: ['我想問醫生可否減藥？'],
    };
}

function fixtureRecords(nowMs) {
    const day = 24 * 60 * 60 * 1000;
    const glucoseRecords = [
        {
            id: 'g1',
            timeType: '空腹',
            value: '7.2',
            date: 'FIXED/EMPTY 07:30',
            timestamp: nowMs - 1 * day,
            symptoms: [],
            mealTag: '早餐',
            dietNote: '一碗白粥',
            exerciseNote: '',
            illnessNote: '',
            medicationNote: '已服早餐藥',
        },
        {
            id: 'g2',
            timeType: '餐後2小時',
            value: '9.8',
            date: 'FIXED/EMPTY 14:00',
            timestamp: nowMs - 2 * day,
            symptoms: ['口乾口渴'],
            mealTag: '午餐',
            dietNote: '叉燒飯',
            exerciseNote: '散步 20 分鐘',
            illnessNote: '',
            medicationNote: '',
        },
        {
            id: 'g3',
            timeType: '睡前',
            value: '6.4',
            date: 'FIXED/EMPTY 22:00',
            timestamp: nowMs - 4 * day,
            symptoms: [],
            mealTag: undefined,
            dietNote: '',
            exerciseNote: '',
            illnessNote: '',
            medicationNote: '',
        },
        {
            id: 'g-low',
            timeType: '日常其他時間',
            value: '3.4',
            date: 'FIXED/EMPTY 16:00',
            timestamp: nowMs - 10 * day,
            symptoms: ['手震', '冒冷汗'],
            mealTag: undefined,
            dietNote: '',
            exerciseNote: '',
            illnessNote: '',
            medicationNote: '',
        },
    ];
    const hba1cRecords = [
        { id: 'h1', value: '7.1', date: '2026-08-01', timestamp: Date.parse('2026-08-01T00:00:00+08:00') },
        { id: 'h2', value: '6.8', date: '2026-11-01', timestamp: Date.parse('2026-11-01T00:00:00+08:00') },
    ];
    return { glucoseRecords, hba1cRecords };
}

async function captureLogic() {
    const [
        gemini,
        taxonomy,
    ] = await Promise.all([
        import(path.join(repoRoot, 'server/gemini.ts')),
        import(path.join(repoRoot, 'server/taxonomy.ts')),
    ]);

    const FIXED_NOW = Date.parse('2026-11-25T12:00:00-08:00');
    const profile = fixtureProfile();
    const { glucoseRecords, hba1cRecords } = fixtureRecords(FIXED_NOW);

    const safetyCases = {
        none: taxonomy.checkSafetyGate('今日餐後血糖高了一點，想問問飲食點樣調整。', profile),
        hypo: taxonomy.checkSafetyGate('我而家手震冒冷汗，血糖 3.2，好唔舒服。', profile),
        dka: taxonomy.checkSafetyGate('最近口渴頻尿，血糖好高，仲有嘔吐，會唔會係酮症酸中毒？', profile),
        mental: taxonomy.checkSafetyGate('我真係唔想做人，覺得絕望。', profile),
        foot: taxonomy.checkSafetyGate('腳趾有個傷口紅腫流膿，痛了幾日。', profile),
        educationalHypo: taxonomy.checkSafetyGate('如果將來遇到低血糖，應該點樣處理？想預先學吓。', profile),
    };

    const scenarioCases = {
        diet: taxonomy.classifyScenario('叉燒飯同奶茶可唔可以食？'),
        meds: taxonomy.classifyScenario('美福明同達美康一齊食會唔會有問題？'),
        insulin: taxonomy.classifyScenario('醫生話要開始打針，我好怕，想比較一下選擇。'),
        general: taxonomy.classifyScenario('今日天氣不錯。'),
    };

    const clarificationCases = {};
    for (const [name, scenarios] of Object.entries(scenarioCases)) {
        clarificationCases[name] = scenarios.map((s) => ({
            scenario: s,
            needed: taxonomy.needsValueClarification(s, name === 'insulin' ? '醫生話要開始打針，我好怕，想比較一下選擇。' : '隨便問問'),
        }));
    }

    const history = gemini.trimConversationHistory([
        { role: 'user', content: '我想問醫生要不要開始打針。' },
        { role: 'assistant', content: '我明白你擔心打針。可以先講講你最在意嘅係邊方面。' },
        { role: 'user', content: '我最怕痛，亦擔心自己一個人打針唔方便。' },
        { role: 'assistant', content: '謝謝你分享呢啲顧慮。' },
    ]);

    const knowledgeText = '飯前血糖目標 4.4–7.2 mmol/L。低血糖定義：< 3.9 mmol/L。';

    const promptCases = {};
    const promptInputs = [
        { name: 'everyday_diet', message: '午餐食咗叉燒飯，血糖會唔會太高？', hasImage: false, isDecisionSensitive: false, isComparisonRequest: false, isPreferenceResponse: false, hasPreferenceInHistory: false, scenarios: scenarioCases.diet, safety: safetyCases.none },
        { name: 'decision_insulin', message: '醫生話要開始打針，我好怕，想比較一下選擇。', hasImage: false, isDecisionSensitive: true, isComparisonRequest: false, isPreferenceResponse: false, hasPreferenceInHistory: false, scenarios: scenarioCases.insulin, safety: safetyCases.none },
        { name: 'decision_with_preference', message: '我最怕痛，亦擔心自己一個人打針唔方便。', hasImage: false, isDecisionSensitive: true, isComparisonRequest: false, isPreferenceResponse: true, hasPreferenceInHistory: false, scenarios: scenarioCases.insulin, safety: safetyCases.none },
        { name: 'comparison', message: '可不可以比較一下美福明同達美康的分別？', hasImage: false, isDecisionSensitive: false, isComparisonRequest: true, isPreferenceResponse: false, hasPreferenceInHistory: false, scenarios: scenarioCases.meds, safety: safetyCases.none },
        { name: 'image_attached', message: '相裏面係我今晚嘅晚餐，幫我睇下可唔可以食。', hasImage: true, isDecisionSensitive: false, isComparisonRequest: false, isPreferenceResponse: false, hasPreferenceInHistory: false, scenarios: scenarioCases.diet, safety: safetyCases.none },
        { name: 'educational_hypo', message: '如果將來遇到低血糖，應該點樣處理？想預先學吓。', hasImage: false, isDecisionSensitive: false, isComparisonRequest: false, isPreferenceResponse: false, hasPreferenceInHistory: false, scenarios: taxonomy.classifyScenario('如果將來遇到低血糖，應該點樣處理？想預先學吓。'), safety: safetyCases.educationalHypo },
    ];

    for (const input of promptInputs) {
        promptCases[input.name] = gemini.buildChatPrompts({
            profile,
            knowledgeText,
            hba1cRecords,
            glucoseRecords,
            message: input.message,
            trimmedHistory: history,
            safety: input.safety,
            hasImage: input.hasImage,
            isDecisionSensitive: input.isDecisionSensitive,
            isComparisonRequest: input.isComparisonRequest,
            isPreferenceResponse: input.isPreferenceResponse,
            hasPreferenceInHistory: input.hasPreferenceInHistory,
            scenarios: input.scenarios,
            nowMs: FIXED_NOW,
        });
    }

    const runtimeInfo = gemini.getGeminiRuntimeInfo();
    // Do not freeze "configured" into the golden: it depends on local secrets.
    const runtimePublic = {
        model: runtimeInfo.model,
        fastModel: runtimeInfo.fastModel,
        visionModel: runtimeInfo.visionModel,
        transcribeModel: runtimeInfo.transcribeModel,
        hasCustomBaseUrl: runtimeInfo.hasCustomBaseUrl,
    };

    return {
        capturedAtZone: 'America/Los_Angeles',
        fixedNowIso: '2026-11-25T12:00:00-08:00',
        contracts: parseSourceContracts(),
        runtimePublic,
        maxHistoryRounds: gemini.MAX_HISTORY_ROUNDS,
        profileSummary: gemini.formatUserProfileSummary(profile),
        glucoseContext: gemini.formatGlucoseContext(glucoseRecords, FIXED_NOW),
        hba1cContext: gemini.formatHbA1cContext(hba1cRecords),
        historyContext: gemini.formatHistoryContext(history),
        isExplicitComparison: {
            yes: gemini.isExplicitComparisonQuery('可不可以比較一下美福明同達美康的分別？'),
            no: gemini.isExplicitComparisonQuery('午餐食咗叉燒飯，血糖會唔會太高？'),
        },
        modelRoutes: {
            everyday: gemini.selectChatModelRoute({
                message: '午餐食咗叉燒飯，血糖會唔會太高？',
                scenarios: scenarioCases.diet,
                isPreferenceResponse: false,
                hasImage: false,
                trimmedHistory: history.turns,
            }),
            decision: gemini.selectChatModelRoute({
                message: '醫生話要開始打針，我好怕，想比較一下選擇。',
                scenarios: scenarioCases.insulin,
                isPreferenceResponse: false,
                hasImage: false,
                trimmedHistory: history.turns,
            }),
            image: gemini.selectChatModelRoute({
                message: '相裏面係我今晚嘅晚餐，幫我睇下可唔可以食。',
                scenarios: scenarioCases.diet,
                isPreferenceResponse: false,
                hasImage: true,
                trimmedHistory: history.turns,
            }),
        },
        safetyCases,
        scenarioCases,
        clarificationCases,
        promptCases,
    };
}

const outDir = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : path.join(repoRoot, 'verify-results/latest/logic');

const snapshot = await captureLogic();
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'logic.raw.json'), JSON.stringify(snapshot, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'logic.normalized.json'), stableStringify(snapshot));
console.log(`logic snapshot written to ${outDir}`);
