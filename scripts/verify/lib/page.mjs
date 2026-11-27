/**
 * Real pointer / keyboard helpers on top of Chrome CDP.
 * Clicks use Input.dispatchMouseEvent at the element's layout box;
 * typing uses focus + Input.insertText. No Playwright dependency.
 */
import { setTimeout as delay } from 'node:timers/promises';
import { evaluate } from './cdp.mjs';

export async function waitForRoot(cdp, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ready = await evaluate(cdp, `Boolean(document.querySelector('#root') && document.querySelector('#root').innerHTML.length > 80)`);
        if (ready) return;
        await delay(150);
    }
    throw new Error('Timed out waiting for #root to render');
}

export async function scrollToTop(cdp) {
    await evaluate(cdp, 'window.scrollTo(0, 0); true');
    await delay(40);
}

export async function settle(cdp, extraMs = 400) {
    await waitForRoot(cdp);
    await evaluate(cdp, `document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true`);
    await scrollToTop(cdp);
    await delay(extraMs);
}

export async function navigate(cdp, url) {
    await cdp.send('Page.navigate', { url });
    await settle(cdp, 600);
}

export async function writeStorageAndReload(cdp, seedOrClear) {
    if (seedOrClear === 'clear') {
        await evaluate(cdp, 'localStorage.clear(); true');
    } else {
        await evaluate(cdp, `(() => {
            localStorage.clear();
            const seed = ${JSON.stringify(seedOrClear)};
            for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
            return true;
        })()`);
    }
    await cdp.send('Page.reload', { ignoreCache: true });
    await settle(cdp, 600);
}

export async function disableAnimations(cdp) {
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }).catch(() => {});
    await evaluate(cdp, `(() => {
        const id = 'ty-verify-no-anim';
        if (document.getElementById(id)) return true;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }';
        document.head.appendChild(style);
        return true;
    })()`);
}

export async function visibleText(cdp) {
    return (await evaluate(cdp, `document.querySelector('#root') ? document.querySelector('#root').innerText : ''`)) || '';
}

export async function waitForText(cdp, needle, timeoutMs = 10000) {
    const start = Date.now();
    let last = '';
    while (Date.now() - start < timeoutMs) {
        last = await visibleText(cdp);
        if (last.includes(needle)) return last;
        await delay(100);
    }
    throw new Error(`Timed out waiting for text ${JSON.stringify(needle)}. Visible: ${last.slice(0, 240)}`);
}

export async function readStorage(cdp) {
    return await evaluate(cdp, `(() => {
        const out = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            out[k] = localStorage.getItem(k);
        }
        return out;
    })()`) || {};
}

function finderExpression({ text, placeholder, title, selector, withinNav }) {
    return `(() => {
        const needle = ${JSON.stringify(text || '')};
        const placeholder = ${JSON.stringify(placeholder || '')};
        const title = ${JSON.stringify(title || '')};
        const selector = ${JSON.stringify(selector || '')};
        const scope = ${withinNav ? "document.querySelector('nav') || document" : 'document'};
        let el = null;
        if (selector) {
            el = scope.querySelector(selector);
        } else if (placeholder) {
            el = [...scope.querySelectorAll('input, textarea')].find((e) => (e.getAttribute('placeholder') || '').includes(placeholder));
        } else if (title) {
            el = [...scope.querySelectorAll('[title], button, [role="button"]')].find((e) => (e.getAttribute('title') || '').includes(title));
        } else if (needle) {
            el = [...scope.querySelectorAll('button, [role="button"], label, a, [class*="cursor-pointer"]')].find((e) => (e.innerText || e.textContent || '').replace(/\\s+/g, ' ').includes(needle));
        }
        if (!el) {
            return { ok: false, reason: 'not-found', visible: (document.querySelector('#root')?.innerText || '').slice(0, 200) };
        }
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const nav = document.querySelector('nav');
        const inNav = Boolean(nav && nav.contains(el));
        const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight;
        const safeBottom = Math.min(navTop - 8, window.innerHeight - 24);
        const headerBottom = 8;
        let r = el.getBoundingClientRect();
        if (!inNav && (r.bottom > safeBottom || r.top < headerBottom)) {
            const desired = Math.max(headerBottom + 12, Math.min(r.top, safeBottom - r.height - 12));
            window.scrollBy(0, r.top - desired);
            r = el.getBoundingClientRect();
        }
        if (r.width < 2 || r.height < 2) {
            return { ok: false, reason: 'zero-size', visible: (el.innerText || '').slice(0, 80) };
        }
        const x = r.x + r.width / 2;
        const y = r.y + r.height / 2;
        // Occlusion is a UX finding (advisory --ui), not a reason to refuse the click.
        const covered = !inNav && (y > safeBottom || y < headerBottom);
        return { ok: true, x, y, w: r.width, h: r.height, tag: el.tagName, inNav, covered };
    })()`;
}

/** Click targets that were under fixed header/bottom bar (reported by --ui). */
export const coveredClicks = [];

export async function click(cdp, target) {
    let box = await evaluate(cdp, finderExpression(target));
    if (!box?.ok) {
        await delay(200);
        box = await evaluate(cdp, finderExpression(target));
    }
    if (!box?.ok) {
        throw new Error(`click target not found: ${JSON.stringify(target)} ${JSON.stringify(box)}`);
    }
    if (box.covered) {
        coveredClicks.push(target);
        console.warn(`  [ux] click target may be covered by fixed chrome: ${JSON.stringify(target)}`);
    }
    await delay(80);
    const { x, y } = box;
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await delay(80);
    return box;
}

async function keyEvent(cdp, type, key, code, nativeVirtualKeyCode, modifiers = 0) {
    await cdp.send('Input.dispatchKeyEvent', {
        type,
        key,
        code,
        windowsVirtualKeyCode: nativeVirtualKeyCode,
        nativeVirtualKeyCode,
        modifiers,
    });
}

export async function typeText(cdp, target, value, { clear = true } = {}) {
    await click(cdp, target);
    await delay(60);
    if (clear) {
        // Control+A then Backspace
        await keyEvent(cdp, 'keyDown', 'a', 'KeyA', 65, 2);
        await keyEvent(cdp, 'keyUp', 'a', 'KeyA', 65, 2);
        await keyEvent(cdp, 'keyDown', 'Backspace', 'Backspace', 8);
        await keyEvent(cdp, 'keyUp', 'Backspace', 'Backspace', 8);
        await delay(40);
    }
    if (value) {
        await cdp.send('Input.insertText', { text: String(value) });
    }
    // Fire input/change for any listeners that miss insertText (number inputs).
    await evaluate(cdp, `(() => {
        const placeholder = ${JSON.stringify(target.placeholder || '')};
        const selector = ${JSON.stringify(target.selector || '')};
        const el = selector
            ? document.querySelector(selector)
            : placeholder
                ? [...document.querySelectorAll('input, textarea')].find((e) => (e.getAttribute('placeholder') || '').includes(placeholder))
                : document.activeElement;
        if (!el) return false;
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, ${JSON.stringify(String(value))});
        else el.value = ${JSON.stringify(String(value))};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    })()`);
    await delay(60);
}

export async function installGeminiMocks(cdp, chatReply = '【驗證用模擬回覆】呢個係測試訊息，唔係真正嘅 Gemini 答案。') {
    return evaluate(cdp, `(() => {
        if (window.__verifyGeminiPatched) return window.__verifyGeminiCalls.length;
        window.__verifyGeminiCalls = [];
        window.__verifyGeminiPatched = true;
        const orig = window.fetch.bind(window);
        window.fetch = async (input, init = {}) => {
            const url = typeof input === 'string' ? input : (input && input.url) || '';
            if (String(url).includes('/api/gemini/')) {
                const body = init && init.body ? String(init.body) : '';
                window.__verifyGeminiCalls.push({ url: String(url), method: (init && init.method) || 'GET', body });
                const json = String(url).includes('/api/gemini/chat')
                    ? { reply: ${JSON.stringify(chatReply)}, suggestedFollowUps: [], optionsComparison: [], doctorQuestions: [] }
                    : String(url).includes('/api/gemini/analyze-saved-questions')
                        ? { summary: '驗證用摘要', recommendedQuestions: [] }
                        : { ok: true };
                return new Response(JSON.stringify(json), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return orig(input, init);
        };
        return 0;
    })()`);
}

export async function readGeminiCalls(cdp) {
    return (await evaluate(cdp, `window.__verifyGeminiCalls ? JSON.parse(JSON.stringify(window.__verifyGeminiCalls)) : []`)) || [];
}

export async function screenshot(cdp, filePath, { resetScroll = true } = {}) {
    if (resetScroll) await scrollToTop(cdp);
    const result = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
    });
    const { writeFileSync } = await import('node:fs');
    writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

export function parseJson(raw, fallback) {
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
}
