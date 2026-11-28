/**
 * Domain-level business snapshot (node only: no browser, no dev server, no
 * Gemini). Calls the UI-independent layer directly — domain/*, the locked AI
 * copy builders in views/ConsultView/consultText.ts and the request builders
 * in services/geminiService.ts — with an in-memory localStorage, a fixed
 * clock and a stubbed fetch, and writes domain.normalized.json (golden).
 *
 * What it pins: record builders and their stored JSON shapes (dia_* keys),
 * profile / question / chat rules, calculations (BMI, exercise level, clinic
 * date), greetings, the messages sent to /api/gemini/chat by the shortcut /
 * preference / follow-up paths, and the URL + body shape of every
 * /api/gemini/* call the client makes. Nothing here depends on the UI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stableStringifyRaw } from './lib/normalize.mjs';
import { VERIFY_NOW_MS, VERIFY_NOW_ISO } from './lib/clock.mjs';
import { SHAPE_CASES } from './fixtures/shapes/messages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

// ---- environment: in-memory localStorage, fixed clock, stubbed fetch ----
process.env.TZ = 'Asia/Hong_Kong';
class MemoryStorage {
    constructor() { this.map = new Map(); }
    get length() { return this.map.size; }
    key(i) { return [...this.map.keys()][i] ?? null; }
    getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
    setItem(k, v) { this.map.set(k, String(v)); }
    removeItem(k) { this.map.delete(k); }
    clear() { this.map.clear(); }
    dump() { return Object.fromEntries([...this.map.entries()].sort(([a], [b]) => a.localeCompare(b))); }
}
const ls = new MemoryStorage();
globalThis.localStorage = ls;
const calls = [];
globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', headers: init.headers || {}, credentials: init.credentials, body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify({ reply: 'stub', summary: 'stub', recommendedQuestions: [], medications: [], text: 'stub' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
const quiet = console.error; console.error = () => {};

const imp = (rel) => import(path.join(repoRoot, rel));
const domain = await imp('domain/index.ts');
const consultText = await imp('views/ConsultView/consultText.ts');
const gemini = await imp('services/geminiService.ts');
let options = null;
if (fs.existsSync(path.join(repoRoot, 'domain/options.ts'))) options = await imp('domain/options.ts');

const NOW = new Date(VERIFY_NOW_MS);
const failures = [];
const expect = (name, cond, info) => { if (!cond) failures.push(`${name}${info === undefined ? '' : ' ' + JSON.stringify(info)}`); };
/** Shape of a value: key -> type, recursively (ids and timestamps vary, shapes must not). */
function shapeOf(v) {
    if (Array.isArray(v)) return v.length ? [shapeOf(v[0])] : [];
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shapeOf(v[k])]));
    return v === null ? 'null' : typeof v;
}

// ---- glucose ----
const draft = { ...domain.emptyGlucoseDraft(), value: '8.1', timeType: '餐後2小時', mealTag: '早餐', dietNote: '叉燒飯', symptoms: ['口乾口渴'] };
const g = domain.buildGlucoseRecord(draft, NOW);
const glucose = {
    emptyDraft: domain.emptyGlucoseDraft(),
    built: g.ok ? { ...g.record, id: /^\d+_[a-z0-9]{1,4}$/.test(g.record.id) ? '<timestamp>_<rand4>' : g.record.id } : g,
    emptyRejected: domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft() }, NOW),
    missingTimeType: domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft(), value: '6' }, NOW),
    negativeClamped: (() => { const r = domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft(), value: '-3', timeType: '空腹' }, NOW); return r.ok ? r.record.value : r; })(),
    roundedTo1: (() => { const r = domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft(), value: '5.55', timeType: '空腹' }, NOW); return r.ok ? r.record.value : r; })(),
    symptomOnly: (() => { const r = domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft(), symptoms: ['頭暈'], timeType: '日常其他時間' }, NOW); return r.ok ? { value: r.record.value, symptoms: r.record.symptoms } : r; })(),
    customTime: (() => { const r = domain.buildGlucoseRecord({ ...domain.emptyGlucoseDraft(), value: '7', timeType: '睡前', customTimestamp: VERIFY_NOW_MS - 3600e3, customDateStr: '2026/11/26 08:30' }, NOW); return r.ok ? { timestamp: r.record.timestamp, date: r.record.date } : r; })(),
    sorted: domain.sortGlucoseRecords([{ id: 'a', timestamp: 1 }, { id: 'b', timestamp: 3 }, { id: 'c' }, { id: 'd', timestamp: 2 }]).map((r) => r.id),
};
ls.clear();
if (g.ok) domain.persistGlucoseRecords([g.record]);
const storedGlucose = ls.dump();
glucose.storedKeys = Object.keys(storedGlucose);
glucose.storedShape = shapeOf(JSON.parse(storedGlucose.dia_glucose || '[]'));
glucose.roundTrip = JSON.stringify(domain.loadGlucoseRecords()) === JSON.stringify(g.ok ? [g.record] : []);
expect('glucose round trip', glucose.roundTrip);

// ---- hba1c ----
ls.clear();
const h = domain.buildHbA1cRecord('6.85', '2026-11-20', NOW);
domain.persistHbA1cRecords([h]);
const hba1c = {
    built: h,
    rejected: domain.buildHbA1cRecord('abc', '2026-11-20', NOW),
    storedKeys: Object.keys(ls.dump()),
    roundTrip: JSON.stringify(domain.loadHbA1cRecords()) === JSON.stringify([h]),
    sorted: domain.sortHbA1cRecords([{ id: 'x', timestamp: 1 }, { id: 'y', timestamp: 5 }]).map((r) => r.id),
};
expect('hba1c round trip', hba1c.roundTrip);

// ---- profile ----
ls.clear();
const empty = domain.emptyProfile();
let p = { ...empty, name: '陳生', height: '168' };
p = domain.profileWithWeight(p, '70');
const bmiKg = p.bmi;
const pLb = domain.profileWithWeightUnit({ ...p, weight: '154' }, 'lb');
const profile = {
    empty,
    bmi: { kg: bmiKg, lb: pLb.bmi, heightChange: domain.profileWithHeight(p, '160').bmi, invalid: domain.calculateBmi('', '70') },
    conditions: {
        add: domain.toggleConditionOnProfile({ ...empty, conditions: ['NONE'] }, 'DM').conditions,
        none: domain.toggleConditionOnProfile({ ...empty, conditions: ['DM', 'HT'] }, 'NONE').conditions,
        remove: domain.toggleConditionOnProfile({ ...empty, conditions: ['DM', 'HT'] }, 'HT').conditions,
    },
    conditionDetail: {
        dmYears: (({ conditionDetails, yearsWithDiabetes }) => ({ conditionDetails, yearsWithDiabetes }))(domain.updateConditionDetail(empty, 'DM', 'years', '12')),
        htYears: domain.updateConditionDetail(empty, 'HT', 'years', '8').hypertensionYears,
        otName: domain.updateConditionDetail(empty, 'OT', 'specificName', '痛風').otherConditions,
    },
    mergeQuestions: domain.mergeSavedDoctorQuestions({ ...empty, savedDoctorQuestions: ['A', 'B'] }, ['C', 'A']).savedDoctorQuestions,
};
domain.persistProfile(p);
profile.storedKeys = Object.keys(ls.dump());
profile.roundTripName = domain.loadProfileFromStorage().name;
// legacy migration: old profile without the newer fields
ls.clear();
ls.setItem('dia_profile', JSON.stringify({ name: '舊用戶', yearsWithDiabetes: '5', clinicType: 'SOPC' }));
const migrated = domain.loadProfileFromStorage();
profile.legacyMigration = {
    diabetesType: migrated.diabetesType, savedDoctorQuestions: migrated.savedDoctorQuestions, nextClinicQuestions: migrated.nextClinicQuestions,
    conditionDetails: migrated.conditionDetails, clinicTypes: migrated.clinicTypes, isInsulinUser: migrated.isInsulinUser,
};
// owner-approved 2026-11-28: optional nextClinicTime / nextClinicLocation.
// Old data has neither and must load without them; stored values round-trip.
profile.legacyClinicExtras = { hasTime: 'nextClinicTime' in migrated, hasLocation: 'nextClinicLocation' in migrated, nextClinicDate: migrated.nextClinicDate };
ls.clear();
ls.setItem('dia_profile', JSON.stringify({ name: '新用戶', nextClinicDate: '2026-12-03', nextClinicTime: '09:30', nextClinicLocation: '葵涌普通科門診' }));
profile.clinicExtrasRoundTrip = (({ nextClinicDate, nextClinicTime, nextClinicLocation }) => ({ nextClinicDate, nextClinicTime, nextClinicLocation }))(domain.loadProfileFromStorage());
ls.clear();
profile.noStoredProfile = JSON.stringify(domain.loadProfileFromStorage()) === JSON.stringify(empty);
profile.exercise = {
    none: domain.calculateExerciseFromHabits('0', '30', 'MODERATE'),
    under: domain.calculateExerciseFromHabits('3-4', '30', 'MODERATE'),
    met: domain.calculateExerciseFromHabits('5+', '30', 'MODERATE'),
    lightLong: domain.calculateExerciseFromHabits('5+', '60+', 'LIGHT'),
};

// ---- questions ----
const qp = { ...empty, savedDoctorQuestions: ['舊問題', '要減藥嗎？'], nextClinicQuestions: ['要減藥嗎？'] };
const questions = {
    add: domain.addSavedDoctorQuestion(qp, '  新問題  ')?.savedDoctorQuestions,
    addEmpty: domain.addSavedDoctorQuestion(qp, '   '),
    deleteAlsoFromNext: (({ savedDoctorQuestions, nextClinicQuestions }) => ({ savedDoctorQuestions, nextClinicQuestions }))(domain.deleteSavedDoctorQuestion(qp, 1)),
    editSyncsNext: (({ savedDoctorQuestions, nextClinicQuestions }) => ({ savedDoctorQuestions, nextClinicQuestions }))(domain.editSavedDoctorQuestion(qp, 1, '要減藥嗎？（補充）')),
    editEmpty: domain.editSavedDoctorQuestion(qp, 1, ' '),
    toggleNextOff: domain.toggleNextClinicQuestionOnProfile(qp, '要減藥嗎？').nextClinicQuestions,
    toggleNextOn: domain.toggleNextClinicQuestionOnProfile(qp, '舊問題').nextClinicQuestions,
    addNextAlsoSaves: (({ savedDoctorQuestions, nextClinicQuestions }) => ({ savedDoctorQuestions, nextClinicQuestions }))(domain.addNextClinicQuestion(qp, '新覆診問題')),
    nextClinicDate: domain.saveNextClinicDate(qp, '2026-12-03').nextClinicDate,
    clinicDetails: {
        full: (({ nextClinicDate, nextClinicTime, nextClinicLocation }) => ({ nextClinicDate, nextClinicTime, nextClinicLocation }))(domain.saveNextClinicDetails(qp, { date: '2026-12-03', time: '09:30', location: '  葵涌普通科門診  ' })),
        dateOnlyEqualsLegacy: JSON.stringify(domain.saveNextClinicDetails(qp, { date: '2026-12-03' })) === JSON.stringify(domain.saveNextClinicDate(qp, '2026-12-03')),
        clearedKeys: Object.keys(domain.saveNextClinicDetails({ ...qp, nextClinicTime: '09:30', nextClinicLocation: '診所' }, { date: '2026-12-03', time: '', location: '   ' })).filter((k) => k.startsWith('nextClinic')).sort(),
        invalidTime: domain.saveNextClinicDetails(qp, { date: '2026-12-03', time: '25:00' }).nextClinicTime ?? null,
        legacySaveKeepsExtras: (({ nextClinicDate, nextClinicTime, nextClinicLocation }) => ({ nextClinicDate, nextClinicTime, nextClinicLocation }))(domain.saveNextClinicDate({ ...qp, nextClinicTime: '09:30', nextClinicLocation: '診所' }, '2026-12-04')),
    },
    clinicReminder: {
        today: domain.clinicDateReminder('2026-11-26', NOW),
        future: domain.clinicDateReminder('2026-12-03', NOW),
        past: domain.clinicDateReminder('2026-11-20', NOW),
        none: domain.clinicDateReminder('', NOW),
    },
};

// ---- chat persistence ----
ls.clear();
const chatIn = [
    { id: 'welcome', role: 'assistant', content: '歡迎', isWelcome: true },
    { id: 'u1', role: 'user', content: '有圖', imageAttachment: { mimeType: 'image/jpeg', base64: 'AAAA', previewUrl: 'blob:x', name: 'a.jpg' } },
];
domain.persistChatMessages(chatIn);
const storedChat = JSON.parse(ls.getItem('dia_chat_messages'));
const chat = {
    storedKeys: Object.keys(ls.dump()),
    imageStripped: storedChat[1].imageAttachment,
    loaded: domain.loadChatMessages([]).length,
    fallbackWhenEmpty: (ls.setItem('dia_chat_messages', '[]'), domain.loadChatMessages(['FALLBACK'])),
    fallbackWhenBroken: (ls.setItem('dia_chat_messages', '{bad'), domain.loadChatMessages(['FALLBACK'])),
    cleared: (domain.clearChatMessages(), ls.getItem('dia_chat_messages')),
    defaultMessages: consultText.createDefaultChatMessages(),
};

// ---- font ----
ls.clear();
const font = { defaultOn: domain.loadLargeFontPreference() };
domain.persistLargeFontPreference(false);
font.storedOff = ls.getItem('dia_large_font');
font.loadedOff = domain.loadLargeFontPreference();

// ---- greeting (frozen clock 09:30 HK) ----
const greeting = {
    atVerifyNow: domain.personalGreeting('陳生', NOW.getHours()),
    fallbackName: domain.personalGreeting('', 14),
    byHour: Object.fromEntries([3, 5, 11, 12, 17, 18, 23].map((hr) => [hr, domain.timeOfDayGreeting(hr)])),
};

// ---- messages sent to /api/gemini/chat (locked AI copy) ----
const pref = SHAPE_CASES.find((c) => c.id === 'preference').messages.find((m) => m.preferenceQuestions).preferenceQuestions[0];
const opt = pref.options[0];
const prefMessage = consultText.buildPreferenceSubmitMessage([pref], { [pref.id]: { [opt.valueCategory]: { questionText: pref.questionText, label: opt.label, valueCategory: opt.valueCategory } } }, {}, {});
const prefOther = consultText.buildPreferenceSubmitMessage([pref], {}, { [pref.id]: true }, { [pref.id]: ' 想每日少打一針 ' });
const followUp = consultText.followUpMessage('【夾具】可見追問-decision');
const chatMessagesSent = {
    shortcuts: consultText.SHORTCUT_QUESTIONS.map((q) => ({ label: q.label, text: q.text })),
    preference_submit: prefMessage,
    preference_other: prefOther,
    preference_nothing: consultText.buildPreferenceSubmitMessage([pref], {}, {}, {}),
    preference_count: consultText.countPreferenceAnswers([pref], { [pref.id]: { a: {}, b: {} } }, { [pref.id]: true }, { [pref.id]: 'x' }),
    follow_up: followUp,
    preferenceMarker: consultText.PREFERENCE_SUBMITTED_MARKER,
    imageOnlyDefault: consultText.IMAGE_ONLY_DEFAULT_MESSAGE,
    errorReply: consultText.CHAT_ERROR_REPLY,
    errorReplyPrefix: consultText.CHAT_ERROR_REPLY_PREFIX,
};
// Cross-check with the browser-captured request golden (same three messages).
const reqGoldenPath = path.join(repoRoot, 'scripts/verify/fixtures/golden/requests.normalized.json');
if (fs.existsSync(reqGoldenPath)) {
    const req = JSON.parse(fs.readFileSync(reqGoldenPath, 'utf8'));
    expect('requests golden: preference_submit = node-built message', req.preference_submit?.message === prefMessage);
    expect('requests golden: follow_up = node-built message', req.follow_up?.message === followUp);
    expect('requests golden: shortcut_data_reading = SHORTCUT_QUESTIONS[0].text', req.shortcut_data_reading?.message === consultText.SHORTCUT_QUESTIONS[0].text);
}

// ---- client -> server request contract (/api/gemini/*) ----
calls.length = 0;
await gemini.getConversationalChatResponse({ name: '陳生' }, [{ id: 'g' }], '你好', [{ role: 'user', content: 'a' }], { data: 'B64', mimeType: 'image/png' }, [{ id: 'h' }], true);
await gemini.getConversationalChatResponse({ name: '陳生' }, [], '你好');
await gemini.analyzeSavedQuestions(['Q1']);
await gemini.transcribeAudio('B64', 'audio/webm');
await gemini.generateDailyTipFromHKWebsites();
await gemini.recognizeMedicationsFromImage('B64');
const requestContract = calls.map((c) => ({ url: c.url, method: c.method, credentials: c.credentials, headers: c.headers, bodyShape: shapeOf(c.body), body: c.body }));

console.error = quiet;
const snapshot = {
    clock: VERIFY_NOW_ISO,
    glucose, hba1c, profile, questions, chat, font, greeting,
    chatMessagesSent,
    requestContract,
    ...(options ? { optionsModule: Object.keys(options).sort() } : {}),
};
const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : path.join(repoRoot, 'verify-results/latest/domain');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'domain.normalized.json'), stableStringifyRaw(snapshot));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ ok: failures.length === 0, failures }, null, 2) + '\n');
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
console.log(`domain snapshot written to ${outDir}`);
