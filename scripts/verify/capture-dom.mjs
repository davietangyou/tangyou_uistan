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
import { buildSeed } from './lib/seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';

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
