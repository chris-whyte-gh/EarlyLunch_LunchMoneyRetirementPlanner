import React, { useMemo } from 'react';
import { ProjectionResult, ModelingParams } from '../lib/modeling';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface RecommendationsProps {
    params: ModelingParams;
    result: ProjectionResult;
}

interface ActionableAdvice {
    id: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    title: string;
    description: React.ReactNode;
    icon: React.ElementType;
}

export function Recommendations({ params, result }: RecommendationsProps) {
    const recommendations = useMemo(() => {
        const advice: ActionableAdvice[] = [];
        const { retirementAge, currentAge } = params;
        const { points, failureAge } = result;

        // 1. Find key points in time
        const retirementPoint = points.find(p => p.age === retirementAge);
        const age59Point = points.find(p => p.age === 59);

        // 2. The Early Retirement Gap Problem
        const hasEarlyRetirementGap = retirementAge < 59.5;
        if (hasEarlyRetirementGap) {
            const gapYears = 59.5 - retirementAge;
            const taxableDepletedPoint = points.find(p => p.age >= retirementAge && p.age < 59.5 && p.taxableBalance <= 0);
            const seppActive = params.enableSEPP;
            const rothActive = params.enableRoth === true || (params.enableRoth === undefined && params.rothConversionAmount > 0);

            if (taxableDepletedPoint && !seppActive && !rothActive) {
                advice.push({
                    id: 'early-withdrawal-penalty',
                    type: 'critical',
                    title: 'Early Withdrawal Penalty Risk',
                    icon: AlertTriangle,
                    description: (
                        <div className="space-y-2">
                            <p>
                                You are retiring {gapYears} years before you can access Pre-Tax money penalty-free. Your Taxable Brokerage is projected to run out at <strong>age {taxableDepletedPoint.age}</strong>.
                            </p>
                            <p className="font-semibold text-rose-900 border-t border-rose-200 pt-2">
                                Recommendation: Go to the "Plan SEPP (72t)" tab or "Build Roth Ladder" tab to establish a penalty-free withdrawal strategy.
                            </p>
                        </div>
                    ),
                });
            } else if (seppActive || rothActive) {
                advice.push({
                    id: 'gap-bridged',
                    type: 'success',
                    title: 'Early Retirement Strategy Active',
                    icon: CheckCircle2,
                    description: (
                        <p>
                            You have successfully planned to bridge your {gapYears}-year early retirement gap using {seppActive ? 'SEPP (72t) distributions' : ''} {seppActive && rothActive ? 'and' : ''} {rothActive ? 'a Roth Conversion Ladder' : ''}. Your plan avoids early withdrawal penalties.
                        </p>
                    ),
                });
            }
        }

        // 3. The Savings Problem
        if (failureAge) {
            advice.push({
                id: 'portfolio-failure',
                type: 'critical',
                title: 'Portfolio Depletion Warning',
                icon: AlertTriangle,
                description: (
                    <div className="space-y-2">
                        <p>
                            Based on your expected spending, your portfolio may be depleted by <strong>age {failureAge}</strong>.
                        </p>
                        <p className="font-semibold text-rose-900 border-t border-rose-200 pt-2">
                            Recommendation: Consider increasing your Monthly Contribution, delaying your Retirement Age, or lowering your active Withdrawal Rate.
                        </p>
                    </div>
                ),
            });
        }

        // 4. Roth Optimization Opportunity
        if (retirementPoint && retirementPoint.preTaxBalance > (retirementPoint.totalNetWorth * 0.7) && !params.enableRoth) {
            advice.push({
                id: 'roth-opportunity',
                type: 'info',
                title: 'Consider Roth Conversions',
                icon: Lightbulb,
                description: (
                    <div className="space-y-2">
                        <p>
                            Over 70% of your projected retirement portfolio will be in Pre-Tax accounts (${formatCurrency(retirementPoint.preTaxBalance)}). This could lead to massive Required Minimum Distributions (RMDs) and taxes later in life.
                        </p>
                        <p className="font-semibold text-blue-900 border-t border-blue-200 pt-2">
                            Recommendation: Use the "Build Roth Ladder" tab to plan small annual conversions during early retirement while your income is low.
                        </p>
                    </div>
                ),
            });
        }

        // 5. Strategy Conflict Warning
        const seppActive = params.enableSEPP;
        const rothActive = params.enableRoth === true || (params.enableRoth === undefined && params.rothConversionAmount > 0);
        if (seppActive && rothActive) {
            advice.push({
                id: 'strategy-conflict',
                type: 'warning',
                title: 'Conflicting Tax Strategies (SEPP + Roth)',
                icon: AlertTriangle,
                description: (
                    <div className="space-y-2">
                        <p>
                            You have both <strong>SEPP (72t) Distributions</strong> and <strong>Roth Conversions</strong> active at the same time. Both strategies force withdrawals from your Pre-Tax balance, which can significantly increase your taxable income for the year.
                        </p>
                        <p className="font-semibold text-amber-900 border-t border-amber-200 pt-2">
                            Recommendation: Ensure these overlapping strategies do not push you into an unnecessarily high tax bracket, defeating the purpose of the conversion.
                        </p>
                    </div>
                ),
            });
        }

        // 6. Success State
        // 7. Final Success State Cleanup
        // If the only advice is the 'gap-bridged' success, add the generic 'on-track' success too for broad encouragement.
        if (advice.length === 0 && !failureAge) {
            advice.push({
                id: 'on-track',
                type: 'success',
                title: 'Plan is On Track!',
                icon: TrendingUp,
                description: (
                    <p>
                        Your current savings rate and balances are projected to successfully fund your retirement until age {params.lifeExpectancy} without running into early penalties or depletion. Keep it up!
                    </p>
                ),
            });
        }

        return advice;
    }, [params, result]);

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Personalized Strategy Recommendations</h2>
            <div className="grid grid-cols-1 gap-4">
                {recommendations.map((rec) => (
                    <div
                        key={rec.id}
                        className={cn(
                            "flex gap-4 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-4 duration-500",
                            {
                                'bg-rose-50 border-rose-200 text-rose-800': rec.type === 'critical',
                                'bg-amber-50 border-amber-200 text-amber-800': rec.type === 'warning',
                                'bg-emerald-50 border-emerald-200 text-emerald-800': rec.type === 'success',
                                'bg-blue-50 border-blue-200 text-blue-800': rec.type === 'info',
                            }
                        )}
                    >
                        <div className={cn(
                            "p-2.5 rounded-lg flex-shrink-0 h-min",
                            {
                                'bg-rose-100/80': rec.type === 'critical',
                                'bg-amber-100/80': rec.type === 'warning',
                                'bg-emerald-100/80': rec.type === 'success',
                                'bg-blue-100/80': rec.type === 'info',
                            }
                        )}>
                            <rec.icon className={cn("h-6 w-6")} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <h3 className="font-bold text-base leading-tight">
                                {rec.title}
                            </h3>
                            <div className="text-sm opacity-90 leading-relaxed">
                                {rec.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
