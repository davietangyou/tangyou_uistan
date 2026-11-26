/**
 * Compare two verification capture directories.
 * Exits 1 if any normalized artifact differs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function listFiles(dir, acc = [], prefix = '') {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) listFiles(full, acc, rel);
        else acc.push(rel);
    }
    return acc;
}

function isComparable(rel) {
    const base = rel.split('/').pop();
    // Informational reports that are expected to change during a visual
    // restyle, and raw dumps, are not hard-compared.
    if (base === 'visible-inventory.normalized.json') return false;
    if (base === 'audit-summary.normalized.json') return false;
    if (base === 'audit-report.json') return false;
    return rel.endsWith('.normalized.html')
        || rel.endsWith('.normalized.json')
        || rel.endsWith('.text.normalized.txt')
        || rel.endsWith('index.json')
        || rel === 'status.json'
        || (rel.endsWith('.png') && rel.includes('/shots/'));
}

function comparePng(aPath, bPath) {
    const script = path.join(path.dirname(new URL(import.meta.url).pathname), 'lib/compare-png.py');
    const res = spawnSync('python3', [script, aPath, bPath, '--max-mean', '2', '--max-pct', '0.5'], { encoding: 'utf8' });
    let report = {};
    try { report = JSON.parse(res.stdout || '{}'); } catch { report = { ok: false, raw: res.stdout, err: res.stderr }; }
    return { ok: res.status === 0 && report.ok !== false, report, stderr: res.stderr };
}

function main() {
    const baseline = process.argv[2];
    const current = process.argv[3];
    if (!baseline || !current) {
        console.error('Usage: node scripts/verify/compare.mjs <baselineDir> <currentDir>');
        process.exit(2);
    }
    const aFiles = new Set(listFiles(baseline).filter(isComparable));
    const bFiles = new Set(listFiles(current).filter(isComparable));
    const all = [...new Set([...aFiles, ...bFiles])].sort();
    const diffs = [];
    const missing = [];
    for (const rel of all) {
        const aPath = path.join(baseline, rel);
        const bPath = path.join(current, rel);
        if (!fs.existsSync(aPath) || !fs.existsSync(bPath)) {
            missing.push({ file: rel, inBaseline: fs.existsSync(aPath), inCurrent: fs.existsSync(bPath) });
            continue;
        }
        if (rel.endsWith('.png')) {
            const png = comparePng(aPath, bPath);
            if (!png.ok) diffs.push({ file: rel, kind: 'screenshot', ...png.report });
            continue;
        }
        const a = fs.readFileSync(aPath, 'utf8');
        const b = fs.readFileSync(bPath, 'utf8');
        if (rel === 'status.json') {
            const aj = JSON.parse(a);
            const bj = JSON.parse(b);
            const keys = [...new Set([...Object.keys(aj), ...Object.keys(bj)])].filter((k) => aj[k] !== 'skipped' && bj[k] !== 'skipped' && aj[k] !== undefined && bj[k] !== undefined);
            const changed = keys.filter((k) => JSON.stringify(aj[k]) !== JSON.stringify(bj[k]));
            if (changed.length) diffs.push({ file: rel, keys: changed });
            continue;
        }
        if (a !== b) diffs.push(rel);
    }
    const report = { baseline, current, compared: all.length, identical: all.length - diffs.length - missing.length, diffs, missing };
    console.log(JSON.stringify(report, null, 2));
    if (diffs.length || missing.length) {
        for (const rel of diffs) {
            console.error(`\nDIFF ${rel}`);
        }
        process.exit(1);
    }
    console.log('OK: all comparable artifacts match.');
}

main();
