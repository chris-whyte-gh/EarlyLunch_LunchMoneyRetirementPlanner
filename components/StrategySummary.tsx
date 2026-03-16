"use client";

import React, { useMemo } from 'react';
import { ModelingParams, ProjectionResult } from '@/lib/modeling';
import { formatCurrency, cn } from '@/lib/utils';
import { Lightbulb, AlertOctagon, CheckCircle2, Info } from 'lucide-react';

interface StrategySummaryProps {
    params: ModelingParams;
    result: ProjectionResult;
}

export function StrategySummary({ params, result }: StrategySummaryProps) {
    const analysis = useMemo(() => {
        if (!result || result.points.length === 0) return null;

        const { retirementAge, enableSEPP, seppStartAge } = params;
        const earlyRetirementYears = 59.5 - retirementAge;

        // If retiring after 59.5, there is no "gap"
        if (earlyRetirementYears <= 0) {
            return {
                hasGap: false,
                message: "You are retiring after age 59.5. You can withdraw from any of your retirement accounts without early withdrawal penalties."
            };
        }

        // Filter points during the "Gap" (Retirement Age to 59.5)
        // We look at integer ages, so up to age 59 (inclusive)
        const gapPoints = result.points.filter(p => p.age >= retirementAge && p.age <= 59);

        if (gapPoints.length === 0) return null;

        let taxableDepletedAge: number | null = null;
        let taxableDepletedYear: number | null = null;
        let penaltyIncurred = false;
        let penaltyAge: number | null = null;
        let activeRothConversions = false;

        let totalGapSpend = 0;
        let fundedByTaxable = 0;
        let fundedByRoth = 0;
        let fundedByPreTax = 0;

        for (const pt of gapPoints) {
            totalGapSpend += pt.expenses + pt.withdrawalTaxable + pt.withdrawalPreTax + pt.withdrawalRoth;
            fundedByTaxable += pt.withdrawalTaxable;
            fundedByRoth += pt.withdrawalRoth;
            fundedByPreTax += pt.withdrawalPreTax;

            if (pt.taxableBalance <= 10 && taxableDepletedAge === null) {
                taxableDepletedAge = pt.age;
                taxableDepletedYear = pt.year;
            }

            // Detect penalties (PreTax withdrawal without SEPP, or Roth without seasoning)
            // The model handles the exact logic, but generally drawing pre-tax < 59.5 without SEPP = penalty
            // We can approximate by checking if pre-tax withdrawals exist while SEPP is off or hasn't started
            const seppActive = enableSEPP && pt.age >= seppStartAge;
            if (pt.withdrawalPreTax > 0 && !seppActive && !penaltyIncurred) {
                // If withdrawal is just to pay taxes on Roth Conversion, it might not be a penalty if paid from outside, 
                // but the model takes taxes from available funds.
                // Let's assume if we are withdrawing pre-tax for *expenses* or general strategy without SEPP, it's a penalty.
                penaltyIncurred = true;
                penaltyAge = pt.age;
            }

            if (pt.convertedAmount > 0) {
                activeRothConversions = true;
            }
        }

        let mainMessage = `To fund your early retirement from age ${retirementAge} to 59.5, `;

        if (taxableDepletedAge === null) {
            mainMessage += `your plan fully relies on your Taxable Brokerage and/or Roth accounts. You easily bridge the gap without touching Pre-Tax money, avoiding early withdrawal penalties entirely.`;
        } else {
            mainMessage += `your plan relies on your Taxable/Accessible accounts until age ${taxableDepletedAge}. `;

            if (penaltyIncurred) {
                if (enableSEPP) {
                    mainMessage += `After that, you begin withdrawing from Pre-Tax accounts before age 59.5. Even though you enabled SEPP, it seems you start withdrawing before your selected SEPP start age or withdraw more than allowed, triggering a 10% penalty.`;
                } else {
                    mainMessage += `After that, it pulls from your Pre-Tax accounts. Because this happens before age 59.5, it triggers a 10% early withdrawal penalty. Consider activating a SEPP Distribution starting around age ${taxableDepletedAge} to avoid these penalties.`;
                }
            } else if (enableSEPP) {
                mainMessage += `You then successfully use SEPP Distributions to access your Pre-Tax money penalty-free.`;
            } else {
                mainMessage += `However, you manage to avoid Pre-Tax penalties due to strategic Roth withdrawals or exhausting the gap period just in time.`;
            }
        }

        return {
            hasGap: true,
            mainMessage,
            taxableDepletedAge,
            penaltyIncurred,
            penaltyAge,
            activeRothConversions,
            seppActive: enableSEPP,
            stats: {
                totalGapSpend,
                fundedByTaxable,
                fundedByRoth,
                fundedByPreTax
            }
        };

    }, [result, params]);

    if (!analysis) return null;

    if (!analysis.hasGap) {
        return (
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">Standard Retirement Phase</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-white border rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 transition-colors",
            analysis.penaltyIncurred ? "border-amber-200 bg-amber-50/30" : "border-border"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn(
                    "p-3 rounded-xl border",
                    analysis.penaltyIncurred ? "bg-amber-100 border-amber-200" : "bg-emerald-50 border-emerald-100"
                )}>
                    {analysis.penaltyIncurred ? (
                        <AlertOctagon className="h-6 w-6 text-amber-600" />
                    ) : (
                        <Lightbulb className="h-6 w-6 text-emerald-600" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Bridging the Gap
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-200">
                            Age {params.retirementAge} &rarr; 59.5
                        </span>
                    </h3>

                    <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                        {analysis.mainMessage}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {analysis.activeRothConversions && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                <CheckCircle2 className="h-3 w-3" /> Active: Roth Conversions
                            </span>
                        )}
                        {analysis.seppActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                <CheckCircle2 className="h-3 w-3" /> Active: SEPP Distributions
                            </span>
                        )}
                        {!analysis.activeRothConversions && !analysis.seppActive && !analysis.penaltyIncurred && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                No Advanced Strategies Active
                            </span>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
