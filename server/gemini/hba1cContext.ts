import type { HbA1cRecord } from "../../utils/types.ts";

export function formatHbA1cContext(records?: HbA1cRecord[]): string {
    if (!records || records.length === 0) {
        return "暫時未有記錄糖化血色素（HbA1c）數據（注意：不可猜測或推斷患者 HbA1c 數值，若決策或評估需要，請提醒向醫生確認最近一次抽血結果）。";
    }

    const valid = records
        .map(r => {
            const num = parseFloat(String(r?.value ?? ""));
            const ts = typeof r?.timestamp === "number" && !isNaN(r.timestamp)
                ? r.timestamp
                : (Date.parse(r?.date || "") || 0);
            return {
                valueNum: num,
                date: r?.date || "日期未填",
                ts,
            };
        })
        .filter(r => !isNaN(r.valueNum) && r.valueNum > 0 && r.valueNum < 30)
        .sort((a, b) => b.ts - a.ts);

    if (valid.length === 0) {
        return "暫時未有有效糖化血色素（HbA1c）數值記錄（不可推斷數值）。";
    }

    const latest = valid[0];
    const latestLine = `最新 HbA1c：${latest.valueNum.toFixed(1)}%（記錄日期：${latest.date}）`;

    if (valid.length === 1) {
        return `${latestLine}；共 1 次有效記錄（注意：僅有單次記錄，暫無法判斷長期 HbA1c 變化趨勢）。`;
    }

    const prev = valid[1];
    const diff = Number((latest.valueNum - prev.valueNum).toFixed(1));
    let trendDesc = `與前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）相若（變化 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%）`;
    if (diff >= 0.3) {
        trendDesc = `較前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）上升 ${diff.toFixed(1)}%`;
    } else if (diff <= -0.3) {
        trendDesc = `較前一次（${prev.date}: ${prev.valueNum.toFixed(1)}%）下降 ${Math.abs(diff).toFixed(1)}%`;
    }

    const timeline = valid
        .slice(0, 5)
        .map(r => `${r.date}: ${r.valueNum.toFixed(1)}%`)
        .join(" ← ");

    return `${latestLine}；趨勢：${trendDesc}；共 ${valid.length} 次有效記錄（近期紀錄由新到舊：${timeline}）。`;
}

