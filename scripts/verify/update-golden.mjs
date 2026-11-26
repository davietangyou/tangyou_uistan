/**
 * Copy contract snapshots from a verify output dir into fixtures/golden.
 * Usage: node scripts/verify/update-golden.mjs verify-results/ui-baseline
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLDEN_CONTRACTS } from './compare-golden.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const srcRoot = path.resolve(process.argv[2] || '');
if (!srcRoot || !fs.existsSync(srcRoot)) {
    console.error('Usage: node scripts/verify/update-golden.mjs <verifyOutDir>');
    process.exit(2);
}
const destRoot = path.join(repoRoot, 'scripts/verify/fixtures/golden');
fs.mkdirSync(destRoot, { recursive: true });
for (const item of GOLDEN_CONTRACTS) {
    const src = path.join(srcRoot, item.out);
    if (!fs.existsSync(src)) {
        console.error(`missing ${item.out} in ${srcRoot}`);
        process.exit(1);
    }
    const dest = path.join(destRoot, item.golden);
    fs.copyFileSync(src, dest);
    console.log(`updated ${item.golden}`);
}
