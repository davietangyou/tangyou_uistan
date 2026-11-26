/**
 * Render the design-system specimen (not in the app router) and check
 * typography, touch targets, and contrast in standard and large-font modes.
 *
 *   node scripts/verify/capture-uikit.mjs --out /workspace/ui-refactor-work/baselines/uikit
 *
 * Requires the dev server on VERIFY_BASE_URL (default http://127.0.0.1:9002/).
 * This script is not part of `npm run verify`, so Stage 1 goldens stay untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {attachToBlankPage, evaluate, launchChrome} from './lib/cdp.mjs';
import {prepareVerifyCdp} from './lib/prepareCdp.mjs';
import {disableAnimations} from './lib/page.mjs';
import {setTimeout as delay} from 'node:timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const BASE_URL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';

function argValue(flag, fallback) {
    const idx = process.argv.indexOf(flag);
    return idx >= 0 ? process.argv[idx + 1] : fallback;
}

const outRoot = path.resolve(argValue('--out', path.join(repoRoot, 'verify-results/uikit')));
const widths = (argValue('--widths', '430,320')).split(',').map((w) => Number(w.trim())).filter(Boolean);

const LEGACY_CSS_SHA256 = 'b864594f30dc4a8fcc526161c3b185e40c3cfbb84e0243c824e8ed8e7e2da29e';

const AUDIT = `(() => {
    function lum(c) {
        const a = [c.r, c.g, c.b].map((v) => {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    function contrast(a, b) {
        const la = lum(a), lb = lum(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }
    function parseColor(s) {
        if (!s || s === 'transparent') return null;
        const m = String(s).match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([0-9.]+))?/i);
        if (!m) return null;
        const a = m[4] == null ? 1 : Number(m[4]);
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
    }
    function bgOf(el) {
        let n = el;
        while (n && n !== document.documentElement) {
            const bg = parseColor(getComputedStyle(n).backgroundColor);
            if (bg && bg.a > 0.08) return bg;
            n = n.parentElement;
        }
        return { r: 245, g: 245, b: 239, a: 1 };
    }
    function auditRoot(root, minTouch) {
        const clickables = [...root.querySelectorAll('button, a, [role="button"], [role="radio"], input, select, textarea')];
        const touch = clickables.map((el) => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return null;
            if (r.width < 1 && r.height < 1) return null;
            const text = (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
            return {
                tag: el.tagName.toLowerCase(),
                text,
                w: Math.round(r.width),
                h: Math.round(r.height),
                below: r.height + 0.01 < minTouch,
            };
        }).filter(Boolean);

        const textEls = [...root.querySelectorAll('p, span, h1, h2, h3, li, button, label, div')];
        const contrastIssues = [];
        const seen = new Set();
        for (const el of textEls) {
            if (el.children.length > 3) continue;
            const raw = (el.childNodes && [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('') || '').replace(/\\s+/g, ' ').trim();
            if (raw.length < 2) continue;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const color = parseColor(style.color);
            if (!color) continue;
            const bg = bgOf(el);
            const ratio = contrast(color, bg);
            const fontSize = parseFloat(style.fontSize) || 16;
            const weight = parseInt(style.fontWeight, 10) || 400;
            const largeText = fontSize >= 24 || (fontSize >= 19 && weight >= 700);
            const min = largeText ? 3 : 4.5;
            if (ratio + 0.01 < min) {
                const key = raw.slice(0, 40) + '|' + ratio.toFixed(2);
                if (seen.has(key)) continue;
                seen.add(key);
                contrastIssues.push({
                    text: raw.slice(0, 80),
                    ratio: Math.round(ratio * 100) / 100,
                    min,
                    fontSize: Math.round(fontSize),
                    color: 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')',
                });
            }
        }

        const type = {};
        for (const node of root.querySelectorAll('[data-type]')) {
            const key = node.getAttribute('data-type');
            const sample = node.querySelector('[data-type-sample]') || node.lastElementChild || node;
            const style = getComputedStyle(sample);
            type[key] = { fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight };
        }

        return {
            touchBelow: touch.filter((t) => t.below),
            touchCount: touch.length,
            contrastIssues,
            type,
        };
    }

    const standard = document.getElementById('kit-standard');
    const large = document.getElementById('kit-large');
    return {
        standard: standard ? auditRoot(standard, 48) : null,
        large: large ? auditRoot(large, 56) : null,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
})()`;

function checkLegacyCssPrefix() {
    const css = fs.readFileSync(path.join(repoRoot, 'public/styles/app.css'));
    const prefix = css.subarray(0, 4550);
    const sha = createHash('sha256').update(prefix).digest('hex');
    if (sha !== LEGACY_CSS_SHA256) {
        throw new Error(`Legacy app.css prefix changed (sha256 ${sha}, expected ${LEGACY_CSS_SHA256})`);
    }
    if (!css.includes('--c-ink') || !css.includes('--t-body') || !css.includes('.ds-btn')) {
        throw new Error('Design-system tokens or classes missing from app.css');
    }
    return {bytes: 4550, sha256: sha, totalBytes: css.length};
}

const EXPECTED_TYPE = {
    standard: {
        caption: 14, body: 16, 'body-strong': 16, label: 17,
        title: 20, h2: 24, h1: 28, display: 44,
    },
    large: {
        caption: 16, body: 19, 'body-strong': 19, label: 20,
        title: 24, h2: 28, h1: 32, display: 52,
    },
};

async function screenshotSection(cdp, selector, filePath) {
    const box = await evaluate(cdp, `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({ block: 'start' });
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()`);
    if (!box) throw new Error(`Missing section ${selector}`);
    await delay(120);
    // Re-read after scroll; clip is in CSS viewport coordinates.
    const clip = await evaluate(cdp, `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        const r = el.getBoundingClientRect();
        return {
            x: Math.max(0, r.x),
            y: Math.max(0, r.y),
            width: r.width,
            height: Math.min(r.height, window.innerHeight),
            fullHeight: r.height,
        };
    })()`);
    // Full-section shot via beyond-viewport after scrolling the section to top.
    await evaluate(cdp, `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
        return true;
    })()`);
    await delay(80);
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const content = metrics.contentSize || metrics.cssContentSize || {width: 430, height: 900};
    const result = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: {
            x: 0,
            y: (await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top + window.scrollY`)),
            width: Math.ceil(content.width || 430),
            height: Math.ceil(clip.fullHeight),
            scale: 1,
        },
    });
    fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

async function main() {
    fs.mkdirSync(outRoot, {recursive: true});
    const prefix = checkLegacyCssPrefix();

    const health = await fetch(new URL('/api/health', BASE_URL)).then((r) => r.ok).catch(() => false);
    if (!health) {
        throw new Error(`Dev server not reachable at ${BASE_URL}`);
    }

    // Confirm the specimen is served as itself, not the SPA shell.
    const html = await fetch(new URL('/scripts/verify/fixtures/uikit.html', BASE_URL)).then((r) => r.text());
    if (!html.includes('uikit-main.tsx') || html.includes('糖友導航 - 老友記')) {
        throw new Error('uikit.html was not served (SPA fallback?). Vite must serve the fixture file.');
    }

    const chrome = await launchChrome({port: 9225, width: 430, height: 900});
    const report = {prefix, widths: {}, issues: []};
    try {
        const cdp = await attachToBlankPage(chrome.port);
        for (const width of widths) {
            await prepareVerifyCdp(cdp, {width, height: 900, deviceScaleFactor: 1});
            await cdp.send('Page.navigate', {url: new URL('/scripts/verify/fixtures/uikit.html', BASE_URL).href});
            const start = Date.now();
            let ready = false;
            while (Date.now() - start < 20000) {
                ready = await evaluate(cdp, `Boolean(document.getElementById('kit-standard') && document.getElementById('kit-large') && document.getElementById('kit-standard').innerText.includes('標準字'))`);
                if (ready) break;
                await delay(150);
            }
            if (!ready) throw new Error(`UiKit did not render at width ${width}`);
            await disableAnimations(cdp);
            await evaluate(cdp, `document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true`);
            await delay(400);

            const audit = await evaluate(cdp, AUDIT);
            const dir = path.join(outRoot, `w${width}`);
            fs.mkdirSync(dir, {recursive: true});
            await screenshotSection(cdp, '#kit-standard', path.join(dir, 'standard.png'));
            await screenshotSection(cdp, '#kit-large', path.join(dir, 'large.png'));

            for (const mode of ['standard', 'large']) {
                const expected = EXPECTED_TYPE[mode];
                const actual = audit[mode]?.type || {};
                for (const [role, px] of Object.entries(expected)) {
                    const got = actual[role]?.fontSize;
                    if (got == null || Math.abs(got - px) > 0.6) {
                        report.issues.push(`${width} ${mode} type ${role}: expected ${px}px, got ${got}`);
                    }
                }
                const below = audit[mode]?.touchBelow || [];
                if (below.length) {
                    report.issues.push(`${width} ${mode} touch targets below minimum: ${JSON.stringify(below)}`);
                }
                const contrastIssues = audit[mode]?.contrastIssues || [];
                // Swatch labels use 12px on colored chips; skip those token names if any slip in.
                const real = contrastIssues.filter((c) => !TOKEN_NAME_RE.test(c.text));
                if (real.length) {
                    report.issues.push(`${width} ${mode} contrast: ${JSON.stringify(real)}`);
                }
            }
            if (audit.overflowX) {
                report.issues.push(`${width} horizontal overflow`);
            }
            report.widths[width] = audit;
        }
        await cdp.close();
    } finally {
        await chrome.close();
    }

    fs.writeFileSync(path.join(outRoot, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
    if (report.issues.length) {
        console.error('UiKit audit failed:\n' + report.issues.join('\n'));
        process.exit(1);
    }
    console.log(`UiKit capture ok → ${outRoot}`);
    console.log(JSON.stringify({prefix, widths: Object.keys(report.widths), issues: 0}, null, 2));
}

const TOKEN_NAME_RE = /^(canvas|surface|muted|ink|ink-2|ink-3|sage-100|sage-200|sage-700|lavender|mist|butter|legacy|low|target|high)$/;

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
