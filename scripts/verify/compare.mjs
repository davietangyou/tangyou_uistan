/**
 * Compare two verification capture directories.
 * Exits 1 if any normalized artifact differs.
 */
import fs from 'node:fs';
import path from 'node:path';

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
    return rel.endsWith('.normalized.html')
        || rel.endsWith('.normalized.json')
        || rel.endsWith('.text.normalized.txt')
        || rel.endsWith('index.json')
        || rel === 'status.json';
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
        const a = fs.readFileSync(aPath, 'utf8');
        const b = fs.readFileSync(bPath, 'utf8');
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
