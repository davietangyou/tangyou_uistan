/** In-page touch-target and contrast auditor. Reports only; does not throw. */
export const AUDIT_SCRIPT = `(() => {
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
        return { r: 251, g: 251, b: 250, a: 1 };
    }
    const large = Boolean(document.querySelector('.large-font'));
    const minTouch = large ? 56 : 48;
    const clickables = [...document.querySelectorAll('button, a, [role="button"], input, select, textarea, label')];
    const touch = clickables.map((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return null;
        if (r.width < 1 && r.height < 1) return null;
        const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
        return {
            tag: el.tagName.toLowerCase(),
            text,
            w: Math.round(r.width),
            h: Math.round(r.height),
            below: r.height + 0.01 < minTouch,
        };
    }).filter(Boolean);

    const textEls = [...document.querySelectorAll('#root p, #root span, #root h1, #root h2, #root h3, #root h4, #root li, #root button, #root label, #root td, #root th, #root a, #root div')];
    const contrastIssues = [];
    const seen = new Set();
    for (const el of textEls) {
        if (el.children.length > 3) continue;
        const text = (el.childNodes && [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('') || '').replace(/\\s+/g, ' ').trim();
        if (text.length < 2) continue;
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
            const key = text.slice(0, 40) + '|' + ratio.toFixed(2);
            if (seen.has(key)) continue;
            seen.add(key);
            contrastIssues.push({
                text: text.slice(0, 80),
                ratio: Math.round(ratio * 100) / 100,
                min,
                fontSize: Math.round(fontSize),
                color: 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')',
            });
        }
    }

    const tel = [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
    return {
        largeFont: large,
        minTouch,
        touchCount: touch.length,
        touchBelow: touch.filter((t) => t.below),
        contrastIssues,
        telHrefs: tel,
    };
})()`;
