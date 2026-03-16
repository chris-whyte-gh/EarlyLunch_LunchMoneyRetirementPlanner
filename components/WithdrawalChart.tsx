import { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ProjectionPoint, calculateRealValue } from '@/lib/modeling';
import { formatCurrency } from '@/lib/utils';

interface WithdrawalChartProps {
    data: ProjectionPoint[];
    retirementAge: number;
    viewMode: 'nominal' | 'real';
    inflationRate: number;
    currentAge: number;
}

export function WithdrawalChart({ data, retirementAge, viewMode, inflationRate, currentAge }: WithdrawalChartProps) {
    // Only show data from retirement age onwards
    const retirementData = useMemo(() => {
        return data
            .filter(d => d.age >= retirementAge)
            .map(d => ({
                age: d.age,
                year: d.year,
                Taxable: calculateRealValue(d.withdrawalTaxable, d.age, currentAge, inflationRate, viewMode),
                'Pre-Tax': calculateRealValue(d.withdrawalPreTax, d.age, currentAge, inflationRate, viewMode),
                Roth: calculateRealValue(d.withdrawalRoth, d.age, currentAge, inflationRate, viewMode),
                SpendNeed: calculateRealValue(d.expenses, d.age, currentAge, inflationRate, viewMode),
                total: calculateRealValue(d.withdrawalTaxable + d.withdrawalPreTax + d.withdrawalRoth, d.age, currentAge, inflationRate, viewMode)
            }))
            .filter(d => d.total > 0);
    }, [data, retirementAge, viewMode, inflationRate, currentAge]);

    if (retirementData.length === 0) {
        return (
            <div className="w-full p-6 bg-white rounded-xl border border-border shadow-sm flex items-center justify-center text-muted-foreground text-sm font-medium h-[300px]">
                No withdrawals projected. Adjust retirement age or withdrawal rate.
            </div>
        );
    }

    return (
        <div className="w-full p-6 bg-white rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Annual Drawdown Strategy</h3>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                    {viewMode === 'real' ? "Real Dollars (Today's Buying Power)" : "Nominal Dollars"}
                </span>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={retirementData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                        <XAxis
                            dataKey="age"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(val) => formatCurrency(val, { notation: 'compact' })}
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                            formatter={(value: number | undefined) => [value !== undefined ? formatCurrency(value) : '---', '']}
                            labelFormatter={(label) => `Age ${label}`}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                paddingBottom: '20px'
                            }}
                        />
                        <Bar dataKey="Taxable" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Pre-Tax" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Roth" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
                        <Line type="stepAfter" dataKey="SpendNeed" stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} legendType="line" name="Actual Spend Need" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
