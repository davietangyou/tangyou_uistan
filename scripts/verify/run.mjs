/**
 * Orchestrates a verification capture.
 *
 *   node scripts/verify/run.mjs --out verify-results/baseline
 *   node scripts/verify/run.mjs --out verify-results/phase-N --compare verify-results/baseline
 *
 * Steps: lint, (optional) build, logic/contract snapshot, DOM snapshot if
 * the dev server is reachable. Does not call Gemini and does not mutate app source.
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
const compareRoot = process.argv.includes('--compare') ? path.resolve(repoRoot, argValue('--compare')) : null;
const skipBuild = process.argv.includes('--skip-build');
const skipDom = process.argv.includes('--skip-dom');
fs.mkdirSync(outRoot, { recursive: true });

console.log(`\n=== verify lint ===`);
const lint = await run('npm', ['run', 'lint']);
fs.writeFileSync(path.join(outRoot, 'lint.txt'), `exit=${lint.code}\n${lint.stdout}\n${lint.stderr}`);
if (lint.code !== 0) {
    console.error('lint failed');
    process.exit(lint.code);
}

if (!skipBuild) {
    console.log(`\n=== verify build ===`);
    const build = await run('npm', ['run', 'build']);
    fs.writeFileSync(path.join(outRoot, 'build.txt'), `exit=${build.code}\n${build.stdout}\n${build.stderr}`);
    if (build.code !== 0) {
        console.error('build failed');
        process.exit(build.code);
    }
}

console.log(`\n=== verify logic ===`);
const logicDir = path.join(outRoot, 'logic');
const logic = await run('node', ['--import', 'tsx', 'scripts/verify/capture-logic.mjs', '--out', logicDir]);
if (logic.code !== 0) process.exit(logic.code);

const healthUrl = (process.env.VERIFY_BASE_URL || 'http://127.0.0.1:9002/').replace(/\/?$/, '/api/health');
const domDir = path.join(outRoot, 'dom');
if (!skipDom && await serverUp(healthUrl)) {
    console.log(`\n=== verify DOM ===`);
    const dom = await run('node', ['scripts/verify/capture-dom.mjs', '--out', domDir]);
    if (dom.code !== 0) process.exit(dom.code);
} else if (!skipDom) {
    console.warn(`Dev server not reachable at ${healthUrl}; skipping DOM capture.`);
    fs.writeFileSync(path.join(outRoot, 'dom-skipped.txt'), `Dev server not reachable at ${healthUrl}\n`);
} else {
    console.log('Skipping DOM capture (--skip-dom).');
}

const status = {
    lint: lint.code,
    build: skipBuild ? 'skipped' : 0,
    logic: logic.code,
    dom: skipDom ? 'skipped' : (fs.existsSync(path.join(outRoot, 'dom', 'index.json')) ? 0 : 'missing'),
};
fs.writeFileSync(path.join(outRoot, 'status.json'), JSON.stringify(status, null, 2) + '\n');

if (compareRoot) {
    console.log(`\n=== verify compare vs ${compareRoot} ===`);
    const cmp = await run('node', ['scripts/verify/compare.mjs', compareRoot, outRoot]);
    fs.writeFileSync(path.join(outRoot, 'compare.json'), cmp.stdout || '');
    if (cmp.code !== 0) process.exit(cmp.code);
}

console.log(`\nVerification artifacts: ${outRoot}`);
