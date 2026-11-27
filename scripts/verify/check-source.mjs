/**
 * Source hygiene for the UI layer (node only, ~0.1 s). A UI rewrite may move
 * and restyle anything, but it must keep going through the business layer:
 *
 *  1. Persisted data: `localStorage` / `sessionStorage` are touched only by
 *     domain/storage.ts (every dia_* read/write goes through domain/*).
 *  2. Network: `fetch(` appears only in services/, server/ and cloudflare/
 *     (UI code calls services/geminiService.ts, never the API directly).
 *  3. The /api/gemini/ path literal appears only in services/ and server/.
 *
 * Comments are ignored. Writes source-hygiene.json; exits 1 on a violation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const SKIP = new Set(['node_modules', 'dist', '.git', 'verify-results', 'scripts', '.wrangler', '.vite', '__harness']);

function files(dir, acc = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) files(full, acc);
        else if (/\.(ts|tsx|js|mjs|jsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) acc.push(path.relative(repoRoot, full));
    }
    return acc;
}
function stripComments(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}
const RULES = [
    { id: 'storage-only-in-domain', re: /\b(localStorage|sessionStorage)\s*\./g, allow: (f) => f === 'domain/storage.ts' },
    { id: 'fetch-only-in-services-server', re: /(^|[^.\w])fetch\s*\(/g, allow: (f) => /^(services|server|cloudflare)\//.test(f) || f === 'server.ts' },
    { id: 'gemini-path-only-in-services-server', re: /['"`]\/api\/gemini\//g, allow: (f) => /^(services|server)\//.test(f) },
];
const violations = [];
const scanned = files(repoRoot).sort();
for (const f of scanned) {
    const lines = stripComments(fs.readFileSync(path.join(repoRoot, f), 'utf8')).split('\n');
    for (const rule of RULES) {
        if (rule.allow(f)) continue;
        lines.forEach((line, i) => { if (new RegExp(rule.re.source).test(line)) violations.push({ rule: rule.id, file: f, line: i + 1, text: line.trim().slice(0, 120) }); });
    }
}
const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : path.join(repoRoot, 'verify-results/latest/source');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'source-hygiene.json'), JSON.stringify({ ok: violations.length === 0, rules: RULES.map((r) => r.id), scannedFiles: scanned.length, violations }, null, 2) + '\n');
if (violations.length) {
    console.error('source hygiene violations:\n' + violations.map((v) => `  ${v.rule}: ${v.file}:${v.line} ${v.text}`).join('\n'));
    process.exit(1);
}
console.log(`source hygiene ok (${scanned.length} files)`);
