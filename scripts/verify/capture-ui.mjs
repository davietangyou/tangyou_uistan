/**
 * Visible-copy inventory, AI message-shape fixtures, and touch/contrast
 * audits against the local dev server. Uses the frozen Hong Kong clock.
 * Shape and locked-copy assertions fail the process; audits only report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, attachToBlankPage, evaluate } from './lib/cdp.mjs';
import { stableStringify, stableStringifyRaw, normalizeText } from './lib/normalize.mjs';
import { buildSeed } from './lib/seed.mjs';
import { VERIFY_NOW_MS, VERIFY_EXPECTED } from './lib/clock.mjs';
import { prepareVerifyCdp } from './lib/prepareCdp.mjs';
import { AUDIT_SCRIPT } from './lib/audit.mjs';
import { SHAPE_CASES } from './fixtures/shapes/messages.mjs';
import { LOCKED_COPY_SOURCES, classifyVisibleLine } from './lib/lockedCopy.mjs';
import {
    click,
    disableAnimations,
    navigate,
    visibleText,
    waitForText,
    writeStorageAndReload,
} from './lib/page.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';

function seed(overrides = {}) {
    return { ...buildSeed(VERIFY_NOW_MS), ...overrides };
}

function linesOf(text) {
    return String(text).split(/\n+/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function classifyInventory(text) {
    const lockedValues = LOCKED_COPY_SOURCES.map((s) => s.value);
    const lines = linesOf(text);
    const items = lines.map((line) => ({ line, tier: classifyVisibleLine(line, lockedValues) })).filter((x) => x.tier);
    return {
        locked: items.filter((i) => i.tier === 'locked').map((i) => i.line),
        polishable: items.filter((i) => i.tier === 'polishable').map((i) => i.line),
        decorative: items.filter((i) => i.tier === 'decorative').map((i) => i.line),
        allNormalized: normalizeText(lines.join('\n')),
    };
}

const VIEWS = [
    { id: 'onboarding', setup: 'clear', expect: '如何稱呼您？' },
    { id: 'home', setup: 'seed', expect: '問問 AI' },
    // S4b: the glucose / symptom entry forms are sub-pages; the page shows the
    // 記錄血糖 / 記錄症狀 entry card (with the draft's time + 時段). The forms are
    // still audited, as their own views (-entry).
    { id: 'glucose-bg', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }], expect: '記錄血糖' },
    { id: 'glucose-bg-entry', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }, { selector: '#btn-rec-entry-bg', expect: '完成儲存' }], expect: '完成儲存' },
    { id: 'glucose-symptom', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }, { text: '症狀紀錄', expect: '紀錄時間' }], expect: '紀錄時間' },
    { id: 'glucose-symptom-entry', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }, { text: '症狀紀錄', expect: '紀錄時間' }, { selector: '#btn-rec-entry-symptom', expect: '儲存症狀紀錄' }], expect: '儲存症狀紀錄' },
    { id: 'glucose-hba1c', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }, { text: '糖化', expect: '糖化血紅素' }], expect: '糖化血紅素' },
    // S5 (owner t20u): the HbA1c form is a sub-page too; audited as its own view.
    { id: 'glucose-hba1c-entry', setup: 'seed', nav: [{ text: '紀錄', withinNav: true, expect: '症狀紀錄' }, { text: '糖化', expect: '糖化血紅素' }, { selector: '#btn-rec-entry-hba1c', expect: '儲存糖化血紅素' }], expect: '儲存糖化血紅素' },
    { id: 'saved-questions', setup: 'seed', nav: [{ text: '問題', withinNav: true, expect: 'AI 自動總結常見類別' }], expect: 'AI 自動總結常見類別' },
    { id: 'me', setup: 'seed', nav: [{ text: '我的', withinNav: true, expect: '糖尿病相關信息' }], expect: '糖尿病相關信息' },
    { id: 'consult', setup: 'seed-empty-chat', nav: [{ selector: '#btn-home-ask-ai', expect: '快捷提問' }], expect: '快捷提問' },
];

async function openView(cdp, view, largeFont) {
    if (view.setup === 'clear') {
        await writeStorageAndReload(cdp, 'clear');
    } else if (view.setup === 'seed-empty-chat') {
        const s = seed({ dia_large_font: largeFont ? 'true' : 'false' });
        delete s.dia_chat_messages;
        await writeStorageAndReload(cdp, s);
    } else {
        await writeStorageAndReload(cdp, seed({ dia_large_font: largeFont ? 'true' : 'false' }));
    }
    await disableAnimations(cdp);
    if (view.nav) {
        for (const step of view.nav) {
            await click(cdp, step);
            if (step.expect) await waitForText(cdp, step.expect);
        }
    }
    await waitForText(cdp, view.expect);
}

async function main() {
    const outDir = process.argv.includes('--out')
        ? process.argv[process.argv.indexOf('--out') + 1]
        : path.join(repoRoot, 'verify-results/latest/ui');
    fs.mkdirSync(outDir, { recursive: true });

    const health = await fetch(new URL('/api/health', BASE_URL), { signal: AbortSignal.timeout(5000) });
    if (!health.ok) throw new Error(`Dev server health failed: ${health.status}`);

    const chrome = await launchChrome({ port: Number(process.env.VERIFY_UI_CDP_PORT || 9225) });
    const cdp = await attachToBlankPage(chrome.port);
    await prepareVerifyCdp(cdp);
    const failures = [];
    const inventory = { large: {}, standard: {} };
    const audits = { large: {}, standard: {} };

    try {
        await navigate(cdp, BASE_URL);

        for (const font of [
            { key: 'large', large: true },
            { key: 'standard', large: false },
        ]) {
            console.log(`  ui: inventory + audit (${font.key})`);
            for (const view of VIEWS) {
                if (view.id === 'onboarding' && !font.large) {
                    // Onboarding has no saved font yet; still capture both by setting after? Skip second onboarding.
                    continue;
                }
                await openView(cdp, view, font.large);
                const text = await visibleText(cdp);
                inventory[font.key][view.id] = classifyInventory(text);
                audits[font.key][view.id] = await evaluate(cdp, AUDIT_SCRIPT);

                if (view.id === 'home' && font.large) {
                    if (!text.includes(VERIFY_EXPECTED.greetingWithName)) {
                        failures.push(`home greeting expected ${VERIFY_EXPECTED.greetingWithName}, visible: ${text.slice(0, 200)}`);
                    }
                }
                if (view.id === 'glucose-bg' && font.large) {
                    if (!text.includes(VERIFY_EXPECTED.periodLabel)) {
                        failures.push(`glucose default period expected ${VERIFY_EXPECTED.periodLabel}, visible: ${text.slice(0, 240)}`);
                    }
                }
                if (view.id === 'consult' && font.large) {
                    for (const id of ['disclaimer_consult', 'shortcut_data']) {
                        const value = LOCKED_COPY_SOURCES.find((s) => s.id === id).value;
                        const needle = id === 'disclaimer_consult' ? value : '數據解讀';
                        if (!text.includes(needle) && !text.replace(/\s+/g, '').includes(value.replace(/\s+/g, ''))) {
                            // shortcut full text is in click handler, label is visible
                            if (id === 'shortcut_data' && text.includes('數據解讀')) continue;
                            failures.push(`consult missing locked visible ${id}`);
                        }
                    }
                    if (!text.includes('專業聲明：資訊來源基於香港醫學臨床指引與 ADA 標準')) {
                        failures.push('consult missing professional disclaimer');
                    }
                }
            }
        }

        const shapeResults = [];
        console.log('  ui: message shapes');
        for (const shape of SHAPE_CASES) {
            const s = seed();
            s.dia_chat_messages = JSON.stringify(shape.messages);
            await writeStorageAndReload(cdp, s);
            await disableAnimations(cdp);
            await click(cdp, { selector: '#btn-home-ask-ai' });
            await waitForText(cdp, '專業聲明');
            const text = await visibleText(cdp);
            const html = await evaluate(cdp, `document.querySelector('#root') ? document.querySelector('#root').innerHTML : ''`) || '';
            const tel = [...html.matchAll(/href\s*=\s*["']tel:[^"']+["']/gi)].map((m) => m[0]);
            const missing = shape.expectPresent.filter((n) => !text.includes(n));
            const unexpected = shape.expectAbsent.filter((n) => text.includes(n));
            const ok = missing.length === 0 && unexpected.length === 0 && tel.length === 0;
            shapeResults.push({
                id: shape.id,
                ok,
                missing,
                unexpected,
                telHrefs: tel,
                hideFollowUps: shape.hideFollowUps,
            });
            if (!ok) {
                failures.push(`shape ${shape.id} failed: ${JSON.stringify({ missing, unexpected, tel })}`);
            }
            fs.writeFileSync(path.join(outDir, `shape-${shape.id}.text.txt`), text + '\n');
        }

        const auditSummary = {};
        for (const font of ['large', 'standard']) {
            auditSummary[font] = {};
            for (const [view, report] of Object.entries(audits[font] || {})) {
                auditSummary[font][view] = {
                    largeFont: report.largeFont,
                    minTouch: report.minTouch,
                    touchCount: report.touchCount,
                    touchBelowCount: (report.touchBelow || []).length,
                    contrastIssueCount: (report.contrastIssues || []).length,
                    telHrefs: report.telHrefs || [],
                };
            }
        }

        const visibleLockedHits = {};
        for (const [font, views] of Object.entries(inventory)) {
            visibleLockedHits[font] = {};
            for (const [view, inv] of Object.entries(views)) {
                visibleLockedHits[font][view] = inv.locked;
            }
        }

        fs.writeFileSync(path.join(outDir, 'visible-inventory.normalized.json'), stableStringify({
            clock: { iso: '2026-11-26T09:30:00+08:00', timezone: 'Asia/Hong_Kong' },
            inventory,
        }));
        fs.writeFileSync(path.join(outDir, 'audit-report.json'), JSON.stringify(audits, null, 2) + '\n');
        fs.writeFileSync(path.join(outDir, 'audit-summary.normalized.json'), stableStringify({
            note: 'Informational baseline. Touch and contrast shortfalls are expected on the current UI and do not fail verify.',
            summary: auditSummary,
        }));
        fs.writeFileSync(path.join(outDir, 'shapes.normalized.json'), stableStringifyRaw({
            cases: shapeResults,
            ok: shapeResults.every((r) => r.ok),
        }));
        fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({
            baseUrl: BASE_URL,
            views: VIEWS.map((v) => v.id),
            shapes: SHAPE_CASES.map((s) => s.id),
            ok: failures.length === 0,
            failures,
        }, null, 2) + '\n');

        console.log(`UI contract captures written to ${outDir}`);
        if (failures.length) {
            console.error(failures.join('\n'));
            process.exit(1);
        }
    } finally {
        cdp.close();
        await chrome.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
