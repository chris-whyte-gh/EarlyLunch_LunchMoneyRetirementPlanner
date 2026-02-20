"use client";

import { ScenarioPhase } from "@/lib/modeling";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedScenariosProps {
    phases: ScenarioPhase[];
    onPhasesChange: (phases: ScenarioPhase[]) => void;
    currentAge: number;
    lifeExpectancy: number;
    stressTestEnabled: boolean;
    onStressTestChange: (enabled: boolean) => void;
}

export function AdvancedScenarios({ phases, onPhasesChange, currentAge, lifeExpectancy, stressTestEnabled, onStressTestChange }: AdvancedScenariosProps) {
    const addPhase = () => {
        const index = phases.length + 1;
        const newPhase: ScenarioPhase = {
            id: crypto.randomUUID(),
            label: `Scenario Phase ${index}`,
            startAge: Math.min(currentAge + 10, lifeExpectancy - 5),
            endAge: Math.min(currentAge + 20, lifeExpectancy),
            returnAdjustment: 0.02,
            spendingAdjustment: 1.0,
            color: "green",
        };
        onPhasesChange([...phases, newPhase]);
    };

    const removePhase = (id: string) => {
        onPhasesChange(phases.filter(p => p.id !== id));
    };

    const updatePhase = (id: string, updates: Partial<ScenarioPhase>) => {
        // Ensure numbers are handled correctly from inputs
        onPhasesChange(phases.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Scenario Overrides</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onStressTestChange(!stressTestEnabled)}
                        className={cn(
                            "text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm border",
                            stressTestEnabled
                                ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                                : "bg-white text-muted-foreground border-border hover:bg-muted"
                        )}
                        title="Simulate a 2000-style market crash at retirement"
                    >
                        <TrendingDown className="h-3 w-3" /> {stressTestEnabled ? "STRESS TEST ON" : "STRESS TEST"}
                    </button>
                    <button
                        onClick={addPhase}
                        className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                    >
                        <Plus className="h-3 w-3" /> ADD PHASE
                    </button>
                </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {phases.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                        <p className="text-xs text-muted-foreground font-medium italic">
                            No active overrides. Add one to simulate specific periods of growth or spending.
                        </p>
                    </div>
                )}

                {phases.map((phase) => (
                    <div
                        key={phase.id}
                        className={cn(
                            "p-4 rounded-xl border border-border bg-white shadow-sm transition-all relative overflow-hidden",
                            phase.color === 'green' ? "border-l-4 border-l-emerald-500" :
                                phase.color === 'blue' ? "border-l-4 border-l-blue-500" :
                                    "border-l-4 border-l-rose-500"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4 gap-4">
                            <input
                                value={phase.label}
                                onChange={(e) => updatePhase(phase.id, { label: e.target.value })}
                                className="font-bold text-foreground bg-transparent border-b border-transparent focus:border-primary focus:ring-0 w-full text-sm outline-none transition-colors"
                                placeholder="Phase Label (e.g. Bull Market)"
                            />
                            <button
                                onClick={() => removePhase(phase.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Age Range Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <span>Active Years</span>
                                    <span className="font-mono bg-muted/50 px-1.5 rounded">{phase.startAge} — {phase.endAge}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-muted-foreground uppercase opacity-70">Start</span>
                                        <input
                                            type="range"
                                            min={currentAge}
                                            max={lifeExpectancy}
                                            value={phase.startAge}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updatePhase(phase.id, {
                                                    startAge: val,
                                                    endAge: Math.max(val, phase.endAge)
                                                });
                                            }}
                                            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-muted-foreground uppercase opacity-70">End</span>
                                        <input
                                            type="range"
                                            min={currentAge}
                                            max={lifeExpectancy}
                                            value={phase.endAge}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updatePhase(phase.id, {
                                                    endAge: val,
                                                    startAge: Math.min(val, phase.startAge)
                                                });
                                            }}
                                            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Return Adjustment */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            {phase.returnAdjustment >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
                                            <span>Market</span>
                                        </div>
                                        <span className={cn("font-mono", phase.returnAdjustment >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {phase.returnAdjustment >= 0 ? '+' : ''}{(phase.returnAdjustment * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-0.1"
                                        max="0.1"
                                        step="0.005"
                                        value={phase.returnAdjustment}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updatePhase(phase.id, {
                                                returnAdjustment: val,
                                                color: val >= 0 ? 'green' : 'red'
                                            });
                                        }}
                                        className={cn(
                                            "w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer",
                                            phase.returnAdjustment >= 0 ? "accent-emerald-500" : "accent-rose-500"
                                        )}
                                    />
                                </div>

                                {/* Spending Adjustment */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3 text-amber-500" />
                                            <span>Spend Multiplier</span>
                                        </div>
                                        <span className="font-mono text-amber-600">
                                            {(phase.spendingAdjustment * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.25"
                                        max="3.0"
                                        step="0.1"
                                        value={phase.spendingAdjustment}
                                        onChange={(e) => updatePhase(phase.id, { spendingAdjustment: parseFloat(e.target.value) })}
                                        className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Drawdown Rate Override */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3 text-blue-500" />
                                        <span>Drawdown Rate (SWR)</span>
                                    </div>
                                    <span className="font-mono text-blue-600 font-bold">
                                        {phase.withdrawalRate !== undefined ? (phase.withdrawalRate * 100).toFixed(1) + '%' : 'Using Default'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.12"
                                    step="0.001"
                                    value={phase.withdrawalRate || 0}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        updatePhase(phase.id, { withdrawalRate: val === 0 ? undefined : val });
                                    }}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-[8px] text-muted-foreground uppercase">
                                    <span>Global Default</span>
                                    <span>High Drawdown</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
