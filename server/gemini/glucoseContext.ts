import type { GlucoseRecord } from "../../utils/types.ts";

function parseRecordTimestamp(record: { timestamp?: number; date?: string }): number {
    if (typeof record.timestamp === "number" && !isNaN(record.timestamp) && record.timestamp > 0) {
        return record.timestamp;
    }
    if (record.date) {
        const normalized = record.date.replace(/\//g, "-");
        const parsed = Date.parse(normalized);
        if (!isNaN(parsed)) return parsed;
    }
    return 0;
}

function summarizeGlucoseBucket(label: string, values: number[]): string | null {
    if (values.length === 0) return null;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = (sum / values.length).toFixed(1);
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    return values.length === 1
        ? `${label}（1次）：${avg} mmol/L`
        : `${label}（${values.length}次）：均值 ${avg} mmol/L（範圍 ${min}–${max}）`;
}

function formatSingleGlucoseDetail(r: GlucoseRecord, numValue: number | null): string {
    const timeLabel = r.mealTag ? `${r.timeType}·${r.mealTag}` : r.timeType;
    const head = numValue !== null
        ? `${r.date} [${timeLabel}]: ${numValue.toFixed(1)} mmol/L`
        : `${r.date} [${timeLabel}]: 僅症狀／備註紀錄`;

    const extras: string[] = [];
    if (r.symptoms && r.symptoms.length > 0) extras.push(`症狀:${r.symptoms.join('、')}`);
    if (r.dietNote?.trim()) extras.push(`飲食:${r.dietNote.trim()}`);
    if (r.exerciseNote?.trim()) extras.push(`運動:${r.exerciseNote.trim()}`);
    if (r.medicationNote?.trim()) extras.push(`用藥:${r.medicationNote.trim()}`);
    if (r.illnessNote?.trim()) extras.push(`身體狀況:${r.illnessNote.trim()}`);
    if (r.bpSystolic?.trim() && r.bpDiastolic?.trim()) {
        const pulsePart = r.pulse?.trim() ? `/脈搏${r.pulse.trim()}` : '';
        extras.push(`血壓:${r.bpSystolic.trim()}/${r.bpDiastolic.trim()}mmHg${pulsePart}`);
    }
    if (r.weight?.trim()) extras.push(`體重:${r.weight.trim()}`);
    if (r.mood?.trim()) extras.push(`心情:${r.mood.trim()}`);

    return extras.length > 0 ? `${head}（${extras.join('；')}）` : head;
}

export function formatGlucoseContext(records?: GlucoseRecord[], nowMs: number = Date.now()): string {
    if (!records || records.length === 0) {
        return "【資料充分性】：無紀錄（NONE）— 暫時未有任何指尖血糖或症狀紀錄。\n⚠️ 約束：不可猜測或推斷患者日常血糖是否達標；如問題需要血糖依據，請溫和提醒患者在「血糖紀錄」補充數次空腹與餐後讀數。";
    }

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffMs = nowMs - THIRTY_DAYS_MS;

    const normalized = records
        .map(r => {
            const rawVal = String(r?.value ?? "").trim();
            const parsedNum = rawVal !== "" ? parseFloat(rawVal) : NaN;
            const numValue = !isNaN(parsedNum) && parsedNum >= 0.5 && parsedNum <= 45 ? parsedNum : null;
            const ts = parseRecordTimestamp(r || {});
            return { record: r, numValue, ts };
        })
        .sort((a, b) => b.ts - a.ts);

    const recent30 = normalized.filter(item => item.ts === 0 || item.ts >= cutoffMs);

    if (recent30.length === 0) {
        const latestOld = normalized.find(item => item.numValue !== null);
        const oldNumericCount = normalized.filter(item => item.numValue !== null).length;
        const latestDesc = latestOld
            ? `最近一次紀錄為 ${latestOld.record.date} [${latestOld.record.timeType}]：${latestOld.numValue!.toFixed(1)} mmol/L`
            : `共 ${normalized.length} 筆舊紀錄`;
        return `【資料充分性】：近 30 天無新紀錄（STALE）— 歷史共有 ${oldNumericCount} 筆血糖數值，但均已超過 30 天（${latestDesc}）。\n⚠️ 約束：舊數據已過時，不可當作目前最新控糖狀態下結論，請溫和提醒患者近期補測數次血糖。`;
    }

    const numeric30 = recent30.filter((item): item is { record: GlucoseRecord; numValue: number; ts: number } => item.numValue !== null);

    if (numeric30.length === 0) {
        const recentDetails = recent30
            .slice(0, 5)
            .map(item => `  - ${formatSingleGlucoseDetail(item.record, null)}`)
            .join('\n');
        return `【資料充分性】：近 30 天僅有症狀／生活備註、無血糖數值（SYMPTOMS_ONLY，共 ${recent30.length} 筆）。\n⚠️ 約束：缺少實際指尖血糖數值，不可推斷血糖高低或是否達標。\n【近 30 天症狀與備註紀錄】：\n${recentDetails}`;
    }

    const dayKeys = new Set<string>();
    numeric30.forEach(item => {
        if (item.ts > 0) {
            dayKeys.add(new Date(item.ts).toISOString().slice(0, 10));
        } else if (item.record.date) {
            dayKeys.add(item.record.date.split(' ')[0]);
        }
    });
    const distinctDays = Math.max(1, dayKeys.size);

    const fastingVals = numeric30.filter(i => i.record.timeType === '空腹').map(i => i.numValue);
    const preMealVals = numeric30.filter(i => i.record.timeType === '餐前').map(i => i.numValue);
    const postMealVals = numeric30.filter(i => i.record.timeType === '餐後2小時').map(i => i.numValue);
    const bedtimeVals = numeric30.filter(i => i.record.timeType === '睡前').map(i => i.numValue);
    const otherVals = numeric30
        .filter(i => !['空腹', '餐前', '餐後2小時', '睡前'].includes(i.record.timeType))
        .map(i => i.numValue);

    const allVals = numeric30.map(i => i.numValue);
    const overallAvg = (allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(1);
    const overallMin = Math.min(...allVals).toFixed(1);
    const overallMax = Math.max(...allVals).toFixed(1);

    const lowItems = numeric30.filter(i => i.numValue < 3.9);
    const severeLowCount = numeric30.filter(i => i.numValue < 3.0).length;
    const highItems = numeric30.filter(i => i.numValue > 10.0);
    const veryHighCount = numeric30.filter(i => i.numValue >= 13.9).length;
    const highFastingCount = fastingVals.filter(v => v > 7.0).length;

    const hasPreOrFasting = fastingVals.length > 0 || preMealVals.length > 0;
    const hasPostMeal = postMealVals.length > 0;
    let sufficiencyLine: string;

    if (numeric30.length < 3) {
        sufficiencyLine = `【資料充分性】：極少／不足（INSUFFICIENT — 近 30 天僅有 ${numeric30.length} 筆有效讀數、涵蓋 ${distinctDays} 天）。\n⚠️ 嚴格約束：樣本數極少，【絕對不可】據此斷言整體控糖「穩定」或「失控」；只能針對這 ${numeric30.length} 次單點讀數作初步解讀，並主動提醒患者多測幾天（特別是空腹與餐後 2 小時配對）再作整體評估。`;
    } else if (numeric30.length < 7 || distinctDays < 3 || (!hasPreOrFasting || !hasPostMeal)) {
        const missingParts: string[] = [];
        if (!hasPreOrFasting) missingParts.push("空腹／餐前讀數");
        if (!hasPostMeal) missingParts.push("餐後 2 小時讀數");
        if (distinctDays < 3) missingParts.push("多日追蹤天數");
        const missingNote = missingParts.length > 0 ? `，缺少${missingParts.join('與')}` : "";
        sufficiencyLine = `【資料充分性】：局部有限（LIMITED — 近 30 天共 ${numeric30.length} 筆有效讀數、涵蓋 ${distinctDays} 天${missingNote}）。\n⚠️ 約束：可指出現有時段的初步觀察，但必須誠實說明紀錄尚不完整，切勿對全天或長期控糖成效過度下結論。`;
    } else {
        sufficiencyLine = `【資料充分性】：充足（ADEQUATE — 近 30 天共 ${numeric30.length} 筆有效讀數，涵蓋 ${distinctDays} 天，包含空腹／餐前與餐後對照）。`;
    }

    const bucketLines = [
        summarizeGlucoseBucket('空腹', fastingVals),
        summarizeGlucoseBucket('餐前', preMealVals),
        summarizeGlucoseBucket('餐後2小時', postMealVals),
        summarizeGlucoseBucket('睡前', bedtimeVals),
        summarizeGlucoseBucket('其他時段', otherVals),
    ].filter((s): s is string => Boolean(s));

    const riskParts: string[] = [
        `低血糖（<3.9 mmol/L）：${lowItems.length} 次${severeLowCount > 0 ? `（其中嚴重低血糖 <3.0 達 ${severeLowCount} 次）` : ''}`,
        `高血糖（>10.0 mmol/L）：${highItems.length} 次${veryHighCount > 0 ? `（其中明顯偏高 ≥13.9 達 ${veryHighCount} 次）` : ''}`,
    ];
    if (fastingVals.length > 0) {
        riskParts.push(`空腹偏高（>7.0 mmol/L）：${highFastingCount}/${fastingVals.length} 次`);
    }

    const symptomCounts = new Map<string, number>();
    recent30.forEach(item => {
        (item.record.symptoms || []).forEach(sym => {
            const key = sym.trim();
            if (key) symptomCounts.set(key, (symptomCounts.get(key) || 0) + 1);
        });
    });
    const symptomSummary = symptomCounts.size > 0
        ? Array.from(symptomCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([sym, cnt]) => `${sym}(${cnt}次)`)
            .join('、')
        : '';

    const bpEntries = recent30
        .map(item => {
            const sys = parseFloat(item.record.bpSystolic || '');
            const dia = parseFloat(item.record.bpDiastolic || '');
            if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null;
            return { sys, dia, date: item.record.date, pulse: item.record.pulse?.trim() };
        })
        .filter((x): x is { sys: number; dia: number; date: string; pulse: string | undefined } => Boolean(x));

    let bpSummary = '';
    if (bpEntries.length > 0) {
        const latestBp = bpEntries[0];
        const elevatedBpCount = bpEntries.filter(b => b.sys >= 140 || b.dia >= 90).length;
        bpSummary = `近 30 天血壓紀錄 ${bpEntries.length} 次，最新 ${latestBp.sys}/${latestBp.dia} mmHg（${latestBp.date}${latestBp.pulse ? `，脈搏 ${latestBp.pulse}` : ''}）${elevatedBpCount > 0 ? `，其中偏高（≥140/90）${elevatedBpCount} 次` : ''}`;
    }

    const recentDetails = recent30
        .slice(0, 6)
        .map(item => `  - ${formatSingleGlucoseDetail(item.record, item.numValue)}`)
        .join('\n');

    const sections = [
        sufficiencyLine,
        `【近 30 天指尖血糖統計】：整體均值 ${overallAvg} mmol/L（範圍 ${overallMin}–${overallMax}）；${bucketLines.join('；')}`,
        `【異常波動次數】：${riskParts.join('；')}`,
    ];
    if (symptomSummary) {
        sections.push(`【近 30 天伴隨症狀統計】：${symptomSummary}`);
    }
    if (bpSummary) {
        sections.push(`【近 30 天血壓紀錄】：${bpSummary}`);
    }
    sections.push(`【近期明細與生活備註（最新最多 6 筆）】：\n${recentDetails}`);

    return sections.join('\n');
}

