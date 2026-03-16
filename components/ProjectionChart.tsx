import { useState, useRef, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, Label } from 'recharts';
import { ProjectionPoint, ScenarioPhase, calculateRealValue } from '@/lib/modeling';
import { formatCurrency } from '@/lib/utils';

interface ProjectionChartProps {
    data: ProjectionPoint[];
    retirementAge: number;
    phases?: ScenarioPhase[];
    viewMode: 'nominal' | 'real';
    inflationRate: number;
    currentAge: number;
    onRetirementAgeChange?: (age: number) => void;
    onPhaseCreate?: (start: number, end: number) => void;
}

export function ProjectionChart({ data, retirementAge, phases = [], viewMode, inflationRate, currentAge, onPhaseCreate }: ProjectionChartProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [hoverData, setHoverData] = useState<{ age: number; payload: any[]; isRetirement?: boolean } | null>(null);

    // Calculate retirement point data for default display
    const retirementData = useMemo(() => {
        const point = data.find(d => d.age === retirementAge);
        if (!point) return null;
        return {
            age: retirementAge,
            isRetirement: true,
            payload: [
                { name: 'Roth', value: calculateRealValue(point.rothBalance, retirementAge, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-1))' },
                { name: 'Pre-Tax', value: calculateRealValue(point.preTaxBalance, retirementAge, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-2))' },
                { name: 'Taxable', value: calculateRealValue(point.taxableBalance, retirementAge, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-3))' }
            ]
        };
    }, [data, retirementAge, currentAge, inflationRate, viewMode]);

    const displayData = hoverData || retirementData;

    const handleChartMouseDown = (e: any) => {
        if (e && e.activeLabel) {
            setIsDragging(true);
            setDragStart(e.activeLabel);
            setDragEnd(e.activeLabel);
        }
    };

    const handleChartMouseMove = (e: any) => {
        if (e && e.activeLabel) {
            const age = e.activeLabel;

            // Update hover data for tooltip
            const dataPoint = data.find(d => d.age === age);
            if (dataPoint) {
                setHoverData({
                    age,
                    payload: [
                        { name: 'Roth', value: calculateRealValue(dataPoint.rothBalance, age, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-1))' },
                        { name: 'Pre-Tax', value: calculateRealValue(dataPoint.preTaxBalance, age, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-2))' },
                        { name: 'Taxable', value: calculateRealValue(dataPoint.taxableBalance, age, currentAge, inflationRate, viewMode), stroke: 'hsl(var(--chart-3))' }
                    ]
                });
            }

            // Update drag state if dragging
            if (isDragging && dragStart !== null) {
                setDragEnd(age);
            }
        }
    };

    const handleChartMouseUp = () => {
        if (isDragging && dragStart !== null && dragEnd !== null) {
            const dragDistance = Math.abs(dragEnd - dragStart);

            // Only create phase or change retirement if dragged at least 2 years
            if (dragDistance >= 2) {
                const start = Math.min(dragStart, dragEnd);
                const end = Math.max(dragStart, dragEnd);
                onPhaseCreate?.(start, end);
            }
        }
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    };

    const handleChartMouseLeave = () => {
        setHoverData(null);
        if (isDragging) {
            handleChartMouseUp();
        }
    };

    // Prepare chart data with view mode adjustments
    const chartData = data.map(d => ({
        ...d,
        rothBalance: calculateRealValue(d.rothBalance, d.age, currentAge, inflationRate, viewMode),
        preTaxBalance: calculateRealValue(d.preTaxBalance, d.age, currentAge, inflationRate, viewMode),
        taxableBalance: calculateRealValue(d.taxableBalance, d.age, currentAge, inflationRate, viewMode),
    }));

    return (
        <div className="w-full p-6 bg-white rounded-xl border border-border shadow-sm select-none">
            {/* Info Bar - Always Visible */}
            <div className="mb-6 bg-white border border-border p-0 rounded-xl shadow-sm overflow-hidden">
                {displayData ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                        {/* Age Section */}
                        <div className="md:col-span-2 p-5 flex items-center justify-center bg-gradient-to-r from-primary/5 to-transparent border-b md:border-b-0 md:border-r border-border/50">
                            <div className="flex flex-col items-center">
                                <div className="h-4 flex items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                        {hoverData ? "Age" : "Retirement Target"}
                                    </span>
                                </div>
                                <span className="text-2xl md:text-3xl font-bold text-foreground leading-none tabular-nums">{displayData.age}</span>
                            </div>
                        </div>

                        {/* Total Portfolio Section */}
                        <div className="md:col-span-4 p-5 flex items-center justify-center bg-gradient-to-r from-transparent via-primary/5 to-transparent border-b md:border-b-0 md:border-r border-border/50 min-w-0">
                            <div className="flex flex-col items-center min-w-0">
                                <div className="h-4 flex items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap truncate">
                                        Total Portfolio <span className="opacity-60 font-medium normal-case">({viewMode === 'real' ? "Real $" : "Nominal"})</span>
                                    </span>
                                </div>
                                <span className="text-2xl md:text-3xl font-bold text-primary leading-none tabular-nums truncate">
                                    {formatCurrency(displayData.payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0), { notation: 'compact', maxDecimals: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Section */}
                        <div className="md:col-span-6 px-4 py-4 grid grid-cols-3 items-center bg-muted/30 gap-2 overflow-hidden">
                            {[...displayData.payload].reverse().map((entry: any) => (
                                <div key={entry.name} className="flex flex-col items-center min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5 max-w-full">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: entry.stroke }}
                                        />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter truncate">{entry.name}</span>
                                    </div>
                                    <span className="text-xs md:text-sm lg:text-base font-bold text-foreground/90 tabular-nums truncate">
                                        {formatCurrency(entry.value, { maxDecimals: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full p-6 flex items-center justify-center text-muted-foreground text-sm font-medium">
                        Enter financial details to see projection
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Portfolio Projection</h3>
                {isDragging && dragStart !== dragEnd && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded animate-pulse">
                        SLIDING TO DEFINE PHASE...
                    </span>
                )}
            </div>

            <div
                className="relative w-full h-[400px]"
                onMouseLeave={handleChartMouseLeave}
                style={{ cursor: isDragging ? 'ew-resize' : 'crosshair' }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
                        onMouseDown={handleChartMouseDown}
                        onMouseMove={handleChartMouseMove}
                        onMouseUp={handleChartMouseUp}
                    >
                        <defs>
                            <linearGradient id="colorRoth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPreTax" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                        <Tooltip
                            content={() => null}
                            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2, strokeDasharray: '4 4' }}
                        />

                        {/* Drag Selection Preview */}
                        {isDragging && dragStart !== null && dragEnd !== null && dragStart !== dragEnd && (
                            <ReferenceArea
                                x1={Math.min(dragStart, dragEnd)}
                                x2={Math.max(dragStart, dragEnd)}
                                fill="hsl(var(--primary))"
                                fillOpacity={0.2}
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                            >
                                <Label
                                    value="NEW DRAWDOWN PHASE"
                                    position="center"
                                    style={{ fontSize: '10px', fontWeight: '900', fill: 'hsl(var(--primary))' }}
                                />
                            </ReferenceArea>
                        )}

                        {/* Scenario Phases Backgrounds */}
                        {phases.map((phase, index) => (
                            <ReferenceArea
                                key={phase.id}
                                x1={phase.startAge}
                                x2={phase.endAge}
                                fill={phase.color === 'green' ? 'hsl(var(--chart-1))' : phase.color === 'blue' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))'}
                                fillOpacity={0.08}
                                stroke={phase.color === 'green' ? 'hsl(var(--chart-1))' : phase.color === 'blue' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))'}
                                strokeOpacity={0.2}
                                strokeDasharray="4 4"
                            >
                                <Label
                                    value={phase.label}
                                    position="insideTop"
                                    offset={10 + (index * 15)}
                                    style={{
                                        fontSize: '9px',
                                        fontWeight: '800',
                                        fill: phase.color === 'green' ? '#10b981' : phase.color === 'blue' ? '#3b82f6' : '#f43f5e',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                />
                            </ReferenceArea>
                        ))}

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
                        <Area
                            type="monotone"
                            dataKey="taxableBalance"
                            name="Taxable"
                            stackId="1"
                            stroke="hsl(var(--chart-3))"
                            fill="url(#colorTaxable)"
                        />
                        <Area
                            type="monotone"
                            dataKey="preTaxBalance"
                            name="Pre-Tax"
                            stackId="1"
                            stroke="hsl(var(--chart-2))"
                            fill="url(#colorPreTax)"
                        />
                        <Area
                            type="monotone"
                            dataKey="rothBalance"
                            name="Roth"
                            stackId="1"
                            stroke="hsl(var(--chart-1))"
                            fill="url(#colorRoth)"
                        />

                        <ReferenceLine
                            x={retirementAge}
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                        >
                            <Label
                                value="RETIREMENT"
                                position="top"
                                offset={15}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    fill: 'hsl(var(--primary))',
                                    pointerEvents: 'none'
                                }}
                            />
                        </ReferenceLine>
                    </AreaChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}
