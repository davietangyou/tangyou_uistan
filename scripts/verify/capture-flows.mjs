/**
 * Interaction flows against the local dev server, using real Chrome CDP
 * pointer and keyboard events. Gemini HTTP calls are mocked in-page.
 * Requires the dev server on port 9002.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { launchChrome, attachToBlankPage, evaluate } from './lib/cdp.mjs';
import { normalizeText, stableStringify, stableStringifyRaw } from './lib/normalize.mjs';
import { buildSeed } from './lib/seed.mjs';
import { VERIFY_NOW_MS } from './lib/clock.mjs';
import { prepareVerifyCdp } from './lib/prepareCdp.mjs';
import { SHORTCUT_TEXTS } from './lib/lockedCopy.mjs';
import { SHAPE_CASES } from './fixtures/shapes/messages.mjs';
import {
    click,
    disableAnimations,
    installGeminiMocks,
    navigate,
    parseJson,
    readGeminiCalls,
    readStorage,
    screenshot,
    settle,
    typeText,
    visibleText,
    waitForText,
    writeStorageAndReload,
} from './lib/page.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, stableStringify(value));
}

function profileFromStorage(storage) {
    return parseJson(storage.dia_profile, {});
}

function glucoseFromStorage(storage) {
    return parseJson(storage.dia_glucose, []);
}

async function shot(cdp, shotsDir, name) {
    fs.mkdirSync(shotsDir, { recursive: true });
    await disableAnimations(cdp);
    await delay(80);
    const file = path.join(shotsDir, `${name}.png`);
    await screenshot(cdp, file);
    return path.relative(path.dirname(shotsDir), file);
}

async function flowOnboarding(cdp, shotsDir) {
    const steps = [];
    await navigate(cdp, BASE_URL);
    await writeStorageAndReload(cdp, 'clear');
    await disableAnimations(cdp);
    await waitForText(cdp, '如何稱呼您？');
    steps.push({ name: 'land-onboarding', text: '如何稱呼您？', shot: await shot(cdp, shotsDir, 'onboarding-start') });

    await typeText(cdp, { placeholder: '例如：陳生、張太、Uncle John' }, '陳生');
    await typeText(cdp, { placeholder: '例如：68' }, '72');
    await click(cdp, { text: '男' });
    steps.push({ name: 'filled-step1', shot: await shot(cdp, shotsDir, 'onboarding-filled') });

    await click(cdp, { text: '下一步：長期疾病狀況' });
    await waitForText(cdp, '完成並進入糖友導航');
    steps.push({ name: 'step2', text: '完成並進入糖友導航' });

    await click(cdp, { text: '完成並進入糖友導航' });
    await waitForText(cdp, '問問 AI');
    const storage = await readStorage(cdp);
    const profile = profileFromStorage(storage);
    const assertions = {
        onHome: (await visibleText(cdp)).includes('問問 AI'),
        name: profile.name === '陳生',
        age: profile.age === '72',
        gender: profile.gender === '男',
        hasProfileKey: Object.prototype.hasOwnProperty.call(storage, 'dia_profile'),
    };
    steps.push({ name: 'arrived-home', assertions, shot: await shot(cdp, shotsDir, 'onboarding-home') });
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`onboarding assertions failed: ${JSON.stringify({ assertions, profile })}`);
    }
    return { name: 'onboarding', ok: true, assertions, steps };
}

async function flowLargeFont(cdp, shotsDir) {
    await writeStorageAndReload(cdp, buildSeed(VERIFY_NOW_MS));
    await disableAnimations(cdp);
    await waitForText(cdp, '標準字');
    const before = {
        hasClass: await evaluate(cdp, `Boolean(document.querySelector('.large-font'))`),
        storage: (await readStorage(cdp)).dia_large_font,
        button: '標準字',
    };
    const shotOn = await shot(cdp, shotsDir, 'font-large-on');
    await click(cdp, { text: '標準字' });
    await waitForText(cdp, '放大字');
    await delay(150);
    const afterOff = {
        hasClass: await evaluate(cdp, `Boolean(document.querySelector('.large-font'))`),
        storage: (await readStorage(cdp)).dia_large_font,
        buttonVisible: (await visibleText(cdp)).includes('放大字'),
    };
    const shotOff = await shot(cdp, shotsDir, 'font-large-off');
    await click(cdp, { text: '放大字' });
    await waitForText(cdp, '標準字');
    await delay(150);
    const afterOn = {
        hasClass: await evaluate(cdp, `Boolean(document.querySelector('.large-font'))`),
        storage: (await readStorage(cdp)).dia_large_font,
    };
    const assertions = {
        startedOn: before.hasClass === true && before.storage === 'true',
        toggledOff: afterOff.hasClass === false && afterOff.storage === 'false' && afterOff.buttonVisible,
        toggledOn: afterOn.hasClass === true && afterOn.storage === 'true',
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`large-font assertions failed: ${JSON.stringify({ assertions, before, afterOff, afterOn })}`);
    }
    return { name: 'large-font-toggle', ok: true, assertions, steps: [
        { name: 'default-on', ...before, shot: shotOn },
        { name: 'toggled-off', ...afterOff, shot: shotOff },
        { name: 'toggled-on', ...afterOn, shot: await shot(cdp, shotsDir, 'font-large-restored') },
    ] };
}

async function flowGlucoseAddDelete(cdp, shotsDir) {
    await writeStorageAndReload(cdp, buildSeed(VERIFY_NOW_MS));
    await disableAnimations(cdp);
    const beforeCount = glucoseFromStorage(await readStorage(cdp)).length;
    await click(cdp, { text: '血糖紀錄', withinNav: true });
    await waitForText(cdp, '完成儲存');
    await typeText(cdp, { placeholder: '請輸入' }, '8.1');
    await click(cdp, { text: '完成儲存' });
    await waitForText(cdp, '血糖紀錄已成功儲存');
    await delay(200);
    const afterAdd = glucoseFromStorage(await readStorage(cdp));
    const added = afterAdd.find((r) => String(r.value) === '8.1' || String(r.value) === '8.10');
    const addAssertions = {
        countIncreased: afterAdd.length === beforeCount + 1,
        hasValue81: Boolean(added),
        successBanner: (await visibleText(cdp)).includes('血糖紀錄已成功儲存'),
    };
    const shotAdded = await shot(cdp, shotsDir, 'glucose-added');

    await click(cdp, { text: '展開顯示' });
    await waitForText(cdp, '收起隱藏');
    const countBeforeDelete = afterAdd.length;
    await click(cdp, { title: '刪除紀錄' });
    await delay(200);
    const afterDelete = glucoseFromStorage(await readStorage(cdp));
    const deleteAssertions = {
        countDecreased: afterDelete.length === countBeforeDelete - 1,
        addedRemoved: !afterDelete.some((r) => r.id === added?.id),
    };
    const assertions = { ...addAssertions, ...deleteAssertions };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`glucose assertions failed: ${JSON.stringify({ assertions, afterAdd, afterDelete })}`);
    }
    return {
        name: 'glucose-add-delete',
        ok: true,
        assertions,
        addedValue: added?.value,
        counts: { before: beforeCount, afterAdd: afterAdd.length, afterDelete: afterDelete.length },
        steps: [
            { name: 'added', shot: shotAdded },
            { name: 'deleted', shot: await shot(cdp, shotsDir, 'glucose-after-delete') },
        ],
    };
}

async function flowSavedQuestions(cdp, shotsDir) {
    await writeStorageAndReload(cdp, buildSeed(VERIFY_NOW_MS));
    await disableAnimations(cdp);
    await click(cdp, { text: '問題紀錄', withinNav: true });
    await waitForText(cdp, '手動新增問題');
    const before = profileFromStorage(await readStorage(cdp)).savedDoctorQuestions || [];
    await click(cdp, { selector: '#btn-add-q-inline' });
    await waitForText(cdp, '確定新增');
    await typeText(cdp, { placeholder: '請輸入想保存的問題' }, '驗證新增：覆診時想問醫生血糖偏高點算？');
    await click(cdp, { text: '確定新增' });
    await delay(200);
    await waitForText(cdp, '驗證新增：覆診時想問醫生血糖偏高點算？');
    const after = profileFromStorage(await readStorage(cdp)).savedDoctorQuestions || [];
    const assertions = {
        countIncreased: after.length === before.length + 1,
        textPersisted: after.includes('驗證新增：覆診時想問醫生血糖偏高點算？'),
        visible: (await visibleText(cdp)).includes('驗證新增：覆診時想問醫生血糖偏高點算？'),
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`saved-questions assertions failed: ${JSON.stringify({ assertions, before, after })}`);
    }
    return {
        name: 'saved-questions-add',
        ok: true,
        assertions,
        counts: { before: before.length, after: after.length },
        steps: [{ name: 'added', shot: await shot(cdp, shotsDir, 'saved-questions-added') }],
    };
}

async function flowMeProfile(cdp, shotsDir) {
    await writeStorageAndReload(cdp, buildSeed(VERIFY_NOW_MS));
    await disableAnimations(cdp);
    await click(cdp, { text: '個人檔案', withinNav: true });
    await waitForText(cdp, '保存修改');
    await typeText(cdp, { placeholder: '例如：陳生、張太' }, '陳生驗證');
    await click(cdp, { text: '保存修改' });
    await waitForText(cdp, '已成功保存修改');
    const live = profileFromStorage(await readStorage(cdp));
    const assertionsAfterSave = {
        nameUpdated: live.name === '陳生驗證',
        banner: (await visibleText(cdp)).includes('已成功保存修改'),
    };
    const shotSaved = await shot(cdp, shotsDir, 'me-saved');

    // Round-trip: reload must restore the edited name from localStorage.
    await cdp.send('Page.reload', { ignoreCache: true });
    await settle(cdp, 600);
    await disableAnimations(cdp);
    await click(cdp, { text: '個人檔案', withinNav: true });
    await waitForText(cdp, '保存修改');
    const afterReload = profileFromStorage(await readStorage(cdp));
    const inputValue = await evaluate(cdp, `(() => {
        const el = [...document.querySelectorAll('input')].find((e) => (e.getAttribute('placeholder') || '').includes('例如：陳生、張太'));
        return el ? el.value : null;
    })()`);
    const assertions = {
        ...assertionsAfterSave,
        reloadedName: afterReload.name === '陳生驗證',
        reloadedInputValue: inputValue === '陳生驗證',
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`me-profile assertions failed: ${JSON.stringify({ assertions, live, afterReload })}`);
    }
    return {
        name: 'me-profile-edit-roundtrip',
        ok: true,
        assertions,
        steps: [
            { name: 'saved', shot: shotSaved },
            { name: 'reloaded', shot: await shot(cdp, shotsDir, 'me-reloaded') },
        ],
    };
}

async function flowConsultMocked(cdp, shotsDir) {
    const reply = '【驗證用模擬回覆】呢個係測試訊息，唔係真正嘅 Gemini 答案。';
    await writeStorageAndReload(cdp, buildSeed(VERIFY_NOW_MS));
    await disableAnimations(cdp);
    await installGeminiMocks(cdp, reply);
    await click(cdp, { selector: '#btn-home-ask-ai' });
    await waitForText(cdp, '快捷提問');
    await typeText(cdp, { placeholder: '請在此輸入或直接使用語音' }, '午餐食咗叉燒飯，血糖會唔會太高？');
    await click(cdp, { title: '發送提問' });
    await waitForText(cdp, reply);
    const calls = await readGeminiCalls(cdp);
    const chatCalls = calls.filter((c) => String(c.url).includes('/api/gemini/chat'));
    const assertions = {
        mockedReplyVisible: (await visibleText(cdp)).includes(reply),
        userMessageVisible: (await visibleText(cdp)).includes('午餐食咗叉燒飯'),
        mockedCallMade: chatCalls.length >= 1,
        noLiveError: !(await visibleText(cdp)).includes('系統暫時未能完成回覆'),
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`consult assertions failed: ${JSON.stringify({ assertions, calls })}`);
    }
    return {
        name: 'consult-send-mocked',
        ok: true,
        assertions,
        mockedCalls: chatCalls.length,
        steps: [{ name: 'replied', shot: await shot(cdp, shotsDir, 'consult-mocked-reply') }],
    };
}

async function flowStorageRoundTrip(cdp, shotsDir) {
    const seed = buildSeed(VERIFY_NOW_MS);
    await navigate(cdp, BASE_URL);
    await writeStorageAndReload(cdp, seed);
    await disableAnimations(cdp);
    await waitForText(cdp, '陳生');
    const first = await readStorage(cdp);
    const firstProfile = profileFromStorage(first);
    const firstGlucose = glucoseFromStorage(first);
    await click(cdp, { text: '血糖紀錄', withinNav: true });
    await waitForText(cdp, '完成儲存');
    const afterNav = await readStorage(cdp);
    const assertions = {
        profileSurvivedReload: firstProfile.name === '陳生' && firstProfile.age === '72',
        glucoseSurvivedReload: firstGlucose.length === 3,
        largeFontSeeded: first.dia_large_font === 'true',
        keysUnchangedAfterNav: afterNav.dia_profile === first.dia_profile && afterNav.dia_glucose === first.dia_glucose,
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`storage round-trip assertions failed: ${JSON.stringify(assertions)}`);
    }
    return {
        name: 'storage-roundtrip',
        ok: true,
        assertions,
        keys: Object.keys(first).sort(),
        steps: [{ name: 'seeded-home', shot: await shot(cdp, shotsDir, 'storage-seeded-home') }],
    };
}


function parseChatMessage(calls) {
    const chatCalls = (calls || []).filter((c) => String(c.url).includes('/api/gemini/chat'));
    const raw = chatCalls[0]?.body;
    let parsed = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
    return {
        count: chatCalls.length,
        message: parsed && typeof parsed.message === 'string' ? parsed.message : null,
    };
}

async function flowConsultShortcut(cdp, shotsDir) {
    const seed = buildSeed(VERIFY_NOW_MS);
    delete seed.dia_chat_messages;
    await writeStorageAndReload(cdp, seed);
    await disableAnimations(cdp);
    await installGeminiMocks(cdp);
    await click(cdp, { selector: '#btn-home-ask-ai' });
    await waitForText(cdp, '快捷提問');
    await click(cdp, { text: '數據解讀' });
    await waitForText(cdp, '【驗證用模擬回覆】');
    const parsed = parseChatMessage(await readGeminiCalls(cdp));
    const expected = SHORTCUT_TEXTS[0];
    const assertions = {
        mockedReplyVisible: (await visibleText(cdp)).includes('【驗證用模擬回覆】'),
        messageExact: parsed.message === expected,
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`consult-shortcut assertions failed: ${JSON.stringify({ assertions, parsed, expected })}`);
    }
    return {
        name: 'consult-shortcut-request',
        ok: true,
        assertions,
        request: { kind: 'shortcut_data_reading', message: parsed.message },
        steps: [{ name: 'sent', shot: await shot(cdp, shotsDir, 'consult-shortcut') }],
    };
}

async function flowConsultPreference(cdp, shotsDir) {
    const shape = SHAPE_CASES.find((c) => c.id === 'preference');
    const seed = buildSeed(VERIFY_NOW_MS);
    seed.dia_chat_messages = JSON.stringify(shape.messages);
    await writeStorageAndReload(cdp, seed);
    await disableAnimations(cdp);
    await installGeminiMocks(cdp);
    await click(cdp, { selector: '#btn-home-ask-ai' });
    await waitForText(cdp, '【夾具】怕痛');
    await click(cdp, { text: '【夾具】怕痛' });
    await click(cdp, { text: '確認提交我的偏好考量' });
    await waitForText(cdp, '【驗證用模擬回覆】');
    const parsed = parseChatMessage(await readGeminiCalls(cdp));
    const expectedHeader = '我已選擇我的個人偏好（決策考量維度）：';
    const expectedLine = '- 針對「【夾具】偏好問題：打針時你最在意什麼？」，我最看重：【【夾具】怕痛】（價值維度：pain）';
    const assertions = {
        hasHeader: typeof parsed.message === 'string' && parsed.message.startsWith(expectedHeader),
        hasOptionLine: typeof parsed.message === 'string' && parsed.message.includes(expectedLine),
        exact: parsed.message === `${expectedHeader}\n${expectedLine}`,
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`consult-preference assertions failed: ${JSON.stringify({ assertions, parsed })}`);
    }
    return {
        name: 'consult-preference-request',
        ok: true,
        assertions,
        request: { kind: 'preference_submit', message: parsed.message },
        steps: [{ name: 'submitted', shot: await shot(cdp, shotsDir, 'consult-preference') }],
    };
}

async function flowConsultFollowUp(cdp, shotsDir) {
    const shape = SHAPE_CASES.find((c) => c.id === 'comparison-decision');
    const seed = buildSeed(VERIFY_NOW_MS);
    seed.dia_chat_messages = JSON.stringify(shape.messages);
    await writeStorageAndReload(cdp, seed);
    await disableAnimations(cdp);
    await installGeminiMocks(cdp);
    await click(cdp, { selector: '#btn-home-ask-ai' });
    await waitForText(cdp, '【夾具】可見追問-decision');
    await click(cdp, { text: '【夾具】可見追問-decision' });
    await waitForText(cdp, '【驗證用模擬回覆】');
    const parsed = parseChatMessage(await readGeminiCalls(cdp));
    const expected = '【夾具】可見追問-decision';
    const assertions = {
        messageExact: parsed.message === expected,
    };
    if (!Object.values(assertions).every(Boolean)) {
        throw new Error(`consult-followup assertions failed: ${JSON.stringify({ assertions, parsed })}`);
    }
    return {
        name: 'consult-followup-request',
        ok: true,
        assertions,
        request: { kind: 'follow_up', message: parsed.message },
        steps: [{ name: 'sent', shot: await shot(cdp, shotsDir, 'consult-followup') }],
    };
}

async function main() {
    const outDir = process.argv.includes('--out')
        ? process.argv[process.argv.indexOf('--out') + 1]
        : path.join(repoRoot, 'verify-results/latest/flows');
    fs.mkdirSync(outDir, { recursive: true });
    const shotsDir = path.join(outDir, 'shots');

    const health = await fetch(new URL('/api/health', BASE_URL), { signal: AbortSignal.timeout(5000) });
    if (!health.ok) throw new Error(`Dev server health failed: ${health.status}`);

    const chrome = await launchChrome({ port: Number(process.env.VERIFY_FLOW_CDP_PORT || 9224) });
    const cdp = await attachToBlankPage(chrome.port);
    await prepareVerifyCdp(cdp);

    const runners = [
        flowOnboarding,
        flowLargeFont,
        flowGlucoseAddDelete,
        flowSavedQuestions,
        flowMeProfile,
        flowConsultMocked,
        flowConsultShortcut,
        flowConsultPreference,
        flowConsultFollowUp,
        flowStorageRoundTrip,
    ];
    const results = [];
    try {
        for (const run of runners) {
            console.log(`  flow: ${run.name}...`);
            const result = await run(cdp, shotsDir);
            results.push(result);
            writeJson(path.join(outDir, `${result.name}.normalized.json`), result);
            console.log(`  flow: ${result.name} ok`);
        }
        const index = {
            baseUrl: BASE_URL,
            input: 'cdp-pointer-keyboard',
            gemini: 'mocked-in-page-fetch',
            flows: results.map((r) => r.name),
            ok: results.every((r) => r.ok),
        };
        const requests = {};
        for (const result of results) {
            if (result.request && result.request.kind) {
                requests[result.request.kind] = { message: result.request.message };
            }
        }
        if (Object.keys(requests).length) {
            fs.writeFileSync(path.join(outDir, 'requests.normalized.json'), stableStringifyRaw(requests));
        }
        writeJson(path.join(outDir, 'index.json'), index);
        console.log(`Flow captures written to ${outDir}`);
    } finally {
        cdp.close();
        await chrome.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
