/**
 * Deterministic normalizers for losslessness snapshots.
 * Strips or placeholders time, generated IDs, and volatile SVG geometry
 * so two captures taken on different days can still be compared for
 * structure, copy, and class names.
 */

const DATE_SLASH = /\d{4}\/\d{2}\/\d{2}/g;
const DATE_DASH = /\d{4}-\d{2}-\d{2}/g;
const DATE_ZH = /\d{4}年\d{1,2}月\d{1,2}日/g;
const DOW_ZH = /週[日一二三四五六]/g;
const DOW_EN = /\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/g;
const TIME_HM = /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?\b/g;

export function normalizeText(value) {
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    const period = '起床空腹|早餐前|早餐後 2 小時|午餐前|午餐後 2 小時|晚餐前|晚餐後 2 小時|睡前|夜間|日常隨機|飯前準備|臨睡之前|日常其他時間';
    return value
        .replace(/早安|午安|晚安/g, '<DAYPART>')
        .replace(new RegExp(period, 'g'), '<PERIOD>')
        .replace(DATE_ZH, '<DATE_ZH>')
        .replace(DATE_SLASH, '<DATE>')
        .replace(DATE_DASH, '<DATE>')
        .replace(DOW_ZH, '<DOW>')
        .replace(DOW_EN, '<DOW_EN>')
        .replace(TIME_HM, '<TIME>');
}

export function normalizeDom(html) {
    let s = String(html);
    // Recharts / SVG generated identifiers and geometry
    s = s.replace(/\sid="recharts-[^"]+"/g, ' id="recharts-id"');
    s = s.replace(/\sclipPath="url\(#recharts-[^"]+\)"/g, ' clipPath="url(#recharts-id)"');
    s = s.replace(/url\(#recharts-[^)]+\)/g, 'url(#recharts-id)');
    s = s.replace(/\sid="clipPath-[^"]+"/g, ' id="clipPath-id"');
    s = s.replace(/\sd="[Mm][^"]*"/g, ' d="<path>"');
    // Recharts patch-level presentation churn (not visible copy or geometry).
    // Some 3.x builds add outline style, default fill-opacity, tooltip name=,
    // a duplicate CSS fill, and empty z-index layers; others omit them.
    s = s.replace(/\sstyle="outline:\s*none;?"/g, '');
    s = s.replace(/\sfill-opacity="1"/g, '');
    s = s.replace(/<(circle|path|g|text)\b([^>]*\brecharts-[^>]*)>/g, (m, tag, rest) => {
        return '<' + tag + rest.replace(/\sname="[^"]*"/g, '') + '>';
    });
    s = s.replace(/\sstyle="fill:\s*rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\);?"/g, '');
    s = s.replace(/<g tabindex="-1" class="recharts-zIndex-layer_[^"]*"\s*>\s*<\/g>/g, '');
    // React / vite noise if any leaked in
    s = s.replace(/\sdata-reactroot(?:="")?/g, '');
    s = normalizeText(s);
    s = canonicalizeAttributes(s);
    // Collapse runs of whitespace between tags to make diffs readable
    s = s.replace(/>\s+</g, '>\n<');
    return s.trim() + '\n';
}

/** Sort attributes so Recharts/React attr order is not a false mismatch. */
function canonicalizeAttributes(html) {
    return html.replace(/<([a-zA-Z][\w:-]*)(\s[^>]*?)(\s*\/?)>/g, (all, tag, rawAttrs, close) => {
        const attrs = [];
        const re = /\s+([a-zA-Z_:][\w:.-]*)(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
        let m;
        while ((m = re.exec(rawAttrs))) attrs.push(m[0].trim());
        attrs.sort((a, b) => a.split('=')[0].localeCompare(b.split('=')[0]));
        return '<' + tag + (attrs.length ? ' ' + attrs.join(' ') : '') + close + '>';
    });
}

export function stableStringify(value) {
    return JSON.stringify(sortDeep(value), null, 2) + '\n';
}

function sortDeep(value) {
    if (Array.isArray(value)) return value.map(sortDeep);
    if (value && typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value).sort()) {
            out[key] = sortDeep(value[key]);
        }
        return out;
    }
    if (typeof value === 'string') return normalizeText(value);
    return value;
}
