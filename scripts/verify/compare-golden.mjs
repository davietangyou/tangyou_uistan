/**
 * Compare contract snapshots in a verify output dir against committed goldens.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

export const GOLDEN_CONTRACTS = [
    { out: 'logic/logic.normalized.json', golden: 'logic.normalized.json' },
    { out: 'contracts/locked-copy.normalized.json', golden: 'locked-copy.normalized.json' },
    { out: 'contracts/option-values.normalized.json', golden: 'option-values.normalized.json' },
    { out: 'domain/domain.normalized.json', golden: 'domain.normalized.json' },
    // browser smoke (skipped with --no-browser)
    { out: 'smoke/requests.normalized.json', golden: 'requests.normalized.json', browser: true },
    { out: 'smoke/shapes.normalized.json', golden: 'shapes.normalized.json', browser: true },
    { out: 'smoke/smoke.normalized.json', golden: 'smoke.normalized.json', browser: true },
];

export function compareGolden(outRoot, { allowMissingOut = false, noBrowser = false } = {}) {
    const goldenRoot = path.join(repoRoot, 'scripts/verify/fixtures/golden');
    const diffs = [];
    const missing = [];
    const skipped = [];
    for (const item of GOLDEN_CONTRACTS) {
        if (noBrowser && item.browser) {
            skipped.push({ file: item.out, reason: 'no-browser' });
            continue;
        }
        const aPath = path.join(goldenRoot, item.golden);
        const bPath = path.join(outRoot, item.out);
        if (!fs.existsSync(aPath)) {
            skipped.push({ file: item.golden, reason: 'no-golden-yet' });
            continue;
        }
        if (!fs.existsSync(bPath)) {
            if (allowMissingOut) skipped.push({ file: item.out, reason: 'output-not-produced' });
            else missing.push({ file: item.out, inGolden: true, inCurrent: false });
            continue;
        }
        const a = fs.readFileSync(aPath, 'utf8');
        const b = fs.readFileSync(bPath, 'utf8');
        if (a !== b) diffs.push(item.out);
    }
    return { diffs, missing, skipped, ok: diffs.length === 0 && missing.length === 0 };
}

function main() {
    const outRoot = process.argv[2];
    if (!outRoot) {
        console.error('Usage: node scripts/verify/compare-golden.mjs <verifyOutDir>');
        process.exit(2);
    }
    const report = compareGolden(path.resolve(outRoot), { noBrowser: process.argv.includes('--no-browser') });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exit(1);
    console.log('OK: contract goldens match.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('compare-golden.mjs')) {
    main();
}
