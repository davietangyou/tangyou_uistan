/**
 * Headless Chrome DOM snapshotter against the local dev server.
 * Seeds localStorage, visits each reachable view, and writes normalized
 * #root HTML. Does not call Gemini. Requires the dev server to be up.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { launchChrome, attachToBlankPage, evaluate } from './lib/cdp.mjs';
import { normalizeDom } from './lib/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';

function buildSeed() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const fmt = (ts) => {
        const d = new Date(ts);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

async function waitForRoot(cdp, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ready = await evaluate(cdp, `Boolean(document.querySelector('#root') && document.querySelector('#root').innerHTML.length > 80)`);
        if (ready) return;
        await delay(150);
    }
    throw new Error('Timed out waiting for #root to render');
}

async function settle(cdp) {
    await waitForRoot(cdp);
    await evaluate(cdp, `document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true`);
    await delay(500);
}

async function navigate(cdp, url) {
    await cdp.send('Page.navigate', { url });
    await settle(cdp);
}

async function writeStorageAndReload(cdp, seedOrClear) {
    if (seedOrClear === 'clear') {
        await evaluate(cdp, 'localStorage.clear(); true');
    } else {
        await evaluate(cdp, `(() => {
            localStorage.clear();
            const seed = ${JSON.stringify(seedOrClear)};
            for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
            return Object.keys(localStorage);
        })()`);
    }
    await cdp.send('Page.reload', { ignoreCache: true });
    await settle(cdp);
}

async function activate(cdp, { text, id, withinNav = false, expectText } = {}) {
    const result = await evaluate(cdp, `(() => {
        const needle = ${JSON.stringify(text || '')};
        const id = ${JSON.stringify(id || '')};
        const expected = ${JSON.stringify(expectText || '')};
        const scope = ${withinNav ? "document.querySelector('nav') || document" : 'document'};
        const btn = id
            ? document.getElementById(id)
            : [...scope.querySelectorAll('button, [role="button"]')].find((el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').includes(needle));
        if (!btn) {
            return Promise.resolve({ ok: false, reason: 'not-found', visible: (document.querySelector('#root')?.innerText || '').slice(0, 180) });
        }
        const propKey = Object.keys(btn).find((k) => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
        if (propKey && typeof btn[propKey].onClick === 'function') {
            btn[propKey].onClick();
        } else {
            btn.click();
        }
        const snapshot = () => ({
            html: document.querySelector('#root') ? document.querySelector('#root').innerHTML : '',
            text: document.querySelector('#root') ? document.querySelector('#root').innerText : '',
        });
        if (!expected) return Promise.resolve({ ok: true, method: propKey ? 'react' : 'dom', ...snapshot() });
        return new Promise((resolve) => {
            const start = Date.now();
            const tick = () => {
                const snap = snapshot();
                if (snap.text.includes(expected)) {
                    resolve({ ok: true, method: propKey ? 'react' : 'dom', waited: Date.now() - start, ...snap });
                    return;
                }
                if (Date.now() - start > 8000) {
                    resolve({ ok: false, reason: 'timeout', snippet: snap.text.slice(0, 200) });
                    return;
                }
                setTimeout(tick, 100);
            };
            tick();
        });
    })()`);
    if (!result?.ok) {
        throw new Error(`Failed to activate ${id ? '#' + id : JSON.stringify(text)} expecting ${JSON.stringify(expectText || '')}: ${JSON.stringify({ ok: result?.ok, reason: result?.reason, snippet: result?.snippet, visible: result?.visible })}`);
    }
    return { html: result.html, text: result.text };
}

async function snapshotRoot(cdp) {
    const start = Date.now();
    let last = '';
    while (Date.now() - start < 8000) {
        last = await evaluate(cdp, `document.querySelector('#root') ? document.querySelector('#root').innerHTML : ''`) || '';
        if (last.length > 80) return last;
        await delay(150);
    }
    throw new Error(`#root innerHTML stayed empty/short (${last.length} chars)`);
}

async function readVisibleText(cdp) {
    const start = Date.now();
    let last = '';
    while (Date.now() - start < 8000) {
        last = await evaluate(cdp, `document.querySelector('#root') ? document.querySelector('#root').innerText : ''`) || '';
        if (last.trim().length > 20) return last;
        await delay(150);
    }
    throw new Error(`#root innerText stayed empty/short (${last.length} chars)`);
}

function writeSnapshot(outDir, name, html, text) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${name}.raw.html`), html + '\n');
    fs.writeFileSync(path.join(outDir, `${name}.normalized.html`), normalizeDom(html));
    fs.writeFileSync(path.join(outDir, `${name}.text.txt`), text + '\n');
    fs.writeFileSync(path.join(outDir, `${name}.text.normalized.txt`), normalizeDom(text));
}

async function main() {
    const outDir = process.argv.includes('--out')
        ? process.argv[process.argv.indexOf('--out') + 1]
        : path.join(repoRoot, 'verify-results/latest/dom');
    fs.mkdirSync(outDir, { recursive: true });

    const health = await fetch(new URL('/api/health', BASE_URL), { signal: AbortSignal.timeout(5000) });
    if (!health.ok) throw new Error(`Dev server health failed: ${health.status}`);

    const chrome = await launchChrome({ port: Number(process.env.VERIFY_CDP_PORT || 9223) });
    const cdp = await attachToBlankPage(chrome.port);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 430,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
    });
    try {
        // --- Onboarding (empty storage) ---
        await navigate(cdp, BASE_URL);
        await writeStorageAndReload(cdp, 'clear');
        writeSnapshot(outDir, 'onboarding', await snapshotRoot(cdp), await readVisibleText(cdp));

        // Each seeded view starts from a fresh reload so a prior CDP snapshot
        // cannot leave the page in a half-reloaded Home state.
        async function fromHome() {
            await writeStorageAndReload(cdp, buildSeed());
        }

        await fromHome();
        writeSnapshot(outDir, 'home', await snapshotRoot(cdp), await readVisibleText(cdp));

        await fromHome();
        let snap = await activate(cdp, { text: '血糖紀錄', withinNav: true, expectText: '症狀紀錄' });
        writeSnapshot(outDir, 'glucose-bg', snap.html, snap.text);

        await fromHome();
        await activate(cdp, { text: '血糖紀錄', withinNav: true, expectText: '症狀紀錄' });
        snap = await activate(cdp, { text: '症狀紀錄', expectText: '紀錄時間' });
        writeSnapshot(outDir, 'glucose-symptom', snap.html, snap.text);

        await fromHome();
        await activate(cdp, { text: '血糖紀錄', withinNav: true, expectText: '症狀紀錄' });
        snap = await activate(cdp, { text: '糖化', expectText: '糖化血紅素' });
        writeSnapshot(outDir, 'glucose-hba1c', snap.html, snap.text);

        await fromHome();
        snap = await activate(cdp, { text: '問題紀錄', withinNav: true, expectText: 'AI 自動總結常見類別' });
        writeSnapshot(outDir, 'saved-questions', snap.html, snap.text);

        await fromHome();
        snap = await activate(cdp, { text: '個人檔案', withinNav: true, expectText: '糖尿病相關信息' });
        writeSnapshot(outDir, 'me', snap.html, snap.text);

        await fromHome();
        snap = await activate(cdp, { id: 'btn-home-ask-ai', expectText: '快捷提問' });
        writeSnapshot(outDir, 'consult', snap.html, snap.text);

        const index = {
            baseUrl: BASE_URL,
            views: ['onboarding', 'home', 'glucose-bg', 'glucose-symptom', 'glucose-hba1c', 'saved-questions', 'me', 'consult'],
            note: 'DetailView / View.Result / MedicationReminders are not reachable from the current UI and are therefore not DOM-captured. Their modules are still part of the logic/source contract.',
        };
        fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
        console.log(`DOM snapshots written to ${outDir}`);
    } finally {
        cdp.close();
        await chrome.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
