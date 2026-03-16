"use client";

import React from 'react';
import { ModelingParams } from '@/lib/modeling';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface ConfigPanelProps {
    params: ModelingParams;
    onChange: (params: ModelingParams) => void;
    className?: string;
    activeTab?: string;
    birthYear?: number;
}

interface InputGroupProps {
    label: string;
    value: number;
    onChange: (val: string) => void;
    step?: number;
    suffix?: string;
    disabled?: boolean;
}

const InputGroup = ({ label, value, onChange, step = 1, suffix = '', disabled = false }: InputGroupProps) => {
    // Local state for performant typing without triggering parent re-renders
    const [localValue, setLocalValue] = React.useState(value.toString());

    // Sync local value if prop changes externally (e.g. from a different tab calculation)
    React.useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        if (!disabled) onChange(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide cursor-default">
                {label}
            </label>
            <div className="flex items-center gap-2 relative">
                <input
                    type="text"
                    inputMode="decimal"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                        "w-full bg-white text-foreground border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all font-mono",
                        disabled && "bg-slate-50 text-muted-foreground cursor-not-allowed border-slate-200"
                    )}
                />
                {suffix && <span className="absolute right-3 text-muted-foreground text-xs pointer-events-none">{suffix}</span>}
            </div>
        </div>
    );
};

export function ConfigPanel({ params, onChange, className, activeTab = 'overview', birthYear }: ConfigPanelProps) {

    const handleChange = (key: keyof ModelingParams, value: string, scale: number = 1) => {
        // Remove currency symbols or commas if user adds them
        const cleanValue = value.replace(/[$,]/g, '');
        const numValue = parseFloat(cleanValue);

        if (!isNaN(numValue)) {
            onChange({ ...params, [key]: numValue / scale });
        }
    };

    return (
        <div className={cn("bg-white border border-border rounded-xl p-6 space-y-6 shadow-sm transition-all relative overflow-hidden", className)}>

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Scenarios</h3>
                <div className="flex items-center gap-2">
                    {activeTab === 'roth' && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full uppercase">Roth Mode</span>}
                    {activeTab === 'sepp' && <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase">SEPP Mode</span>}
                    {birthYear && (
                        <div className="text-xs font-medium text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                            Age {params.currentAge}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {(activeTab === 'overview') && (
                    <>
                        {!birthYear && (
                            <InputGroup
                                label="Current Age"
                                value={params.currentAge}
                                onChange={(v) => handleChange('currentAge', v)}
                            />
                        )}
                        <InputGroup label="Retirement Age" value={params.retirementAge} onChange={(v) => handleChange('retirementAge', v)} />
                        <InputGroup label="Life Expectancy" value={params.lifeExpectancy} onChange={(v) => handleChange('lifeExpectancy', v)} />
                        <div className="border-t border-border my-4" />
                        <InputGroup label="Annual Return" value={Math.round(params.annualReturn * 10000) / 100} onChange={(v) => handleChange('annualReturn', v, 100)} step={0.1} suffix="%" />
                        <InputGroup label="Inflation" value={Math.round(params.inflationRate * 10000) / 100} onChange={(v) => handleChange('inflationRate', v, 100)} step={0.1} suffix="%" />
                        <InputGroup label="Safe Withdrawal" value={Math.round(params.safeWithdrawalRate * 10000) / 100} onChange={(v) => handleChange('safeWithdrawalRate', v, 100)} step={0.1} suffix="%" />

                        <div className="border-t border-border my-4" />
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Use Fixed Annual Spend</label>
                                <input
                                    type="checkbox"
                                    checked={params.useFixedSpend === true}
                                    onChange={(e) => onChange({ ...params, useFixedSpend: e.target.checked })}
                                    className="accent-primary h-4 w-4"
                                />
                            </div>
                            {params.useFixedSpend && (
                                <InputGroup
                                    label="Expected Annual Spend"
                                    value={params.expectedAnnualSpend || 0}
                                    onChange={(v) => handleChange('expectedAnnualSpend', v)}
                                    suffix="$"
                                    step={1000}
                                />
                            )}
                            <div className="space-y-2 mt-2">
                                <p className="text-[10px] text-muted-foreground italic">
                                    {params.useFixedSpend
                                        ? "Projections using fixed dollar amount (adjusted for inflation)."
                                        : "Projections using % of portfolio (Safe Withdrawal Rate)."}
                                </p>
                                {params.useFixedSpend && (
                                    <div className="bg-amber-50 border border-amber-100 p-2 rounded text-[10px] text-amber-800">
                                        <p className="font-bold mb-1 underline text-[9px] uppercase tracking-wider">Constant Buying Power</p>
                                        This amount represents your spend in <strong>today's dollars</strong>. We'll automatically adjust it for inflation in the model so your lifestyle stays constant.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-border my-4" />
                    </>
                )}

                {(activeTab === 'overview') && (
                    <>
                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 mt-6">Tax & Strategies</h4>
                        <InputGroup label="Est. Tax Rate" value={Math.round(params.effectiveTaxRate * 10000) / 100} onChange={(v) => handleChange('effectiveTaxRate', v, 100)} step={0.1} suffix="%" />

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide cursor-default">Withdrawal Strategy</label>
                            <select
                                value={params.withdrawalStrategy || 'sequence'}
                                onChange={(e) => onChange({ ...params, withdrawalStrategy: e.target.value as any })}
                                className="w-full bg-white text-foreground border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                            >
                                <option value="sequence">Sequence (Taxable-Pretax-Roth)</option>
                                <option value="pro-rata">Pro-rata (Balanced Drawdown)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide cursor-default">Enforce Roth 5-Year Rule</label>
                                <input
                                    type="checkbox"
                                    checked={params.enforceRothFiveYearRule !== false}
                                    onChange={(e) => onChange({ ...params, enforceRothFiveYearRule: e.target.checked })}
                                    className="accent-primary h-4 w-4"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Seasoning required for penalty-free conversion withdrawals.</p>
                        </div>
                    </>
                )}

                {(activeTab === 'roth') && (
                    <div className="mt-4 space-y-6 border-l-2 pl-4 transition-colors border-emerald-500 bg-emerald-50/30 -ml-4 p-4 rounded-r-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h5 className="text-sm font-bold text-emerald-800">Roth Conversion Ladder Guide</h5>
                                <p className="text-[10px] text-emerald-600/80 uppercase tracking-widest font-bold mt-1">Tax-Free Future Pipeline</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={params.enableRoth === true || (params.enableRoth === undefined && params.rothConversionAmount > 0)}
                                onChange={(e) => onChange({ ...params, enableRoth: e.target.checked })}
                                className="accent-emerald-600 h-5 w-5 cursor-pointer"
                            />
                        </div>

                        {(params.enableRoth === true || (params.enableRoth === undefined && params.rothConversionAmount > 0)) && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Step 1: The Concept */}
                                <div className="space-y-2">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                        The Concept
                                    </h6>
                                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        A <strong>Roth Conversion Ladder</strong> involves moving money from Pre-Tax accounts into a Roth IRA. You pay taxes now (ideally in early retirement when your income is low), gaining penalty-free access to those funds exactly 5 years later, and avoiding high taxes on future Required Minimum Distributions (RMDs).
                                    </p>
                                </div>

                                {/* Step 2: The Strategy Maker */}
                                <div className="space-y-3">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                        Your Strategy
                                    </h6>
                                    <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm space-y-4">
                                        <p className="text-xs text-slate-500 italic mb-2">Configure how much and when you plan to convert each year:</p>
                                        <InputGroup label="Target Annual Conversion" value={params.rothConversionAmount} onChange={(v) => handleChange('rothConversionAmount', v)} step={1000} suffix="$" />

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <InputGroup label="Start Conversions At Age" value={params.rothConversionStartAge} onChange={(v) => handleChange('rothConversionStartAge', v)} />
                                            <InputGroup label="End Conversions At Age" value={params.rothConversionEndAge} onChange={(v) => handleChange('rothConversionEndAge', v)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: The 5-Year Rule */}
                                <div className="space-y-3">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                        The 5-Year Seasoning Rule
                                    </h6>
                                    <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                                        {params.rothConversionAmount > 0 ? (
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-600">
                                                    Based on your strategy, your first conversion happens at age <strong>{params.rothConversionStartAge}</strong>.
                                                </p>
                                                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800 font-medium">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    That first ${params.rothConversionAmount.toLocaleString()} won't be penalty-free to withdraw until age {params.rothConversionStartAge + 5}.
                                                </div>
                                                <p className="text-xs text-slate-500 italic mt-2">
                                                    Make sure you have enough in your Taxable Brokerage to fund your life for those first 5 years!
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">
                                                Set a "Target Annual Conversion" above to see how the 5-year seasoning rule impacts your timeline.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'sepp') && (
                    <div className="mt-4 space-y-6 border-l-2 pl-4 transition-colors border-blue-500 bg-blue-50/30 -ml-4 p-4 rounded-r-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h5 className="text-sm font-bold text-blue-800">SEPP (72t) Distribution Guide</h5>
                                <p className="text-[10px] text-blue-600/80 uppercase tracking-widest font-bold mt-1">Penalty-Free Early Access</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={params.enableSEPP}
                                onChange={(e) => onChange({ ...params, enableSEPP: e.target.checked })}
                                className="accent-blue-600 h-5 w-5 cursor-pointer"
                            />
                        </div>

                        {params.enableSEPP && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Step 1: The Concept */}
                                <div className="space-y-2">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                        The Concept
                                    </h6>
                                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                        The IRS allows you to take money out of your <strong>Pre-Tax (401k/IRA)</strong> accounts early without the standard 10% penalty.
                                        The catch? You must take <em>substantially equal periodic payments</em> for at least 5 years or until you hit age 59.5, whichever is later.
                                    </p>
                                </div>

                                {/* Step 2: The Calculation */}
                                <div className="space-y-3">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                        Your Amortization Calculation
                                    </h6>
                                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm space-y-3">
                                        <p className="text-xs text-slate-500 italic">We use the exact IRS Amortization Method based on your plan parameters:</p>

                                        {(() => {
                                            const ageDiff = Math.max(0, params.seppStartAge - params.currentAge);
                                            const n = Math.max(1, params.lifeExpectancy - params.seppStartAge);
                                            const r = Math.min(params.annualReturn, 0.05); // Cap at 5% IRS limit
                                            const estimatedPretax = params.currentPreTax * Math.pow(1 + params.annualReturn, ageDiff);
                                            const seppAmount = r === 0 ? estimatedPretax / n : estimatedPretax * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

                                            return (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <span className="text-slate-500 block">Proj. Balance at Age {params.seppStartAge}</span>
                                                            <strong className="text-slate-800">${Math.round(estimatedPretax).toLocaleString()}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block">Interest Rate Used</span>
                                                            <strong className="text-slate-800">{(r * 100).toFixed(1)}% <span className="text-[10px] text-slate-400 font-normal ml-1">(IRS cap)</span></strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block">Life Expectancy</span>
                                                            <strong className="text-slate-800">{n} years</strong>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg text-center shadow-inner relative group cursor-help">
                                                        <span className="text-[10px] absolute top-2 right-2 text-blue-400 bg-white/60 rounded-full w-4 h-4 flex items-center justify-center font-bold">?</span>
                                                        <span className="text-xs text-blue-700/80 font-bold uppercase tracking-widest block mb-1">Estimated Annual Distribution</span>
                                                        <strong className="text-2xl text-blue-900 font-mono tracking-tight">${Math.round(seppAmount).toLocaleString()}<span className="text-sm font-sans text-blue-700/60 ml-1">/yr</span></strong>
                                                    </div>

                                                    <div className="mt-2 text-[10px] text-blue-600/70 leading-relaxed italic bg-blue-50/50 p-2 rounded border border-blue-100/50">
                                                        <strong>Why isn't this exactly 5%?</strong> The IRS Amortization method works like a mortgage. It calculates a payment that returns both the interest <em>and</em> a portion of the principal over your exact life expectancy, completely draining the balance over {n} years.
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Step 3: Execution Plan */}
                                <div className="space-y-3">
                                    <h6 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                        When to Execute
                                    </h6>
                                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm space-y-4">
                                        <InputGroup label="Start Distributions At Age" value={params.seppStartAge} onChange={(v) => handleChange('seppStartAge', v)} />

                                        <div className="bg-slate-50 border border-slate-100 rounded p-3 mt-2">
                                            <p className="text-xs text-slate-600">
                                                Based on a start age of <strong>{params.seppStartAge}</strong>, you must continue these exact payments until at least age <strong>{Math.max(params.seppStartAge + 5, 59.5)}</strong> to satisfy the IRS rules and avoid retroactive penalties.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-blue-200/50 text-[10px] text-blue-600/60 leading-tight flex gap-2">
                                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1.5">
                                        <p>
                                            This calculator uses the IRS Amortization Method, hard-capping the allowable interest rate at 5.0% for safety. Be sure to verify current <a href="https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-substantially-equal-periodic-payments" target="_blank" rel="noreferrer" className="underline hover:text-blue-700 transition-colors">IRS Section 72(t) rules</a> before executing this strategy.
                                        </p>
                                        <p>
                                            To run the numbers yourself, you can use the <a href="https://www.bankrate.com/retirement/72-t-distribution-calculator/" target="_blank" rel="noreferrer" className="underline hover:text-blue-700 transition-colors">Bankrate 72(t) Calculator</a>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(activeTab === 'overview') && (
                    <>
                        <div className="border-t border-border my-4" />
                        <InputGroup label="Monthly Contribution" value={params.monthlyContribution} onChange={(v) => handleChange('monthlyContribution', v)} step={100} suffix="$" />
                        <InputGroup label="Current Pre-Tax" value={params.currentPreTax} onChange={(v) => handleChange('currentPreTax', v)} step={1000} suffix="$" />
                        <InputGroup label="Current Roth" value={params.currentRoth} onChange={(v) => handleChange('currentRoth', v)} step={1000} suffix="$" />
                        <InputGroup label="Current Taxable" value={params.currentTaxable} onChange={(v) => handleChange('currentTaxable', v)} step={1000} suffix="$" />
                    </>
                )}
            </div>
        </div>
    );
}
