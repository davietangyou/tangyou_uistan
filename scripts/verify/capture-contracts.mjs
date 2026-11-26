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

function extractLockedCopy() {
    const items = [];
    const missing = [];
    for (const entry of LOCKED_COPY_SOURCES) {
        const src = readRepo(entry.file);
        const found = entry.pattern.test(src);
        items.push({ id: entry.id, file: entry.file, value: entry.value, foundInSource: found });
        if (!found) missing.push(entry.id);
    }
    return {
        ok: missing.length === 0,
        missing,
        items,
    };
}

function collectJsxOptions(rel, kinds) {
    const src = readRepo(rel);
    const out = {};
    if (kinds.includes('id-title')) {
        out.idTitle = [...src.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'\s*\}/g)]
            .map((m) => ({ id: m[1], title: m[2] }));
    }
    if (kinds.includes('id-label')) {
        out.idLabel = [...src.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'\s*\}/g)]
            .map((m) => ({ id: m[1], label: m[2] }));
    }
    if (kinds.includes('option-value')) {
        out.optionValues = [...src.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)]
            .map((m) => ({ value: m[1], label: m[2] }));
    }
    if (kinds.includes('gender-array')) {
        const m = src.match(/\['男',\s*'女',\s*'其他'\]/);
        out.genders = m ? ['男', '女', '其他'] : [];
    }
    return out;
}

async function collectOptionValues() {
    const glucose = await import(path.join(repoRoot, 'views/GlucoseView/constants.ts'));
    const utils = await import(path.join(repoRoot, 'utils/constants.ts'));
    const exercise = await import(path.join(repoRoot, 'domain/exercise.ts'));

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
            dietHabits: collectJsxOptions('views/MeView/LifestyleCard.tsx', ['id-title']).idTitle.filter((x) => !['LIGHT', 'MODERATE', 'VIGOROUS'].includes(x.id)),
            exerciseDaysPerWeek: collectJsxOptions('views/MeView/LifestyleCard.tsx', ['id-label']).idLabel.filter((x) => /日/.test(x.label)),
            exerciseMinutesPerSession: collectJsxOptions('views/MeView/LifestyleCard.tsx', ['id-label']).idLabel.filter((x) => /分鐘/.test(x.label)),
            exerciseIntensity: collectJsxOptions('views/MeView/LifestyleCard.tsx', ['id-title']).idTitle.filter((x) => ['LIGHT', 'MODERATE', 'VIGOROUS'].includes(x.id)),
            diabetesTypes: collectJsxOptions('views/MeView/DiabetesCard.tsx', ['option-value']).optionValues.filter((o) => o.value),
            onboardingDiabetesTypes: collectJsxOptions('views/OnboardingView/ConditionsStep.tsx', ['option-value']).optionValues.filter((o) => o.value),
            genders: collectJsxOptions('views/MeView/PersonalInfoCard.tsx', ['option-value']).optionValues.filter((o) => o.value).map((o) => o.value),
            onboardingGenders: collectJsxOptions('views/OnboardingView/BasicsStep.tsx', ['gender-array']).genders,
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
