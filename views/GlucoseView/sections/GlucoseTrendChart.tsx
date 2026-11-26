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

// Stage 6 pure move from BloodGlucoseTab (lines 779-904); JSX copied verbatim.
export function GlucoseTrendChart({vm}: {vm: GlucoseViewModel}) {
    const {
        chartData,
        chartRange,
        isLargeFont,
        rangeTimeBounds,
        setChartRange
    } = vm;

    return (
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-10' : 'p-6 sm:p-8 space-y-6'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className={`font-black text-[#4A6E85] flex items-center gap-2 ${isLargeFont ? 'text-2xl' : 'text-lg'}`}>
                                    📈 血糖趨勢走勢
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                    {rangeTimeBounds.label} ({chartData.length} 個數據點)
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                {(
                                    [
                                        { id: 'WEEK', label: '週' },
                                        { id: 'MONTH', label: '月' },
                                        { id: 'YEAR', label: '年' },
                                        { id: 'CUSTOM', label: '自定義' }
                                    ] as const
                                ).map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setChartRange(r.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            chartRange === r.id
                                                ? 'bg-[#4A6E85] text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isLargeFont ? 'h-[360px]' : 'h-[280px]'} w-full`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            fontSize={isLargeFont ? 13 : 10}
                                            fontWeight="600"
                                            tick={{ fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 'auto']} 
                                            fontSize={isLargeFont ? 13 : 10} 
                                            fontWeight="600" 
                                            axisLine={false} 
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8' }}
                                        />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-1.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="font-bold text-slate-400">{data.fullDate}</span>
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-black">{data.type}</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1.5 pt-1">
                                                                <span className="text-xl font-black text-[#4A6E85]">{data.value}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">mmol/L</span>
                                                            </div>
                                                            {data.mealTag && (
                                                                <div className="text-slate-600 font-bold">🍱 {data.mealTag}</div>
                                                            )}
                                                            {data.symptoms && data.symptoms.length > 0 && (
                                                                <div className="text-rose-500 font-bold flex flex-wrap gap-1">
                                                                    <span>⚠️ 症狀：</span>
                                                                    <span>{data.symptoms.join(', ')}</span>
                                                                </div>
                                                            )}
                                                            {data.dietNote && (
                                                                <div className="text-slate-500 font-medium truncate max-w-[200px]">🍽️ {data.dietNote}</div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        { /* @ts-ignore */ }
                                        <ReferenceArea y1={4} y2={7} fill="#10B981" fillOpacity={0.08} />
                                        <ReferenceLine y={4} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '過低 (4)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="3 3" label={{ value: '餐前目標 (7)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={10} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '餐後上限 (10)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#F59E0B', fontWeight: 'bold' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#4A6E85" 
                                            strokeWidth={3.5} 
                                            dot={{ r: 4.5, fill: '#4A6E85', strokeWidth: 2.5, stroke: '#fff' }} 
                                            activeDot={{ r: 7, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">該區間暫無記錄</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={`flex justify-center flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-slate-100 ${isLargeFont ? 'text-sm' : 'text-[10px]'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-emerald-500 border-t-2 border-dashed border-emerald-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐前目標 (4-7)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>餐後上限 (10)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#4A6E85]"></div>
                                <span className={`font-black text-slate-500 uppercase tracking-widest ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}>實際紀錄</span>
                            </div>
                        </div>
                    </div>
    );
}
