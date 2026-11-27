/**
 * Source-only contract snapshots: locked copy (must still exist in source)
 * and option values that get stored / injected into AI context.
 * Does not launch Chrome and does not call Gemini.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stableStringifyRaw } from './lib/normalize.mjs';
import { LOCKED_COPY_SOURCES } from './lib/lockedCopy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function readRepo(rel) {
    return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

// Verify slim P2 (owner decision 1): copy in consultText.ts (the text sent to
// the AI) stays pinned to that file; every other locked line must still be
// present word for word, but may live in any UI / domain source file.
const PINNED_FILE = 'views/ConsultView/consultText.ts';
function sourceFiles(dir, acc = []) {
    for (const e of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) sourceFiles(rel, acc);
        else if (/\.(ts|tsx)$/.test(e.name)) acc.push(rel);
    }
    return acc;
}
function extractLockedCopy() {
    const items = [];
    const missing = [];
    const anywhere = ['views', 'components', 'domain'].flatMap((d) => sourceFiles(d)).map(readRepo).join('\n');
    for (const entry of LOCKED_COPY_SOURCES) {
        const pinned = entry.file === PINNED_FILE;
        const found = entry.pattern.test(pinned ? readRepo(entry.file) : anywhere);
        items.push({ id: entry.id, value: entry.value, foundIn: pinned ? 'consultText.ts' : 'anywhere', foundInSource: found });
        if (!found) missing.push(entry.id);
    }
    return {
        ok: missing.length === 0,
        missing,
        items,
    };
}

async function collectOptionValues() {
    const glucose = await import(path.join(repoRoot, 'views/GlucoseView/constants.ts'));
    const utils = await import(path.join(repoRoot, 'utils/constants.ts'));
    const exercise = await import(path.join(repoRoot, 'domain/exercise.ts'));
    const options = await import(path.join(repoRoot, 'domain/options.ts'));

    const periodOptions = glucose.PERIOD_OPTIONS.map((p) => ({
        id: p.id,
        label: p.label,
        timeType: p.timeType,
        mealTag: p.mealTag ?? null,
        icon: p.icon,
    }));
    const timeDetails = Object.fromEntries(
        Object.entries(glucose.TIME_DETAILS).map(([k, v]) => [k, { icon: v.icon, label: v.label }]),
    );
    const symptoms = [...glucose.PREDEFINED_SYMPTOMS];
    const symptomCategories = Object.fromEntries(
        Object.entries(glucose.SYMPTOM_CLINICAL_CATEGORIES).map(([name, meta]) => [name, {
            category: meta.category,
            categoryName: meta.categoryName,
        }]),
    );

    const conditions = {
        common: utils.COMMON_CONDITIONS.map((c) => ({ id: c.id, label: c.label })),
        other: utils.OTHER_CONDITIONS.map((c) => ({ id: c.id, label: c.label })),
        noneId: 'NONE',
    };

    const medications = utils.HK_HA_MEDICATION_GROUPS.map((g) => ({
        category: g.category,
        meds: g.meds.map((m) => ({ name: m.name, label: m.label, class: m.class, classZh: m.classZh })),
    }));

    const typesSrc = readRepo('utils/types.ts');
    const clinicTypeUnion = (typesSrc.match(/clinicType\?:\s*'([^;]+)';/) || [, ''])[1]
        .split('|')
        .map((s) => s.trim().replace(/'/g, ''))
        .filter(Boolean);

    const profileContext = readRepo('server/gemini/profileContext.ts');
    const clinicLabels = Object.fromEntries(
        [...profileContext.matchAll(/'([A-Z]+)'\s*:\s*'([^']+)'/g)]
            .filter((m) => clinicTypeUnion.includes(m[1]) || ['GOPC', 'SOPC', 'DHC', 'PRIVATE', 'OTHER', 'NONE'].includes(m[1]))
            .map((m) => [m[1], m[2]]),
    );

    return {
        glucose: {
            periodOptions,
            timeDetails,
            predefinedSymptoms: symptoms,
            symptomClinicalCategories: symptomCategories,
        },
        profile: {
            conditions,
            medications,
            exerciseTypes: exercise.EXERCISE_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
            // Verify slim P2: these tables used to be parsed out of the view
            // JSX; they now live unchanged in domain/options.ts (same output).
            dietHabits: options.DIET_HABIT_OPTIONS.map((o) => ({ id: o.id, title: o.title })),
            exerciseDaysPerWeek: options.EXERCISE_DAYS_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
            exerciseMinutesPerSession: options.EXERCISE_MINUTES_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
            exerciseIntensity: options.EXERCISE_INTENSITY_OPTIONS.map((o) => ({ id: o.id, title: o.title })),
            diabetesTypes: options.DIABETES_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            onboardingDiabetesTypes: options.ONBOARDING_DIABETES_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            // Both pickers (我的 sheet and onboarding tiles) use the same table.
            genders: [...options.GENDER_OPTIONS],
            onboardingGenders: [...options.GENDER_OPTIONS],
            clinicTypeIds: clinicTypeUnion,
            clinicLabelsForAi: clinicLabels,
        },
    };
}

const outDir = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : path.join(repoRoot, 'verify-results/latest/contracts');
fs.mkdirSync(outDir, { recursive: true });

const locked = extractLockedCopy();
const optionValues = await collectOptionValues();

fs.writeFileSync(path.join(outDir, 'locked-copy.normalized.json'), stableStringifyRaw(locked));
fs.writeFileSync(path.join(outDir, 'option-values.normalized.json'), stableStringifyRaw(optionValues));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({
    ok: locked.ok,
    lockedCount: locked.items.length,
    optionValueGroups: Object.keys(optionValues),
}, null, 2) + '\n');

if (!locked.ok) {
    console.error(`Locked copy missing from source: ${locked.missing.join(', ')}`);
    process.exit(1);
}
console.log(`contract snapshots written to ${outDir}`);
