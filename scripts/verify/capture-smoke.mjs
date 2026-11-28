/**
 * Business wiring smoke (hard gate). One headless Chrome against the dev
 * server; Gemini is mocked in-page (no real AI call can leave the page).
 *
 * UI-agnostic by design:
 *  - elements are found only by stable [data-verify="…"] hooks (see README:
 *    the hook names a business function, not a place or a look);
 *  - assertions read only persisted data (localStorage dia_*) and the
 *    captured /api/gemini/* request bodies — never visible text, classes,
 *    positions or screenshots (exception: the AI safety shapes, which check
 *    that locked safety copy is rendered and no tel: link exists);
 *  - a tap uses a real CDP pointer event when the element is hit-testable,
 *    otherwise el.click(): being covered is a UX question (verify --ui).
 *  - minimum touch size (owner decision 4) is the one layout rule kept:
 *    every visible interactive control is at least 56 px tall in large font
 *    (48 px standard). Labels and visually hidden elements are not controls.
 *
 * Writes smoke.normalized.json, requests.normalized.json and
 * shapes.normalized.json (goldens). Exits 1 on any failed assertion.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { launchChrome, attachToBlankPage, evaluate } from './lib/cdp.mjs';
import { stableStringify, stableStringifyRaw } from './lib/normalize.mjs';
import { buildSeed } from './lib/seed.mjs';
import { VERIFY_NOW_MS } from './lib/clock.mjs';
import { prepareVerifyCdp } from './lib/prepareCdp.mjs';
import { SHAPE_CASES } from './fixtures/shapes/messages.mjs';
import { disableAnimations, installGeminiMocks, navigate, readGeminiCalls, readStorage } from './lib/page.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';
const MOCK_REPLY = '【驗證用模擬回覆】呢個係測試訊息，唔係真正嘅 Gemini 答案。';

const failures = [];
const results = {};
function check(flow, name, cond, info) {
    (results[flow] ||= {})[name] = Boolean(cond);
    if (!cond) failures.push(`${flow}: ${name}${info === undefined ? '' : ' ' + JSON.stringify(info).slice(0, 400)}`);
}

const H = (name, id) => `[data-verify="${name}"]${id === undefined ? '' : `[data-verify-id="${id}"]`}`;

async function waitFor(cdp, expr, { timeout = 8000, what = expr } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const v = await evaluate(cdp, expr);
        if (v) return v;
        await delay(80);
    }
    const dump = await evaluate(cdp, `[...document.querySelectorAll('[data-verify]')].map((e) => e.getAttribute('data-verify') + (e.getAttribute('data-verify-id') ? '#' + e.getAttribute('data-verify-id') : '') + (e.getAttribute('aria-expanded') ? '=' + e.getAttribute('aria-expanded') : '')).join(' ')`).catch(() => '');
    throw new Error(`timed out waiting for ${what} | hooks: ${process.env.SMOKE_DEBUG ? dump : ''}`);
}
const has = (cdp, sel) => evaluate(cdp, `Boolean(document.querySelector(${JSON.stringify(sel)}))`);
const waitHook = (cdp, sel, timeout) => waitFor(cdp, `Boolean(document.querySelector(${JSON.stringify(sel)}))`, { timeout, what: sel });

async function tap(cdp, sel) {
    await waitFor(cdp, `(() => { const el = document.querySelector(${JSON.stringify(sel)}); return Boolean(el && !el.disabled); })()`, { what: `${sel} (enabled)` });
    const box = await evaluate(cdp, `(() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === el || el.contains(hit))) {
            window.__smokeClicked = false;
            el.addEventListener('click', () => { window.__smokeClicked = true; }, { once: true, capture: true });
            return { x, y, pointer: true };
        }
        el.click();
        return { pointer: false };
    })()`);
    if (box.pointer) {
        await delay(40);
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
            await cdp.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
        }
        // layout can shift between press and release (e.g. a field losing focus); then click directly
        await evaluate(cdp, `window.__smokeClicked || (document.querySelector(${JSON.stringify(sel)})?.click(), true)`);
    }
    await delay(120);
}

/** Type into a text field, or pick a value on a <select> (native or the hidden one behind a sheet). */
async function fill(cdp, sel, value) {
    await waitHook(cdp, sel);
    const tag = await evaluate(cdp, `document.querySelector(${JSON.stringify(sel)}).tagName`);
    if (tag !== 'SELECT') {
        await evaluate(cdp, `(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.scrollIntoView({ block: 'center' }); el.focus(); el.select && el.select(); return true; })()`);
        await cdp.send('Input.insertText', { text: String(value) });
    }
    await evaluate(cdp, `(() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(value))});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    })()`);
    await delay(100);
}

/** Wait until the target or its disclosure toggle exists; open the disclosure if needed. */
async function reveal(cdp, target, toggle) {
    await waitFor(cdp, `Boolean(document.querySelector(${JSON.stringify(target)}) || document.querySelector(${JSON.stringify(toggle)}))`, { what: target });
    for (let i = 0; i < 4 && !(await has(cdp, target)); i++) {
        const expanded = await evaluate(cdp, `document.querySelector(${JSON.stringify(toggle)})?.getAttribute('aria-expanded')`);
        if (expanded !== 'true') await tap(cdp, toggle);
        await delay(250);
    }
}

async function storage(cdp) { return readStorage(cdp); }
const J = (s, k, fb) => { try { return s[k] ? JSON.parse(s[k]) : fb; } catch { return fb; } };
async function waitStorage(cdp, pred, what, timeout = 6000) {
    const start = Date.now();
    let s;
    while (Date.now() - start < timeout) { s = await storage(cdp); if (pred(s)) return s; await delay(80); }
    const extra = process.env.SMOKE_DEBUG ? JSON.stringify({ chat: J(s || {}, 'dia_chat_messages', []).slice(-3), calls: (await readGeminiCalls(cdp).catch(() => [])).map((c) => c.url) }) : '';
    throw new Error(`timed out waiting for storage: ${what} ${extra}`);
}
/** Reload and wait for the NEW document's app to mount (old document is marked first). */
async function hardReload(cdp) {
    await evaluate(cdp, 'window.__smokeOldDoc = true; true');
    await cdp.send('Page.reload', { ignoreCache: true });
    const start = Date.now();
    while (Date.now() - start < 20000) {
        const ready = await evaluate(cdp, `!window.__smokeOldDoc && document.readyState !== 'loading' && Boolean(document.querySelector('[data-verify^="nav-"], [data-verify="ob-name"], [data-verify="ob-welcome-start"]'))`).catch(() => false);
        if (ready) break;
        await delay(100);
    }
    await disableAnimations(cdp);
    await delay(150);
}
async function reload(cdp, seedOrClear) {
    await evaluate(cdp, `(() => {
        localStorage.clear();
        const seed = ${JSON.stringify(seedOrClear === 'clear' ? {} : seedOrClear)};
        for (const [k, v] of Object.entries(seed)) if (typeof v === 'string') localStorage.setItem(k, v);
        return true;
    })()`);
    await hardReload(cdp);
}
const seed = (over = {}) => ({ ...buildSeed(VERIFY_NOW_MS), ...over });

const TOUCH_SCRIPT = `(() => {
    const large = Boolean(document.querySelector('.large-font'));
    const min = large ? 56 : 48;
    const out = [];
    for (const el of document.querySelectorAll('button, a[href], [role="button"], input:not([type="hidden"]), select, textarea')) {
        if (el.closest('[hidden], [aria-hidden="true"]') && el.tagName !== 'INPUT') continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.hidden) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) continue; // visually hidden (sr-only), not a control
        if (el.type === 'checkbox' || el.type === 'radio') continue; // wrapped by a sized label
        if (r.height + 0.5 < min) out.push({ tag: el.tagName.toLowerCase(), hook: el.getAttribute('data-verify'), text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 40), h: Math.round(r.height), w: Math.round(r.width) });
    }
    return { large, min, below: out };
})()`;
const touch = {};
async function touchGate(cdp, where) {
    const r = await evaluate(cdp, TOUCH_SCRIPT);
    touch[where] = { large: r.large, min: r.min, below: r.below.length };
    check('touch', `${where}: controls >= ${r.min}px`, r.below.length === 0, r.below);
}

function chatCalls(calls) { return calls.filter((c) => String(c.url).includes('/api/gemini/chat')).map((c) => { try { return JSON.parse(c.body); } catch { return null; } }); }

// ---------------------------------------------------------------- flows
async function onboarding(cdp) {
    await navigate(cdp, BASE_URL);
    await reload(cdp, 'clear');
    // Welcome is presentation-only (no fields saved). Advance if it is shown.
    if (await has(cdp, H('ob-welcome-start'))) {
        await touchGate(cdp, 'onboarding-welcome');
        await tap(cdp, H('ob-welcome-start'));
    }
    await waitHook(cdp, H('ob-name'));
    await touchGate(cdp, 'onboarding-1');
    await fill(cdp, H('ob-name'), '陳生');
    await fill(cdp, H('ob-age'), '72');
    await tap(cdp, H('ob-gender-男'));
    await tap(cdp, H('ob-next'));
    await waitHook(cdp, H('ob-finish'));
    await touchGate(cdp, 'onboarding-2');
    await tap(cdp, H('ob-finish'));
    await waitHook(cdp, H('nav-HOME'));
    const s = await storage(cdp); const p = J(s, 'dia_profile', {});
    check('onboarding', 'profile saved', 'dia_profile' in s);
    check('onboarding', 'name', p.name === '陳生', p.name);
    check('onboarding', 'age', p.age === '72', p.age);
    check('onboarding', 'gender', p.gender === '男', p.gender);
}

async function largeFont(cdp) {
    await reload(cdp, seed());
    await waitHook(cdp, H('font-toggle'));
    check('font', 'seeded on', (await storage(cdp)).dia_large_font === 'true');
    await tap(cdp, H('font-toggle'));
    await waitStorage(cdp, (s) => s.dia_large_font === 'false', 'font off');
    for (const v of ['HOME', 'GLUCOSE', 'SAVED_QUESTIONS', 'ME']) { await tap(cdp, H(`nav-${v}`)); await delay(150); await touchGate(cdp, `std-${v}`); }
    await tap(cdp, H('nav-HOME'));
    await tap(cdp, H('font-toggle'));
    await waitStorage(cdp, (s) => s.dia_large_font === 'true', 'font on');
    check('font', 'toggled off then on', true);
}

async function glucose(cdp) {
    await reload(cdp, seed());
    await touchGate(cdp, 'home');
    const before = J(await storage(cdp), 'dia_glucose', []).length;
    await tap(cdp, H('nav-GLUCOSE'));
    await touchGate(cdp, 'records');
    await tap(cdp, H('rec-open-bg'));
    await waitHook(cdp, H('glucose-value'));
    await touchGate(cdp, 'glucose-entry');
    await fill(cdp, H('glucose-value'), '8.1');
    await tap(cdp, H('glucose-save'));
    const s = await waitStorage(cdp, (x) => J(x, 'dia_glucose', []).length === before + 1, 'glucose +1');
    const rec = J(s, 'dia_glucose', []).find((r) => String(r.value) === '8.1');
    check('glucose', 'added +1', Boolean(rec));
    // default 時段 at the frozen 09:30 HK clock: 餐後2小時 / 早餐 (computed by the app, stored with the record)
    check('glucose', 'default period stored', rec && rec.timeType === '餐後2小時' && rec.mealTag === '早餐', rec && { timeType: rec.timeType, mealTag: rec.mealTag });
    check('glucose', 'timestamp = frozen now', rec && rec.timestamp === VERIFY_NOW_MS, rec && rec.timestamp);
    const del = H('rec-delete', rec?.id);
    await reveal(cdp, del, H('rec-expand-glucose'));
    await tap(cdp, del);
    await tap(cdp, H('confirm-cancel'));
    check('glucose', 'cancel keeps record', J(await storage(cdp), 'dia_glucose', []).length === before + 1);
    await tap(cdp, del);
    await tap(cdp, H('confirm-ok'));
    const after = J(await waitStorage(cdp, (x) => J(x, 'dia_glucose', []).length === before, 'glucose -1'), 'dia_glucose', []);
    check('glucose', 'confirm removes that record', !after.some((r) => r.id === rec?.id));
}

async function hba1c(cdp) {
    await reload(cdp, seed());
    const before = J(await storage(cdp), 'dia_hba1c', []).length;
    await tap(cdp, H('nav-GLUCOSE'));
    await tap(cdp, H('records-tab-HBA1C'));
    await tap(cdp, H('rec-open-hba1c'));
    await waitHook(cdp, H('hba1c-value'));
    await touchGate(cdp, 'hba1c-entry');
    await fill(cdp, H('hba1c-value'), '6.9');
    await tap(cdp, H('hba1c-save'));
    const s = await waitStorage(cdp, (x) => J(x, 'dia_hba1c', []).length === before + 1, 'hba1c +1');
    const rec = J(s, 'dia_hba1c', []).find((r) => r.value === '6.9');
    check('hba1c', 'added +1 (value 6.9)', Boolean(rec));
    const del = H('rec-delete', rec?.id);
    await reveal(cdp, del, H('rec-expand-hba1c'));
    await tap(cdp, del);
    await tap(cdp, H('confirm-cancel'));
    check('hba1c', 'cancel keeps record', J(await storage(cdp), 'dia_hba1c', []).length === before + 1);
    await tap(cdp, del);
    await tap(cdp, H('confirm-ok'));
    const after = J(await waitStorage(cdp, (x) => J(x, 'dia_hba1c', []).length === before, 'hba1c -1'), 'dia_hba1c', []);
    check('hba1c', 'confirm removes that record', !after.some((r) => r.id === rec?.id));
}

async function questions(cdp) {
    await reload(cdp, seed());
    const text = '驗證新增：覆診時想問醫生血糖偏高點算？';
    await tap(cdp, H('nav-SAVED_QUESTIONS'));
    await touchGate(cdp, 'questions');
    await tap(cdp, H('q-add-open'));
    await fill(cdp, H('q-input'), text);
    await touchGate(cdp, 'questions-adding');
    await tap(cdp, H('q-add-confirm'));
    const s = await waitStorage(cdp, (x) => (J(x, 'dia_profile', {}).savedDoctorQuestions || [])[0] === text, 'question added');
    const list = J(s, 'dia_profile', {}).savedDoctorQuestions;
    check('questions', 'added first, others kept', list[0] === text && list.length === 3, list);
    const del = H('q-delete', 0);
    await reveal(cdp, del, H('q-list-expand'));
    await tap(cdp, del);
    await tap(cdp, H('confirm-cancel'));
    check('questions', 'cancel keeps question', (J(await storage(cdp), 'dia_profile', {}).savedDoctorQuestions || []).includes(text));
    await tap(cdp, del);
    await tap(cdp, H('confirm-ok'));
    const after = J(await waitStorage(cdp, (x) => !(J(x, 'dia_profile', {}).savedDoctorQuestions || []).includes(text), 'question deleted'), 'dia_profile', {});
    check('questions', 'confirm deletes it only', after.savedDoctorQuestions.length === 2, after.savedDoctorQuestions);
}

async function me(cdp) {
    await reload(cdp, seed());
    await tap(cdp, H('nav-ME'));
    await touchGate(cdp, 'me');
    await tap(cdp, H('me-open-personal'));
    await waitHook(cdp, H('me-name'));
    await touchGate(cdp, 'me-personal');
    await fill(cdp, H('me-name'), '陳生驗證');
    await tap(cdp, H('me-editor-done'));
    await tap(cdp, H('me-save'));
    await waitStorage(cdp, (x) => J(x, 'dia_profile', {}).name === '陳生驗證', 'name saved');
    await hardReload(cdp);
    check('me', 'name persists after reload', J(await storage(cdp), 'dia_profile', {}).name === '陳生驗證');
    // medication from the HA list
    await tap(cdp, H('nav-ME'));
    const meds0 = J(await storage(cdp), 'dia_profile', {}).medicationDetails || [];
    await tap(cdp, H('me-open-diabetes'));
    await waitHook(cdp, H('me-med-pick'));
    const pick = await evaluate(cdp, `(() => { const s = document.querySelector('[data-verify="me-med-pick"]'); const o = [...s.options].map((x) => x.value).filter(Boolean); return o.find((v) => !${JSON.stringify(meds0.map((m) => m.name))}.includes(v)); })()`);
    await fill(cdp, H('me-med-pick'), pick);
    await tap(cdp, H('me-editor-done'));
    await tap(cdp, H('me-save'));
    const p = J(await waitStorage(cdp, (x) => (J(x, 'dia_profile', {}).medicationDetails || []).length === meds0.length + 1, 'med added'), 'dia_profile', {});
    check('me', 'HA medication added', p.medicationDetails.some((m) => m.name === pick) && p.medications.includes(pick), { pick, medications: p.medications });
}

/** Owner-approved 2026-11-28: optional nextClinicTime / nextClinicLocation via the home clinic sheet. */
async function clinic(cdp) {
    await reload(cdp, seed());
    const before = J(await storage(cdp), 'dia_profile', {});
    await tap(cdp, H('home-clinic-edit'));
    await waitHook(cdp, H('home-clinic-time'));
    await touchGate(cdp, 'home-clinic-sheet');
    await fill(cdp, H('home-clinic-date'), '2026-12-03');
    await fill(cdp, H('home-clinic-time'), '09:30');
    await fill(cdp, H('home-clinic-location'), '葵涌普通科門診');
    await tap(cdp, H('home-clinic-save'));
    const p = J(await waitStorage(cdp, (x) => J(x, 'dia_profile', {}).nextClinicLocation === '葵涌普通科門診', 'clinic details saved'), 'dia_profile', {});
    check('clinic', 'date/time/location saved as separate optional fields', p.nextClinicDate === '2026-12-03' && p.nextClinicTime === '09:30', { d: p.nextClinicDate, t: p.nextClinicTime });
    const otherKeys = (o) => Object.keys(o).filter((k) => !['nextClinicDate', 'nextClinicTime', 'nextClinicLocation'].includes(k)).sort();
    check('clinic', 'no other profile field changed', JSON.stringify(otherKeys(p)) === JSON.stringify(otherKeys(before)) && otherKeys(p).every((k) => JSON.stringify(p[k]) === JSON.stringify(before[k])));
    await tap(cdp, H('home-clinic-edit'));
    await fill(cdp, H('home-clinic-time'), '');
    await fill(cdp, H('home-clinic-location'), '');
    await tap(cdp, H('home-clinic-save'));
    const c = J(await waitStorage(cdp, (x) => !('nextClinicLocation' in J(x, 'dia_profile', {})), 'clinic extras cleared'), 'dia_profile', {});
    check('clinic', 'cleared extras are removed, date kept', !('nextClinicTime' in c) && c.nextClinicDate === '2026-12-03');
}

async function consult(cdp) {
    const history = [
        { id: 'welcome', role: 'assistant', content: '歡迎', isWelcome: true },
        { id: 'u1', role: 'user', content: '  早餐食咗白粥  ' },
        { id: 'a1', role: 'assistant', content: '白粥升糖較快。' },
        { id: 'u2', role: 'user', content: '咁應該點？' },
        { id: 'e1', role: 'assistant', content: '⚠️ 唔好意思，系統暫時未能完成回覆，請稍等幾秒再試一次。', isError: true },
    ];
    await reload(cdp, seed({ dia_chat_messages: JSON.stringify(history) }));
    await installGeminiMocks(cdp, MOCK_REPLY);
    await tap(cdp, H('consult-open'));
    await waitHook(cdp, H('chat-input'));
    await touchGate(cdp, 'consult');
    await fill(cdp, H('chat-input'), '午餐食咗叉燒飯，血糖會唔會太高？');
    await tap(cdp, H('chat-send'));
    const s = await waitStorage(cdp, (x) => { const m = J(x, 'dia_chat_messages', []); return m.length && m[m.length - 1].content === MOCK_REPLY; }, 'mock reply stored');
    const stored = J(s, 'dia_chat_messages', []);
    const body = chatCalls(await readGeminiCalls(cdp))[0] || {};
    const seeded = buildSeed(VERIFY_NOW_MS);
    check('consult', 'one chat request', chatCalls(await readGeminiCalls(cdp)).length === 1);
    check('consult', 'user + reply persisted', stored.at(-2)?.role === 'user' && stored.at(-2)?.content === '午餐食咗叉燒飯，血糖會唔會太高？');
    check('consult', 'profile sent = stored profile', JSON.stringify(body.profile) === s.dia_profile);
    check('consult', 'glucose sent = stored records', JSON.stringify(body.glucoseRecords) === seeded.dia_glucose);
    check('consult', 'hba1c sent = stored records', JSON.stringify(body.hba1cRecords) === seeded.dia_hba1c);
    const chatRequest = {
        keys: Object.keys(body).sort(),
        message: body.message,
        history: body.history,
        preferenceAlreadySubmitted: body.preferenceAlreadySubmitted,
    };
    // new chat: cancel keeps, confirm clears to the welcome line
    await tap(cdp, H('chat-new'));
    await tap(cdp, H('confirm-cancel'));
    check('consult', 'new chat: cancel keeps', J(await storage(cdp), 'dia_chat_messages', []).length === stored.length);
    await tap(cdp, H('chat-new'));
    await tap(cdp, H('confirm-ok'));
    const cleared = J(await waitStorage(cdp, (x) => J(x, 'dia_chat_messages', []).length <= 1, 'chat cleared'), 'dia_chat_messages', []);
    check('consult', 'new chat: confirm clears to welcome', cleared.length <= 1 && (!cleared[0] || cleared[0].isWelcome), cleared);
    return chatRequest;
}

async function sentMessage(cdp, seedOver, run) {
    await reload(cdp, seed(seedOver));
    await installGeminiMocks(cdp, MOCK_REPLY);
    await tap(cdp, H('consult-open'));
    await run();
    await waitFor(cdp, `(window.__verifyGeminiCalls || []).some((c) => String(c.url).includes('/api/gemini/chat'))`, { what: 'chat request' });
    return chatCalls(await readGeminiCalls(cdp))[0]?.message ?? null;
}

async function requests(cdp) {
    const out = {};
    out.shortcut_data_reading = { message: await sentMessage(cdp, { dia_chat_messages: undefined }, async () => tap(cdp, H('shortcut-0'))) };
    const prefCase = SHAPE_CASES.find((c) => c.id === 'preference');
    out.preference_submit = { message: await sentMessage(cdp, { dia_chat_messages: JSON.stringify(prefCase.messages) }, async () => {
        await tap(cdp, H('pref-option', 'pain'));
        await tap(cdp, H('pref-submit'));
    }) };
    const decCase = SHAPE_CASES.find((c) => c.id === 'comparison-decision');
    out.follow_up = { message: await sentMessage(cdp, { dia_chat_messages: JSON.stringify(decCase.messages) }, async () => tap(cdp, H('followup'))) };
    for (const [k, v] of Object.entries(out)) check('requests', `${k} sent`, typeof v.message === 'string' && v.message.length > 0, v);
    return out;
}

async function shapes(cdp) {
    const cases = [];
    for (const shape of SHAPE_CASES) {
        await reload(cdp, seed({ dia_chat_messages: JSON.stringify(shape.messages) }));
        await tap(cdp, H('consult-open'));
        await waitHook(cdp, H('chat-thread'));
        await delay(150);
        const text = await evaluate(cdp, `document.querySelector('#root').innerText`) || '';
        const html = await evaluate(cdp, `document.querySelector('#root').innerHTML`) || '';
        const tel = [...html.matchAll(/href\s*=\s*["']tel:[^"']+["']/gi)].map((m) => m[0]);
        const missing = shape.expectPresent.filter((n) => !text.includes(n));
        const unexpected = shape.expectAbsent.filter((n) => text.includes(n));
        const ok = missing.length === 0 && unexpected.length === 0 && tel.length === 0;
        cases.push({ id: shape.id, ok, missing, unexpected, telHrefs: tel, hideFollowUps: shape.hideFollowUps });
        check('shapes', shape.id, ok, { missing, unexpected, tel });
    }
    return { cases, ok: cases.every((c) => c.ok) };
}

async function storageRoundTrip(cdp) {
    const s0 = seed();
    await reload(cdp, s0);
    await waitHook(cdp, H('nav-GLUCOSE'));
    const first = await storage(cdp);
    for (const v of ['GLUCOSE', 'CONSULT', 'SAVED_QUESTIONS', 'ME', 'HOME']) { await tap(cdp, H(`nav-${v}`)); await delay(120); }
    const after = await storage(cdp);
    for (const k of ['dia_profile', 'dia_glucose', 'dia_hba1c', 'dia_large_font', 'dia_reminders_v2', 'dia_taken_logs_v2']) {
        // dia_profile is re-written normalized on load (legacy migration); compare it as data
        let diff = [];
        if (k === 'dia_profile') { const a = JSON.parse(s0[k]), b = JSON.parse(first[k] || '{}'); diff = Object.keys(a).filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])); }
        check('storage', `${k} survives reload`, k === 'dia_profile' ? diff.length === 0 : first[k] === s0[k], diff);
        check('storage', `${k} unchanged by navigating`, after[k] === first[k]);
    }
    return Object.keys(first).sort();
}

// ---------------------------------------------------------------- main
const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : path.join(repoRoot, 'verify-results/latest/smoke');
fs.mkdirSync(outDir, { recursive: true });
const health = await fetch(new URL('/api/health', BASE_URL), { signal: AbortSignal.timeout(5000) }).catch((e) => ({ ok: false, status: String(e) }));
if (!health.ok) { console.error(`Dev server health failed at ${BASE_URL}: ${health.status}`); process.exit(1); }

const chrome = await launchChrome({ port: Number(process.env.VERIFY_SMOKE_CDP_PORT || 9226) });
const cdp = await attachToBlankPage(chrome.port);
await prepareVerifyCdp(cdp);
const timings = {};
let chatRequest = null, req = null, shapeOut = null, keys = null;
try {
    const steps = [
        ['onboarding', () => onboarding(cdp)],
        ['font', () => largeFont(cdp)],
        ['glucose', () => glucose(cdp)],
        ['hba1c', () => hba1c(cdp)],
        ['questions', () => questions(cdp)],
        ['me', () => me(cdp)],
        ['clinic', () => clinic(cdp)],
        ['consult', async () => { chatRequest = await consult(cdp); }],
        ['requests', async () => { req = await requests(cdp); }],
        ['shapes', async () => { shapeOut = await shapes(cdp); }],
        ['storage', async () => { keys = await storageRoundTrip(cdp); }],
    ];
    for (const [name, fn] of steps) {
        const t = Date.now();
        try { await fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
        timings[name] = Date.now() - t;
        console.log(`  smoke: ${name} ${failures.some((f) => f.startsWith(name)) ? 'FAIL' : 'ok'} (${timings[name]} ms)`);
    }
} finally {
    cdp.close();
    await chrome.close();
}
const aiCallsNote = 'all /api/gemini/* calls answered in-page (window.fetch patched); none left the browser';
if (req) fs.writeFileSync(path.join(outDir, 'requests.normalized.json'), stableStringifyRaw(req));
if (shapeOut) fs.writeFileSync(path.join(outDir, 'shapes.normalized.json'), stableStringifyRaw(shapeOut));
fs.writeFileSync(path.join(outDir, 'smoke.normalized.json'), stableStringify({ results, chatRequest, storageKeys: keys, touch, gemini: aiCallsNote }));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ baseUrl: BASE_URL, ok: failures.length === 0, failures, timingsMs: timings }, null, 2) + '\n');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`smoke captures written to ${outDir}`);
