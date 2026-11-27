/**
 * verify = business hard gate (does not lock the UI). See README.md.
 *
 *   npm run verify                         lint + build + node layer + browser smoke + goldens
 *   npm run verify -- --skip-build         same without build (fast iteration)
 *   npm run verify -- --no-browser         lint (+build) + node layer only; no dev server needed
 *   npm run verify -- --ui [--ui-strict]   + advisory UI layer (DOM snapshots, copy inventory, audits)
 *   ... --compare <dir>                    + DOM/screenshot diff vs an earlier --ui run (advisory)
 *
 * The smoke needs the dev server (VERIFY_BASE_URL, default :9002) and fails
 * when it is unreachable. Gemini is mocked in the browser; no real AI call.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function argValue(flag, fallback) {
    const idx = process.argv.indexOf(flag);
    return idx >= 0 ? process.argv[idx + 1] : fallback;
}

function run(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString(); process.stdout.write(d); });
        child.stderr.on('data', (d) => { stderr += d.toString(); process.stderr.write(d); });
        child.on('close', (code) => resolve({ code, stdout, stderr }));
        child.on('error', reject);
    });
}

async function serverUp(url) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
}

const outRoot = path.resolve(repoRoot, argValue('--out', 'verify-results/latest'));
const has = (f) => process.argv.includes(f);
const compareRoot = has('--compare') ? path.resolve(repoRoot, argValue('--compare')) : null;
const skipBuild = has('--skip-build');
const noBrowser = has('--no-browser');
const skipSmoke = has('--skip-smoke') || has('--skip-flows');
const uiStrict = has('--ui-strict');
const withUi = has('--ui') || uiStrict || Boolean(compareRoot);
const skipGolden = has('--skip-golden');
for (const [old, note] of [['--skip-dom', 'DOM snapshots are no longer in the default gate (only with --ui)'], ['--skip-ui', 'the UI inventory/audit is no longer in the default gate (only with --ui)'], ['--skip-flows', 'renamed to --skip-smoke']]) {
    if (has(old)) console.warn(`[deprecated] ${old}: ${note}. This flag will be removed next round.`);
}
fs.mkdirSync(outRoot, { recursive: true });
const t0 = Date.now();
const timings = {};
async function step(name, fn) {
    const t = Date.now();
    const r = await fn();
    timings[name] = Date.now() - t;
    return r;
}
function gate(name, res) {
    if (res.code !== 0) {
        console.error(`verify: ${name} failed`);
        fs.writeFileSync(path.join(outRoot, 'status.json'), JSON.stringify({ failed: name, timingsMs: timings }, null, 2) + '\n');
        process.exit(res.code || 1);
    }
}

console.log(`\n=== verify lint ===`);
const lint = await step('lint', () => run('npm', ['run', 'lint']));
fs.writeFileSync(path.join(outRoot, 'lint.txt'), `exit=${lint.code}\n${lint.stdout}\n${lint.stderr}`);
gate('lint', lint);

if (!skipBuild) {
    console.log(`\n=== verify build ===`);
    const build = await step('build', () => run('npm', ['run', 'build']));
    fs.writeFileSync(path.join(outRoot, 'build.txt'), `exit=${build.code}\n${build.stdout}\n${build.stderr}`);
    gate('build', build);
}

console.log(`\n=== verify node layer: logic, contracts, domain, source hygiene ===`);
const tz = { env: { ...process.env, TZ: 'Asia/Hong_Kong' } };
const [logic, contracts, domain, source] = await step('node', () => Promise.all([
    run('node', ['--import', 'tsx', 'scripts/verify/capture-logic.mjs', '--out', path.join(outRoot, 'logic')]),
    run('node', ['--import', 'tsx', 'scripts/verify/capture-contracts.mjs', '--out', path.join(outRoot, 'contracts')]),
    run('node', ['--import', 'tsx', 'scripts/verify/capture-domain.mjs', '--out', path.join(outRoot, 'domain')], tz),
    run('node', ['scripts/verify/check-source.mjs', '--out', path.join(outRoot, 'source')]),
]));
gate('logic', logic);
gate('contracts', contracts);
gate('domain', domain);
gate('source', source);

const baseUrl = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/';
const healthUrl = baseUrl.replace(/\/?$/, '/api/health');
const browserWanted = !noBrowser && (!skipSmoke || withUi);
const up = browserWanted ? await serverUp(healthUrl) : false;
if (browserWanted && !up) {
    console.error(`verify: dev server not reachable at ${healthUrl}. Start it (see README) or run with --no-browser (UI wiring then NOT covered).`);
    fs.writeFileSync(path.join(outRoot, 'status.json'), JSON.stringify({ failed: 'dev-server-unreachable', healthUrl, timingsMs: timings }, null, 2) + '\n');
    process.exit(1);
}

let smoke = { code: 'skipped' };
if (noBrowser) {
    console.warn('\n[warning] --no-browser: the browser smoke did not run. UI wiring (does a tap reach the business layer?) is NOT covered.');
} else if (skipSmoke) {
    console.warn('\n[warning] --skip-smoke: the browser smoke did not run.');
} else {
    console.log(`\n=== verify smoke (browser, data-verify hooks, mocked Gemini) ===`);
    smoke = await step('smoke', () => run('node', ['scripts/verify/capture-smoke.mjs', '--out', path.join(outRoot, 'smoke')]));
    gate('smoke', smoke);
}

if (!skipGolden) {
    console.log(`\n=== verify compare vs committed goldens ===`);
    const golden = await step('golden', () => run('node', ['scripts/verify/compare-golden.mjs', outRoot, ...(noBrowser || skipSmoke ? ['--no-browser'] : [])]));
    fs.writeFileSync(path.join(outRoot, 'golden-compare.json'), golden.stdout || '');
    gate('golden', golden);
}

const advisory = {};
if (withUi && up) {
    console.log(`\n=== verify --ui (advisory: DOM snapshots, visible copy, touch/contrast audit) ===`);
    const dom = await step('ui-dom', () => run('node', ['scripts/verify/capture-dom.mjs', '--out', path.join(outRoot, 'dom')]));
    advisory.dom = dom.code;
    const ui = await step('ui-audit', () => run('node', ['scripts/verify/capture-ui.mjs', '--out', path.join(outRoot, 'ui')]));
    advisory.ui = ui.code;
    if (compareRoot) {
        console.log(`\n=== verify --ui compare vs ${compareRoot} ===`);
        const cmp = await step('ui-compare', () => run('node', ['scripts/verify/compare.mjs', compareRoot, outRoot]));
        fs.writeFileSync(path.join(outRoot, 'compare.json'), cmp.stdout || '');
        advisory.compare = cmp.code;
    }
    const bad = Object.entries(advisory).filter(([, c]) => c !== 0);
    if (bad.length) console.warn(`[advisory] --ui findings in: ${bad.map(([k]) => k).join(', ')} (see ${outRoot}/ui, dom).${uiStrict ? '' : ' Not gating.'}`);
}

const status = {
    lint: lint.code,
    build: skipBuild ? 'skipped' : 0,
    logic: logic.code,
    contracts: contracts.code,
    domain: domain.code,
    source: source.code,
    smoke: smoke.code,
    advisory: withUi ? advisory : 'not-run',
    totalMs: Date.now() - t0,
    timingsMs: timings,
};
fs.writeFileSync(path.join(outRoot, 'status.json'), JSON.stringify(status, null, 2) + '\n');
if (uiStrict && Object.values(advisory).some((c) => c !== 0)) {
    console.error('verify: --ui-strict and the advisory layer reported failures');
    process.exit(1);
}
console.log(`\nverify OK in ${((Date.now() - t0) / 1000).toFixed(1)} s${noBrowser || skipSmoke ? ' (browser smoke NOT run)' : ''}. Artifacts: ${outRoot}`);
