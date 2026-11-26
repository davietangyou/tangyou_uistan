import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {StatTile} from '../../../components/ui';
import {CustomRangePanel, EmptyState, RangeSwitch} from './recordUi';

export function GlucoseStatsPanel({vm}: {vm: GlucoseViewModel}) {
    const {
        bgStats,
        chartRange,
        customEndDate,
        customStartDate,
        rangeTimeBounds,
        setChartRange,
        setCustomEndDate,
        setCustomPresetDays,
        setCustomPresetThisMonth,
        setCustomStartDate
    } = vm;

    return (
        <section id="glucose-dashboard-anchor" className="ds-rec-section" aria-labelledby="glucose-stats-title">
            <div className="ds-rec-section-head">
                <h2 id="glucose-stats-title" className="t-h2">血糖數據分析</h2>
                <p className="t-caption t-ink-2">
                    當前篩選：{rangeTimeBounds.label} ({rangeTimeBounds.description})
                </p>
            </div>

            <RangeSwitch name="glucose-range" value={chartRange} onChange={setChartRange} label="血糖數據時間範圍" />

            {chartRange === 'CUSTOM' && (
                <CustomRangePanel
                    start={customStartDate}
                    end={customEndDate}
                    onStart={setCustomStartDate}
                    onEnd={setCustomEndDate}
                    presets={[
                        { label: '近 3 天', onClick: () => setCustomPresetDays(3) },
                        { label: '近 14 天', onClick: () => setCustomPresetDays(14) },
                        { label: '近 30 天', onClick: () => setCustomPresetDays(30) },
                        { label: '近 90 天', onClick: () => setCustomPresetDays(90) },
                        { label: '本月', onClick: () => setCustomPresetThisMonth() }
                    ]}
                />
            )}

            {bgStats ? (
                <div className="ds-rec-stats">
                    <StatTile
                        className="ds-rec-stat"
                        label="平均值 (Mean)"
                        value={bgStats.avg}
                        unit="mmol/L"
                        statusLabel={chartRange === 'WEEK' ? '週平均血糖' : chartRange === 'MONTH' ? '月平均血糖' : chartRange === 'YEAR' ? '年平均血糖' : '區間平均血糖'}
                    />
                    <StatTile
                        className="ds-rec-stat"
                        label="最低值 (Min)"
                        value={bgStats.min}
                        unit="mmol/L"
                        tone={bgStats.lowCount > 0 ? 'low' : 'neutral'}
                        statusLabel={bgStats.lowCount > 0 ? `低血糖 ${bgStats.lowCount} 次` : '無低血糖記錄'}
                    />
                    <StatTile
                        className="ds-rec-stat"
                        label="最高值 (Max)"
                        value={bgStats.max}
                        unit="mmol/L"
                        tone={bgStats.highCount > 0 ? 'high' : 'neutral'}
                        statusLabel={bgStats.highCount > 0 ? `偏高 ${bgStats.highCount} 次` : '無超標記錄'}
                    />
                </div>
            ) : (
                <EmptyState>
                    <p className="t-body t-ink-2">該時間區間內暫無血糖紀錄數據，您可以更換時間區間或在上方記錄新數值！</p>
                </EmptyState>
            )}
        </section>
    );
}
