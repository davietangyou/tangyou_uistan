import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceArea,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {EmptyState} from './recordUi';

// Accessible name for the focusable chart svg (recharts accessibilityLayer adds tabIndex=0);
// aria-label rather than title so no native hover tooltip appears. Same text as the visible heading.
const CHART_TITLE = '血糖趨勢走勢';

// Chart palette (design tokens; recharts needs literal colours).
// Thresholds are unchanged: band 4–7, lines at 4 / 7 / 10.
const C = {
    axis: '#636B65',      // --c-ink-3
    grid: '#E3E7DD',
    band: '#D2E4C0',      // --c-sage-200: 餐前目標 4–7
    low: '#B42318',       // --c-glucose-low
    target: '#2E7D4F',    // --c-glucose-target
    high: '#B54708',      // --c-glucose-high
    data: '#4A6E85',      // legacy brand, now the data colour (owner decision 1)
};

export function GlucoseTrendChart({vm}: {vm: GlucoseViewModel}) {
    const {chartData, isLargeFont, rangeTimeBounds} = vm;
    const tickSize = isLargeFont ? 16 : 14;

    return (
        <section className="ds-card ds-rec-chart" aria-labelledby="glucose-trend-title">
            <div className="ds-rec-section-head">
                <h3 id="glucose-trend-title" className="t-title">血糖趨勢走勢</h3>
                <p className="t-caption t-ink-2">
                    {rangeTimeBounds.label} ({chartData.length} 個數據點)
                </p>
            </div>

            <div className={`ds-rec-chart-box${isLargeFont ? ' is-large' : ''}`}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} aria-label={CHART_TITLE}>
                            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={C.grid} />
                            <XAxis
                                dataKey="name"
                                fontSize={tickSize}
                                tick={{ fill: C.axis }}
                                axisLine={{ stroke: C.grid }}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={isLargeFont ? 40 : 28}
                            />
                            <YAxis
                                domain={[0, 'auto']}
                                fontSize={tickSize}
                                width={isLargeFont ? 40 : 34}
                                tickCount={5}
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: C.axis }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="ds-rec-tooltip">
                                                <div className="ds-rec-tooltip-head">
                                                    <span className="t-caption t-ink-2">{data.fullDate}</span>
                                                    <span className="ds-rec-pill is-info">{data.type}</span>
                                                </div>
                                                <p className="ds-rec-value"><span className="t-h2">{data.value}</span><span className="ds-rec-unit">mmol/L</span></p>
                                                {data.mealTag && (
                                                    <p className="t-caption">{data.mealTag}</p>
                                                )}
                                                {data.symptoms && data.symptoms.length > 0 && (
                                                    <p className="t-caption">症狀：{data.symptoms.join(', ')}</p>
                                                )}
                                                {data.dietNote && (
                                                    <p className="t-caption ds-rec-tooltip-note">飲食：{data.dietNote}</p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            { /* @ts-ignore */ }
                            <ReferenceArea y1={4} y2={7} fill={C.band} fillOpacity={0.6} />
                            <ReferenceLine y={4} stroke={C.low} strokeDasharray="4 4" strokeWidth={1.5} />
                            <ReferenceLine y={7} stroke={C.target} strokeDasharray="4 4" strokeWidth={1.5} />
                            <ReferenceLine y={10} stroke={C.high} strokeDasharray="4 4" strokeWidth={1.5} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={C.data}
                                strokeWidth={3}
                                dot={{ r: 5, fill: C.data, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState>
                        <p className="t-body t-ink-2">該區間暫無記錄</p>
                    </EmptyState>
                )}
            </div>

            <ul className="ds-rec-legend">
                <li><span className="ds-rec-key is-band" aria-hidden></span><span className="t-caption">餐前目標 (4-7)</span></li>
                <li><span className="ds-rec-key is-line is-low" aria-hidden></span><span className="t-caption">過低 (4)</span></li>
                <li><span className="ds-rec-key is-line is-high" aria-hidden></span><span className="t-caption">餐後上限 (10)</span></li>
                <li><span className="ds-rec-key is-dot" aria-hidden></span><span className="t-caption">實際紀錄</span></li>
            </ul>
        </section>
    );
}
