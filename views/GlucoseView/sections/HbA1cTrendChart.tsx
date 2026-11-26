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

// Stage 6 pure move from HbA1cTab (lines 120-159); JSX copied verbatim.
export function HbA1cTrendChart({vm}: {vm: GlucoseViewModel}) {
    const {
        chartData,
        isLargeFont
    } = vm;

    return (
                    <div className={`premium-card bg-white border border-slate-100 shadow-xl shadow-slate-200/50 ${isLargeFont ? 'p-12 space-y-8' : 'p-8 space-y-6'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`bg-[#7FA0B4]/10 rounded-2xl flex items-center justify-center ${isLargeFont ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'}`}>
                                📈
                            </div>
                            <div>
                                <h2 className={`font-black text-[#4A6E85] ${isLargeFont ? 'text-2xl' : 'text-xl'}`}>糖化血紅素趨勢</h2>
                                <p className={`font-medium text-slate-400 ${isLargeFont ? 'text-base' : 'text-sm'}`}>長期血糖控制與平均水平走勢圖</p>
                            </div>
                        </div>
                        
                        <div className={`w-full mt-8 ${isLargeFont ? 'h-[320px]' : 'h-[240px]'}`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" fontSize={isLargeFont ? 13 : 10} fontWeight="600" tick={{ fill: '#94a3b8' }} />
                                        <YAxis domain={[4, 'auto']} fontSize={isLargeFont ? 13 : 10} fontWeight="600" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '1.25rem', 
                                                border: 'none', 
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                                                fontWeight: 'bold',
                                                padding: '12px 16px',
                                                fontSize: isLargeFont ? '1rem' : '0.85rem'
                                            }}
                                        />
                                        <ReferenceLine y={7} stroke="#10B981" strokeDasharray="5 5" label={{ value: '目標 (<7%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#10B981', fontWeight: 'bold' }} />
                                        <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="5 5" label={{ value: '過高 (>8%)', position: 'insideLeft', fontSize: isLargeFont ? 13 : 10, fill: '#EF4444', fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="value" stroke="#7FA0B4" strokeWidth={4} dot={{ r: 6, fill: '#7FA0B4', strokeWidth: 3, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-slate-300 font-bold">暫無 HbA1c 趨勢數據</p>
                                </div>
                            )}
                        </div>
                    </div>
    );
}
