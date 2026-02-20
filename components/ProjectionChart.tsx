import { useState, useCallback, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, Label } from 'recharts';
import { ProjectionPoint, ScenarioPhase } from '@/lib/modeling';
import { cn } from '@/lib/utils';

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

export function ProjectionChart({ data, retirementAge, phases = [], viewMode, inflationRate, currentAge, onRetirementAgeChange, onPhaseCreate }: ProjectionChartProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [hoverData, setHoverData] = useState<{ age: number; payload: any[] } | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    // Helper to get value based on view mode
    const getValue = useCallback((amount: number, age: number) => {
        if (viewMode === 'nominal') return amount;
        const yearsInFuture = Math.max(0, age - currentAge);
        return amount / Math.pow(1 + inflationRate, yearsInFuture);
    }, [viewMode, inflationRate, currentAge]);

    const formatCurrency = (value: number | null | undefined, maxDecimals = 0) => {
        if (value === null || value === undefined) return '---';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: maxDecimals,
            notation: 'compact'
        }).format(value);
    };

    // Default placeholder data when not hovering
    const defaultData = {
        age: '---',
        label: "Retirement Age",
        payload: [
            { name: 'Roth', value: null, stroke: 'hsl(var(--chart-1))' },
            { name: 'Pre-Tax', value: null, stroke: 'hsl(var(--chart-2))' },
            { name: 'Taxable', value: null, stroke: 'hsl(var(--chart-3))' }
        ]
    };

    const displayData = hoverData || defaultData;

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
                        { name: 'Roth', value: getValue(dataPoint.rothBalance, age), stroke: 'hsl(var(--chart-1))' },
                        { name: 'Pre-Tax', value: getValue(dataPoint.preTaxBalance, age), stroke: 'hsl(var(--chart-2))' },
                        { name: 'Taxable', value: getValue(dataPoint.taxableBalance, age), stroke: 'hsl(var(--chart-3))' }
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
        rothBalance: getValue(d.rothBalance, d.age),
        preTaxBalance: getValue(d.preTaxBalance, d.age),
        taxableBalance: getValue(d.taxableBalance, d.age),
    }));

    return (
        <div className="w-full p-6 bg-white rounded-xl border border-border shadow-sm select-none">
            {/* Info Bar - Always Visible */}
            <div className="mb-6 bg-white border border-border p-0 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                {displayData ? (
                    <>
                        {/* Main Stats Section */}
                        <div className="flex-1 p-5 flex items-center gap-8 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    {hoverData ? "Age" : "Retirement Age"}
                                </span>
                                <span className="text-3xl font-bold text-foreground leading-none">{displayData.age}</span>
                            </div>

                            <div className="h-10 w-px bg-primary/10"></div>

                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    Total Portfolio <span className="opacity-60 font-medium normal-case">({viewMode === 'real' ? "Real $" : "Nominal"})</span>
                                </span>
                                <span className="text-3xl font-bold text-primary leading-none">
                                    {formatCurrency(displayData.payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0), 2)}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Section */}
                        <div className="px-6 py-4 flex items-center gap-6 bg-muted/30 border-t md:border-t-0 md:border-l border-border">
                            {[...displayData.payload].reverse().map((entry: any) => (
                                <div key={entry.name} className="flex flex-col items-start gap-0.5 min-w-[80px]">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: entry.stroke }}
                                        />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{entry.name}</span>
                                    </div>
                                    <span className="text-lg font-bold text-foreground/90 tabular-nums">{formatCurrency(entry.value, 2)}</span>
                                </div>
                            ))}
                        </div>
                    </>
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
                            tickFormatter={(val) => formatCurrency(val)}
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
