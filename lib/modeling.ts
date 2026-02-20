import { Asset, Transaction } from './lunchmoney';

export function adjustForInflation(amount: number, years: number, inflationRate: number): number {
    return amount / Math.pow(1 + inflationRate, years);
}

export type TaxBucket = 'taxable' | 'pretax' | 'roth';
export type WithdrawalStrategy = 'sequence' | 'pro-rata';

export interface ScenarioPhase {
    id: string;
    label: string;
    startAge: number;
    endAge: number;
    returnAdjustment: number; // e.g. +0.02 for 2% higher
    spendingAdjustment: number; // e.g. 1.2 for 20% more spending
    withdrawalRate?: number; // e.g. 0.05 for 5% SWR override
    color: string; // 'green' | 'red' for UI
}

export interface ModelingParams {
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;

    // Balances
    currentPreTax: number;
    currentRoth: number;
    currentTaxable: number;

    // Cash Flow
    monthlyContribution: number;

    // Rates
    annualReturn: number;
    inflationRate: number;
    safeWithdrawalRate: number;

    // Taxes
    effectiveTaxRate: number;

    // Advanced Strategies
    rothConversionAmount: number;
    rothConversionStartAge: number;
    rothConversionEndAge: number;

    enableSEPP: boolean;
    seppStartAge: number;

    withdrawalStrategy?: WithdrawalStrategy;
    enforceRothFiveYearRule?: boolean;
    phases?: ScenarioPhase[];
    stressTestEnabled?: boolean;
}

export interface ProjectionPoint {
    age: number;
    year: number;

    // Balances
    totalNetWorth: number;
    preTaxBalance: number;
    rothBalance: number;
    taxableBalance: number;

    // Flows
    contributions: number;
    growth: number;
    expenses: number;

    // Strategy Details
    convertedAmount: number;
    seppWithdrawal: number;
    taxesPaid: number;

    isRetired: boolean;
}

interface RothBucket {
    amount: number;
    years: number;
}

export function categorizeAsset(asset: Asset): TaxBucket {
    const name = (asset.name || '').toLowerCase();
    const typeName = (asset.type_name || '').toLowerCase();
    const subtype = (asset.subtype_name || '').toLowerCase();

    if (name.includes('roth') || subtype.includes('roth')) return 'roth';
    if (name.includes('401k') || subtype.includes('401k') || name.includes('ira') || subtype.includes('ira')) {
        if (name.includes('roth') || subtype.includes('roth')) return 'roth';
        return 'pretax';
    }
    return 'taxable';
}

export function calculateBuckets(assets: Asset[]): { taxable: number, pretax: number, roth: number } {
    return assets.reduce((acc, asset) => {
        const balance = parseFloat(asset.balance);
        const bucket = categorizeAsset(asset);
        acc[bucket] += balance;
        return acc;
    }, { taxable: 0, pretax: 0, roth: 0 });
}

export function calculateMonthlyExpenses(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    const expenses = transactions
        .filter(t => parseFloat(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffMonths = (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30.44);
    return diffMonths > 0 ? expenses / diffMonths : expenses;
}

export interface ProjectionResult {
    points: ProjectionPoint[];
    failureAge?: number;
    failureYear?: number;
}

const HISTORICAL_CRASH_SEQUENCE = [-0.091, -0.119, -0.221, 0.287, 0.109]; // 2000-2004 S&P 500

/**
 * Helper: Roth Withdrawal with 5-year and Character Rules
 * Characters:
 * 1. seasoned (all original Roth + conversions older than 5 years)
 * 2. unseasoned (conversions younger than 5 years)
 */
function handleRothWithdrawal(remainingNeed: number, currentRoth: number, buckets: RothBucket[], age: number, enforce: boolean) {
    if (remainingNeed <= 0 || currentRoth <= 0) return { withdrawn: 0, taxes: 0 };

    if (!enforce || age >= 59.5) {
        const amount = Math.min(currentRoth, remainingNeed);
        return { withdrawn: amount, taxes: 0 };
    }

    const unseasonedTotal = buckets.filter(b => b.years < 5).reduce((sum, b) => sum + b.amount, 0);
    const seasonedTotal = Math.max(0, currentRoth - unseasonedTotal);

    let withdrawnTotal = 0;
    let taxesPaid = 0;
    let need = remainingNeed;

    // 1. Withdraw from Seasoned
    const fromSeasoned = Math.min(seasonedTotal, need);
    withdrawnTotal += fromSeasoned;
    need -= fromSeasoned;

    // 2. Withdraw from Unseasoned (triggers 10% penalty)
    if (need > 0 && unseasonedTotal > 0) {
        const penaltyRate = 0.10;
        const grossNeed = need / (1 - penaltyRate);
        const actualFromUnseasoned = Math.min(unseasonedTotal, grossNeed);
        const netFromUnseasoned = actualFromUnseasoned * (1 - penaltyRate);

        withdrawnTotal += netFromUnseasoned;
        taxesPaid += (actualFromUnseasoned - netFromUnseasoned);
        need -= netFromUnseasoned;

        let toDeduct = actualFromUnseasoned;
        for (const b of buckets.filter(b => b.years < 5).sort((a, b) => b.years - a.years)) {
            const take = Math.min(b.amount, toDeduct);
            b.amount -= take;
            toDeduct -= take;
            if (toDeduct <= 0) break;
        }
    }

    return { withdrawn: withdrawnTotal, taxes: taxesPaid };
}

export function calculateProjection(params: ModelingParams): ProjectionResult {
    const {
        currentAge,
        retirementAge,
        lifeExpectancy,
        monthlyContribution,
        annualReturn,
        inflationRate,
        safeWithdrawalRate,
        effectiveTaxRate,
        rothConversionAmount,
        rothConversionStartAge,
        rothConversionEndAge,
        enableSEPP,
        seppStartAge,
        withdrawalStrategy = 'sequence',
        enforceRothFiveYearRule = true,
        stressTestEnabled = false,
    } = params;

    let pretax = Math.max(0, params.currentPreTax);
    let roth = Math.max(0, params.currentRoth);
    let taxable = Math.max(0, params.currentTaxable);

    let rothBuckets: RothBucket[] = [];
    const currentYear = new Date().getFullYear();
    const points: ProjectionPoint[] = [];
    let failureAge: number | undefined;
    let failureYear: number | undefined;

    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const monthlyInflation = Math.pow(1 + inflationRate, 1 / 12) - 1;
    let currentMonthlyContribution = monthlyContribution;

    let seppAnnualAmount = 0;
    let seppCalculated = false;

    points.push({
        age: currentAge,
        year: currentYear,
        totalNetWorth: pretax + roth + taxable,
        preTaxBalance: pretax,
        rothBalance: roth,
        taxableBalance: taxable,
        contributions: 0,
        growth: 0,
        expenses: 0,
        convertedAmount: 0,
        seppWithdrawal: 0,
        taxesPaid: 0,
        isRetired: currentAge >= retirementAge
    });

    for (let age = currentAge + 1; age <= lifeExpectancy; age++) {
        let yearGrowth = 0;
        let yearContributions = 0;
        let yearExpenses = 0;
        let yearConverted = 0;
        let yearTaxes = 0;
        let yearSepp = 0;
        const isRetired = age >= retirementAge;

        if (enableSEPP && age >= seppStartAge && age < 59.5 && !seppCalculated && pretax > 0) {
            const n = Math.max(10, lifeExpectancy - age);
            const r = annualReturn;
            seppAnnualAmount = (r === 0) ? (pretax / n) : (pretax * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
            seppCalculated = true;
        }
        if (age >= 60) seppAnnualAmount = 0;

        let amountToConvert = 0;
        if (age >= rothConversionStartAge && age <= rothConversionEndAge && pretax > 0) {
            amountToConvert = Math.min(pretax, rothConversionAmount);
        }

        // Apply Scenario Phase Adjustments (Aggregate all active phases)
        let activeReturn = annualReturn;
        let activeWithdrawalRate = safeWithdrawalRate;
        let spendingMultiplier = 1.0;

        const activePhases = params.phases?.filter(p => age >= p.startAge && age <= p.endAge) || [];
        for (const phase of activePhases) {
            activeReturn += phase.returnAdjustment;
            spendingMultiplier *= phase.spendingAdjustment;
            if (phase.withdrawalRate !== undefined) {
                activeWithdrawalRate = phase.withdrawalRate; // Most specific (last one) wins for rate override
            }
        }

        // Apply Stress Test Sequence if enabled and retired
        if (stressTestEnabled && age >= retirementAge) {
            const yearsIntoRetirement = age - retirementAge;
            if (yearsIntoRetirement < HISTORICAL_CRASH_SEQUENCE.length) {
                activeReturn = HISTORICAL_CRASH_SEQUENCE[yearsIntoRetirement];
            }
        }

        const activeMonthlyReturn = Math.pow(1 + activeReturn, 1 / 12) - 1;

        for (let m = 0; m < 12; m++) {
            const pretaxGrowth = pretax > 0 ? pretax * activeMonthlyReturn : 0;
            const rothGrowth = roth > 0 ? roth * activeMonthlyReturn : 0;
            const taxableGrowth = taxable > 0 ? taxable * activeMonthlyReturn : 0;

            yearGrowth += (pretaxGrowth + rothGrowth + taxableGrowth);
            pretax += pretaxGrowth;
            roth += rothGrowth;
            taxable += taxableGrowth;

            if (rothGrowth !== 0 && roth > 0) {
                const growthFactor = 1 + (rothGrowth / (roth - rothGrowth));
                rothBuckets = rothBuckets.map(b => ({ ...b, amount: b.amount * growthFactor }));
            }

            if (!isRetired) {
                taxable += currentMonthlyContribution;
                yearContributions += currentMonthlyContribution;
                currentMonthlyContribution *= (1 + monthlyInflation);
            } else {
                const totalNW = Math.max(0, pretax + roth + taxable);
                let withdrawalNeed = totalNW * (activeWithdrawalRate / 12);

                // Apply Aggregate Spending Adjustment
                withdrawalNeed *= spendingMultiplier;

                let remainingNeed = Math.max(0, withdrawalNeed);

                if (remainingNeed > 0) {
                    const monthlyAllowedSepp = seppAnnualAmount / 12;
                    if (monthlyAllowedSepp > 0 && pretax > 0) {
                        const actualSepp = Math.min(pretax, monthlyAllowedSepp);
                        pretax -= actualSepp;
                        yearSepp += actualSepp;
                        remainingNeed -= actualSepp;
                        const tax = actualSepp * effectiveTaxRate;
                        if (taxable >= tax) taxable -= tax;
                        else remainingNeed += tax;
                        yearTaxes += tax;
                    }

                    if (remainingNeed > 0) {
                        if (withdrawalStrategy === 'pro-rata') {
                            const currentTotal = pretax + roth + taxable;
                            if (currentTotal > 0) {
                                let taxablePortion = (taxable / currentTotal) * remainingNeed;
                                let pretaxPortion = (pretax / currentTotal) * remainingNeed;
                                let rothPortion = (roth / currentTotal) * remainingNeed;

                                const fromTaxable = Math.min(taxable, taxablePortion);
                                taxable -= fromTaxable;
                                let carryover = taxablePortion - fromTaxable;

                                let targetPretax = pretaxPortion + carryover;
                                const penaltyRate = age < 59.5 ? 0.10 : 0;
                                const totalTaxRate = effectiveTaxRate + penaltyRate;
                                const grossPretax = targetPretax / (1 - totalTaxRate);
                                const fromPretax = Math.min(pretax, grossPretax);
                                const netPretax = fromPretax * (1 - totalTaxRate);
                                pretax -= fromPretax;
                                yearTaxes += (fromPretax - netPretax);
                                carryover = targetPretax - netPretax;

                                let targetRoth = rothPortion + carryover;
                                const rothResult = handleRothWithdrawal(targetRoth, roth, rothBuckets, age, enforceRothFiveYearRule);
                                roth -= (rothResult.withdrawn + rothResult.taxes);
                                yearTaxes += rothResult.taxes;
                                remainingNeed -= (fromTaxable + netPretax + rothResult.withdrawn);
                            } else {
                                remainingNeed = 0;
                            }
                        } else {
                            const fromTaxable = Math.min(taxable, remainingNeed);
                            taxable -= fromTaxable;
                            remainingNeed -= fromTaxable;

                            if (remainingNeed > 0 && pretax > 0) {
                                const penaltyRate = age < 59.5 ? 0.10 : 0;
                                const totalTaxRate = effectiveTaxRate + penaltyRate;
                                const grossPretax = remainingNeed / (1 - totalTaxRate);
                                const actualPretax = Math.min(pretax, grossPretax);
                                const netAvailable = actualPretax * (1 - totalTaxRate);
                                pretax -= actualPretax;
                                yearTaxes += (actualPretax - netAvailable);
                                remainingNeed -= netAvailable;
                            }

                            if (remainingNeed > 0 && roth > 0) {
                                const rothResult = handleRothWithdrawal(remainingNeed, roth, rothBuckets, age, enforceRothFiveYearRule);
                                roth -= (rothResult.withdrawn + rothResult.taxes);
                                yearTaxes += rothResult.taxes;
                                remainingNeed -= rothResult.withdrawn;
                            }
                        }
                    }
                    yearExpenses += (withdrawalNeed - remainingNeed);
                }
            }
            pretax = Math.max(0, pretax);
            roth = Math.max(0, roth);
            taxable = Math.max(0, taxable);
        }

        rothBuckets = rothBuckets.map(b => ({ ...b, years: b.years + 1 }));

        if (amountToConvert > 0) {
            const taxCost = amountToConvert * effectiveTaxRate;
            if (taxable >= taxCost && pretax >= amountToConvert) {
                taxable -= taxCost;
                pretax -= amountToConvert;
                roth += amountToConvert;
                yearConverted += amountToConvert;
                yearTaxes += taxCost;
                rothBuckets.push({ amount: amountToConvert, years: 0 });
            }
        }

        const totalNW = pretax + roth + taxable;
        if (isRetired && totalNW <= 0 && failureAge === undefined) {
            failureAge = age;
            failureYear = currentYear + (age - currentAge);
        }

        points.push({
            age,
            year: currentYear + (age - currentAge),
            totalNetWorth: totalNW,
            preTaxBalance: pretax,
            rothBalance: roth,
            taxableBalance: taxable,
            contributions: yearContributions,
            growth: yearGrowth,
            expenses: yearExpenses,
            convertedAmount: yearConverted,
            seppWithdrawal: yearSepp,
            taxesPaid: yearTaxes,
            isRetired
        });
    }

    return { points, failureAge, failureYear };
}

export interface FireMetrics {
    coastFireNumber: number;
    isCoastFire: boolean;
    coastFireProgress: number; // 0 to 100
    gapToCoastFire: number;
    targetPortfolio: number;
    projectedPortfolio: number;
    monthlySavingsGap: number;
    actualCalculatedSpend?: number;
}

export function calculateFireMetrics(params: ModelingParams, currentNetWorth: number, targetNetWorth: number): FireMetrics {
    const { currentAge, retirementAge, annualReturn } = params;
    const yearsToGrowth = Math.max(0, retirementAge - currentAge);

    // Coast FIRE Number: How much is needed today to reach targetNetWorth at retirementAge
    // Formula: PV = FV / (1 + r)^n
    const coastFireNumber = targetNetWorth / Math.pow(1 + annualReturn, yearsToGrowth);

    const isCoastFire = currentNetWorth >= coastFireNumber;
    const coastFireProgress = Math.min(100, (currentNetWorth / coastFireNumber) * 100);
    const gapToCoastFire = Math.max(0, coastFireNumber - currentNetWorth);

    // Calculate Monthly Savings Gap
    // How much extra per month is needed to reach targetNetWorth if projected is less?
    // We'll calculate this based on the difference at retirement
    // Note: This is an approximation since it doesn't account for complex phase shifts,
    // but works for the "nudge" context.

    // For a more accurate "Save More" nudge, we'd need the projected portfolio at retirement
    // This function will be called with the actual projected portfolio from the Dashboard
    // so we'll just use the targetNetWorth vs currentNetWorth logic here.

    const monthsToRetire = yearsToGrowth * 12;
    const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;

    let monthlySavingsGap = 0;
    if (monthsToRetire > 0) {
        // FV of current portfolio at retirement
        const currentFV = currentNetWorth * Math.pow(1 + annualReturn, yearsToGrowth);
        const shortfall = Math.max(0, targetNetWorth - currentFV);

        if (shortfall > 0) {
            // PMT = (shortfall * r) / ((1 + r)^n - 1)
            monthlySavingsGap = (shortfall * monthlyRate) / (Math.pow(1 + monthlyRate, monthsToRetire) - 1);
        }
    }

    return {
        coastFireNumber,
        isCoastFire,
        coastFireProgress,
        gapToCoastFire,
        targetPortfolio: targetNetWorth,
        projectedPortfolio: 0, // Will be overridden by Dashboard
        monthlySavingsGap
    };
}
