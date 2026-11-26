import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {EmptyState} from './recordUi';

// Accessible name for the focusable chart svg (recharts accessibilityLayer adds tabIndex=0);
// aria-label rather than title so no native hover tooltip appears. Same text as the visible heading.
const CHART_TITLE = '糖化血紅素趨勢';

// Same reference lines as before (7% target, 8% high); labels moved to the legend.
const C = {axis: '#636B65', grid: '#E3E7DD', target: '#2E7D4F', high: '#B42318', data: '#4A6E85'};

export function HbA1cTrendChart({vm}: {vm: GlucoseViewModel}) {
    const {chartData, isLargeFont} = vm;
    const tickSize = isLargeFont ? 16 : 14;

    return (
        <section className="ds-card ds-rec-chart" aria-labelledby="hba1c-trend-title">
            <div className="ds-rec-section-head">
                <h3 id="hba1c-trend-title" className="t-title">糖化血紅素趨勢</h3>
                <p className="t-caption t-ink-2">長期血糖控制與平均水平走勢圖</p>
            </div>

            <div className={`ds-rec-chart-box${isLargeFont ? ' is-large' : ''}`}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} aria-label={CHART_TITLE}>
                            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={C.grid} />
                            <XAxis dataKey="name" fontSize={tickSize} tick={{ fill: C.axis }} axisLine={{ stroke: C.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={isLargeFont ? 40 : 28} />
                            <YAxis domain={[4, 'auto']} fontSize={tickSize} width={isLargeFont ? 40 : 34} tickCount={5} axisLine={false} tickLine={false} tick={{ fill: C.axis }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: '1px solid rgba(31, 37, 34, 0.08)',
                                    boxShadow: '0 8px 24px rgba(31, 37, 34, 0.12)',
                                    fontWeight: 600,
                                    padding: '12px 16px',
                                    color: '#1F2522',
                                    fontSize: isLargeFont ? '18px' : '16px'
                                }}
                            />
                            <ReferenceLine y={7} stroke={C.target} strokeDasharray="4 4" strokeWidth={1.5} />
                            <ReferenceLine y={8} stroke={C.high} strokeDasharray="4 4" strokeWidth={1.5} />
                            <Line type="monotone" dataKey="value" stroke={C.data} strokeWidth={3} dot={{ r: 5, fill: C.data, strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState>
                        <p className="t-body t-ink-2">暫無 HbA1c 趨勢數據</p>
                    </EmptyState>
                )}
            </div>

            <ul className="ds-rec-legend">
                <li><span className="ds-rec-key is-line is-target" aria-hidden></span><span className="t-caption">目標 (&lt;7%)</span></li>
                <li><span className="ds-rec-key is-line is-low" aria-hidden></span><span className="t-caption">過高 (&gt;8%)</span></li>
                <li><span className="ds-rec-key is-dot" aria-hidden></span><span className="t-caption">實際紀錄</span></li>
            </ul>
        </section>
    );
}
