"use client";

import { useState, useEffect, useMemo } from 'react';
import { Asset, Transaction, Budget } from '@/lib/lunchmoney';
import { calculateBuckets, calculateProjection, calculateMonthlyExpenses, ProjectionResult, ModelingParams, ScenarioPhase, calculateFireMetrics, calculateRealValue } from '@/lib/modeling';
import { ProjectionChart } from './ProjectionChart';
import { ConfigPanel } from './ConfigPanel';
import { TopNav } from './TopNav';
import { SettingsView } from './SettingsView';
import { BeginnerGuide } from './BeginnerGuide';
import { cn, formatCurrency } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import { TrendingUp, AlertTriangle, Settings2, Info, Award, Zap, Check } from 'lucide-react';
import { AdvancedScenarios } from './AdvancedScenarios';
import { WithdrawalChart } from './WithdrawalChart';
import { Recommendations } from './Recommendations';
import { QuickStart } from './QuickStart';
import { SimpleDashboard } from './SimpleDashboard';

interface DashboardProps {
    initialAssets: Asset[];
    initialTransactions: Transaction[];
}

// Define DEFAULT_PARAMS if it's a new constant, otherwise, the user's instruction implies replacing the inline object.
// Assuming DEFAULT_PARAMS is a new constant that should be defined or imported.
// For the purpose of this edit, I will assume it's a placeholder for the original default params.
// If DEFAULT_PARAMS is not defined elsewhere, this would cause a reference error.
// Given the instruction is to "remove unused imports" and "escape apostrophes" and then provides a diff,
// I will apply the diff as-is, which includes changing the `params` initialization.
// To make the code syntactically correct, I'll define a placeholder DEFAULT_PARAMS.
// In a real scenario, DEFAULT_PARAMS would likely be imported or defined globally.
const DEFAULT_PARAMS: ModelingParams = {
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 90,

    currentPreTax: 0,
    currentRoth: 0,
    currentTaxable: 0,

    monthlyContribution: 1000,
    annualReturn: 0.07,
    inflationRate: 0.03,
    safeWithdrawalRate: 0.04,

    effectiveTaxRate: 0.15,
    rothConversionAmount: 0,
    rothConversionStartAge: 40,
    rothConversionEndAge: 50,
    enableSEPP: false,
    seppStartAge: 40,
    withdrawalStrategy: 'sequence',
    enforceRothFiveYearRule: true,
    phases: [],
    useFixedSpend: false,
    expectedAnnualSpend: 40000,
};


export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    // Load active tab on mount
    useEffect(() => {
        const storedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
        if (storedTab) setActiveTab(storedTab);
    }, []);

    // Save active tab on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }, [activeTab]);

    // Modeling State
    const [params, setParams] = useState<ModelingParams>(DEFAULT_PARAMS);

    const [projectionResult, setProjectionResult] = useState<ProjectionResult>({ points: [] });
    const [birthYear, setBirthYear] = useState<number | undefined>(undefined);
    const [isParamsLoaded, setIsParamsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<{ message: string, code?: string } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [viewMode, setViewMode] = useState<'nominal' | 'real'>('real');
    const [spendingSourceIds, setSpendingSourceIds] = useState<number[]>([]);
    const [useActualSpend, setUseActualSpend] = useState(false);
    const [estimatedMonthlySpend, setEstimatedMonthlySpend] = useState(0);
    const [showQuickStart, setShowQuickStart] = useState(true);
    const [dashboardMode, setDashboardMode] = useState<'simple' | 'details' | 'advanced'>('simple');

    // Load saved scenario params on mount
    useEffect(() => {
        const savedParamsStr = localStorage.getItem(STORAGE_KEYS.SCENARIO_PARAMS);
        if (savedParamsStr) {
            try {
                const savedParams = JSON.parse(savedParamsStr);
                setParams(prev => ({
                    ...prev,
                    // Only restore specific user-configurable fields
                    retirementAge: savedParams.retirementAge ?? prev.retirementAge,
                    lifeExpectancy: savedParams.lifeExpectancy ?? prev.lifeExpectancy,
                    monthlyContribution: savedParams.monthlyContribution ?? prev.monthlyContribution,
                    annualReturn: savedParams.annualReturn ?? prev.annualReturn,
                    inflationRate: savedParams.inflationRate ?? prev.inflationRate,
                    safeWithdrawalRate: savedParams.safeWithdrawalRate ?? prev.safeWithdrawalRate,
                    effectiveTaxRate: savedParams.effectiveTaxRate ?? prev.effectiveTaxRate,
                    rothConversionAmount: savedParams.rothConversionAmount ?? prev.rothConversionAmount,
                    rothConversionStartAge: savedParams.rothConversionStartAge ?? prev.rothConversionStartAge,
                    rothConversionEndAge: savedParams.rothConversionEndAge ?? prev.rothConversionEndAge,
                    enableSEPP: savedParams.enableSEPP ?? prev.enableSEPP,
                    seppStartAge: savedParams.seppStartAge ?? prev.seppStartAge,
                    withdrawalStrategy: savedParams.withdrawalStrategy ?? prev.withdrawalStrategy,
                    enforceRothFiveYearRule: savedParams.enforceRothFiveYearRule ?? prev.enforceRothFiveYearRule,
                    phases: savedParams.phases ?? prev.phases,
                    useFixedSpend: savedParams.useFixedSpend ?? prev.useFixedSpend,
                    expectedAnnualSpend: savedParams.expectedAnnualSpend ?? prev.expectedAnnualSpend,
                }));
            } catch (e) {
                console.error("Failed to load scenario params", e);
            }
        }
        setIsParamsLoaded(true);
    }, []);

    // Save scenario params on change
    useEffect(() => {
        if (!isParamsLoaded) return;

        const paramsToSave = {
            retirementAge: params.retirementAge,
            lifeExpectancy: params.lifeExpectancy,
            monthlyContribution: params.monthlyContribution,
            annualReturn: params.annualReturn,
            inflationRate: params.inflationRate,
            safeWithdrawalRate: params.safeWithdrawalRate,
            effectiveTaxRate: params.effectiveTaxRate,
            rothConversionAmount: params.rothConversionAmount,
            rothConversionStartAge: params.rothConversionStartAge,
            rothConversionEndAge: params.rothConversionEndAge,
            enableSEPP: params.enableSEPP,
            seppStartAge: params.seppStartAge,
            withdrawalStrategy: params.withdrawalStrategy,
            enforceRothFiveYearRule: params.enforceRothFiveYearRule,
            phases: params.phases,
            useFixedSpend: params.useFixedSpend,
            expectedAnnualSpend: params.expectedAnnualSpend,
        };
        localStorage.setItem(STORAGE_KEYS.SCENARIO_PARAMS, JSON.stringify(paramsToSave));
    }, [params, isParamsLoaded]);

    // Calculate Derived Params when Data Loads
    useEffect(() => {
        async function loadData() {
            try {
                // Check for token in localStorage
                const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                const birthYearStr = localStorage.getItem(STORAGE_KEYS.BIRTH_YEAR);
                const birthMonthStr = localStorage.getItem(STORAGE_KEYS.BIRTH_MONTH);

                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/lunchmoney', { headers });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.warn("API request failed:", res.status, errorData);
                    setLoadError({
                        message: errorData.error || "Failed to load financial data",
                        code: errorData.code
                    });
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setLoadError(null);

                // Unpack excluded IDs and spending sources
                let excludedIds: number[] = [];
                let spendingIds: number[] = [];
                const excludedStr = localStorage.getItem(STORAGE_KEYS.EXCLUDED_ASSETS);
                const spendingStr = localStorage.getItem(STORAGE_KEYS.SPENDING_SOURCES);

                if (excludedStr) {
                    try { excludedIds = JSON.parse(excludedStr); } catch (e) { console.error("Error parsing excluded ids", e); }
                }
                if (spendingStr) {
                    try {
                        spendingIds = JSON.parse(spendingStr);
                        setSpendingSourceIds(spendingIds);
                    } catch (e) {
                        console.error("Error parsing spending ids", e);
                    }
                }

                // Filter & Categorize Assets
                const filteredAssets = (data.assets as Asset[]).filter(a => !excludedIds.includes(a.id));
                const buckets = calculateBuckets(filteredAssets);

                // Calculate Age if Birth Year exists
                let calculatedAge = undefined;
                if (birthYearStr) {
                    const year = parseInt(birthYearStr);
                    if (!isNaN(year)) {
                        setBirthYear(year);

                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth() + 1; // 1-12

                        let age = currentYear - year;

                        // Adjust for birth month if available
                        if (birthMonthStr) {
                            const month = parseInt(birthMonthStr);
                            if (!isNaN(month)) {
                                if (currentMonth < month) {
                                    age--;
                                }
                            }
                        }

                        calculatedAge = age;
                    } else {
                        setBirthYear(undefined);
                    }
                } else {
                    setBirthYear(undefined);
                }

                // Calculate annual spend from budgets
                let calculatedAnnualSpend = undefined;
                if (data.budgets && (data.budgets as Budget[]).length > 0) {
                    const budgetTotal = (data.budgets as Budget[])
                        .filter(b => !b.is_income && !b.exclude_from_budget)
                        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
                    if (budgetTotal > 0) {
                        calculatedAnnualSpend = budgetTotal * 12;
                    }
                }

                setParams(prev => {
                    // We only want to override expectedAnnualSpend if it's the first time or demo
                    const shouldOverrideSpend = !localStorage.getItem(STORAGE_KEYS.SCENARIO_PARAMS) || token === 'demo';

                    return {
                        ...prev,
                        currentAge: calculatedAge ?? prev.currentAge,
                        currentPreTax: buckets.pretax,
                        currentRoth: buckets.roth,
                        currentTaxable: buckets.taxable,
                        expectedAnnualSpend: (shouldOverrideSpend && calculatedAnnualSpend) ? calculatedAnnualSpend : prev.expectedAnnualSpend,
                    };
                });

                // Calculate spending from transactions
                if (data.transactions && spendingIds.length > 0) {
                    const spendingTransactions = (data.transactions as Transaction[]).filter(t =>
                        (t.asset_id && spendingIds.includes(t.asset_id)) ||
                        (t.plaid_account_id && spendingIds.includes(t.plaid_account_id))
                    );

                    if (spendingTransactions.length > 0) {
                        const monthlyMean = calculateMonthlyExpenses(spendingTransactions);
                        setEstimatedMonthlySpend(monthlyMean);
                    }
                }
            } catch (e) {
                console.error("Could not load Lunch Money data", e);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [activeTab]);

    // Recalculate Projection when Params change
    useEffect(() => {
        const result = calculateProjection(params);
        setProjectionResult(result);
    }, [params]);


    // Helper to get value based on view mode (nominal vs real)
    const getValue = (amount: number, age: number) => {
        return calculateRealValue(amount, age, params.currentAge, params.inflationRate, viewMode);
    };

    const totalNetWorth = params.currentPreTax + params.currentRoth + params.currentTaxable;

    const fireMetrics = useMemo(() => {
        if (!projectionResult || projectionResult.points.length === 0) return null;
        const retirementPoint = projectionResult.points.find(p => p.age === params.retirementAge);
        if (!retirementPoint) return null;

        // Use actual spend if toggled, otherwise use fixed spend if toggled, otherwise use projected SWR spend
        const targetMonthlySpend = (useActualSpend && estimatedMonthlySpend > 0)
            ? estimatedMonthlySpend
            : params.useFixedSpend && params.expectedAnnualSpend
                ? (params.expectedAnnualSpend / 12)
                : calculateRealValue((retirementPoint.totalNetWorth * (params.safeWithdrawalRate / 12)), params.retirementAge, params.currentAge, params.inflationRate, 'real');

        const targetNW = (targetMonthlySpend * 12) / params.safeWithdrawalRate;

        // COAST FIRE: How much is needed today to reach targetNW in yearsToGrowth
        const yearsToGrowth = Math.max(0, params.retirementAge - params.currentAge);
        const coastFireNumber = targetNW / Math.pow(1 + params.annualReturn, yearsToGrowth);

        const isCoastFire = totalNetWorth >= coastFireNumber;
        const coastFireProgress = Math.min(100, (totalNetWorth / coastFireNumber) * 100);
        const gapToCoastFire = Math.max(0, coastFireNumber - totalNetWorth);

        // Calculate Save More Nudge
        // How much EXTRA per month to reach targetNW if projection falls short
        const monthsToRetire = yearsToGrowth * 12;
        const monthlyRate = Math.pow(1 + params.annualReturn, 1 / 12) - 1;

        let monthlySavingsGap = 0;
        if (monthsToRetire > 0) {
            const projectedFV = retirementPoint.totalNetWorth;
            const shortfall = Math.max(0, targetNW - projectedFV);
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
            targetPortfolio: targetNW,
            projectedPortfolio: retirementPoint.totalNetWorth,
            monthlySavingsGap,
            actualCalculatedSpend: estimatedMonthlySpend
        };
    }, [projectionResult, params, totalNetWorth, useActualSpend, estimatedMonthlySpend]);

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Loading Financial Data...</div>
    }

    const projection = projectionResult.points;

    return (
        <div className="min-h-screen bg-[#F6F8FA]">
            <TopNav 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                onQuickStart={() => setShowQuickStart(true)}
                showQuickStartButton={!showQuickStart}
            />

            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {activeTab === 'settings' ? (
                    <SettingsView />
                ) : activeTab === 'guide' ? (
                    <BeginnerGuide />
                ) : loadError && (loadError.code === 'MISSING_TOKEN' || loadError.code === 'INVALID_TOKEN' || loadError.code === 'API_ERROR') ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-2xl mx-auto">
                        <div className="p-6 bg-white border border-border rounded-2xl shadow-sm space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8 text-emerald-700" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {loadError.code === 'MISSING_TOKEN' ? "Lunch Money Connection Required" : "Connection Issue"}
                            </h2>
                            <p className="text-muted-foreground">
                                {loadError.code === 'MISSING_TOKEN'
                                    ? "To see your retirement projection, you need to connect your Lunch Money account using an Access Token."
                                    : `We couldn't reach Lunch Money: ${loadError.message}`}
                            </p>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95"
                            >
                                Go to Settings
                            </button>
                            <p className="text-xs text-muted-foreground pt-4">
                                <span className="font-bold">Tip:</span> Enter <code className="bg-muted px-1 rounded text-primary">demo</code> as your token in Settings to try the app with sample data.
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                            Your data never leaves your machine.
                        </p>
                    </div>
                ) : showQuickStart ? (
                    <QuickStart 
                        params={params} 
                        onChange={setParams}
                        onAdvancedMode={() => {
                            setShowQuickStart(false);
                            setDashboardMode('simple');
                        }}
                    />
                ) : dashboardMode === 'simple' ? (
                    <SimpleDashboard 
                        params={params}
                        projectionResult={projectionResult}
                        onDetailsMode={() => setDashboardMode('details')}
                        onAdvancedMode={() => setDashboardMode('advanced')}
                        onParamsChange={setParams}
                    />
                ) : dashboardMode === 'details' ? (
                    <>
                        {/* Details Mode - Simplified version of advanced */}
                        <header className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Detailed Retirement Analysis
                                </h1>
                                <p className="text-muted-foreground">
                                    Comprehensive charts and projections for your retirement planning
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDashboardMode('simple')}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    Simple View
                                </button>
                                <button
                                    onClick={() => setDashboardMode('advanced')}
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                                >
                                    Advanced
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Main Projection Chart */}
                                <ProjectionChart 
                                    data={projectionResult.points} 
                                    viewMode={viewMode}
                                    retirementAge={params.retirementAge}
                                    inflationRate={params.inflationRate}
                                    currentAge={params.currentAge}
                                />
                                
                                {/* Withdrawal Chart */}
                                <WithdrawalChart 
                                    data={projectionResult.points}
                                    viewMode={viewMode}
                                    retirementAge={params.retirementAge}
                                    inflationRate={params.inflationRate}
                                    currentAge={params.currentAge}
                                />
                            </div>

                            <div className="lg:col-span-1 space-y-8">
                                {/* Key Metrics */}
                                <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Key Results</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Monthly Retirement Income</div>
                                            <div className="text-2xl font-bold text-primary">
                                                {formatCurrency((projectionResult.points.find(p => p.age === params.retirementAge)?.totalNetWorth || 0) * params.safeWithdrawalRate / 12)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Years to Retirement</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {params.retirementAge - params.currentAge}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Settings */}
                                <ConfigPanel params={params} onChange={setParams} activeTab={activeTab} birthYear={birthYear} />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <header className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
                                    Advanced Retirement Planning
                                </h1>
                                <p className="text-muted-foreground">
                                    Full control over every aspect of your retirement strategy
                                </p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setDashboardMode('simple')}
                                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
                                    >
                                        Simple
                                    </button>
                                    <button
                                        onClick={() => setDashboardMode('details')}
                                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={() => setDashboardMode('advanced')}
                                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-white text-gray-900 shadow-sm"
                                    >
                                        Advanced
                                    </button>
                                </div>
                                </div>
                            {(activeTab === 'overview' || activeTab === 'tax') && (
                                <div className="flex gap-8 items-center">
                                    {/* Real vs Nominal Toggle */}
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white border border-border rounded-lg p-1 flex shadow-sm">
                                            <button
                                                onClick={() => setViewMode('real')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                                    viewMode === 'real' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                REAL (TODAY'S $)
                                            </button>
                                            <button
                                                onClick={() => setViewMode('nominal')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                                    viewMode === 'nominal' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                NOMINAL
                                            </button>
                                        </div>
                                        <div className="group relative flex items-center justify-center">
                                            <Info className="h-4 w-4 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                            <div className="absolute right-0 top-8 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto">
                                                <p className="font-bold mb-1 border-b border-slate-600 pb-1">View Settings</p>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="font-bold text-emerald-300">Real:</span>
                                                        <span className="text-slate-300"> The <strong>buying power</strong> of that amount in <strong>today&apos;s dollars</strong>.</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-amber-300">Nominal:</span>
                                                        <span className="text-slate-300"> The <strong>actual dollar amount</strong> you will see on your bank statement at that age.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-3 bg-white border border-border rounded-xl flex flex-col items-end shadow-sm ml-4">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Current Retirement Portfolio</span>
                                        <span className="font-mono text-2xl font-bold text-primary tracking-tight">{formatCurrency(totalNetWorth)}</span>
                                    </div>
                                </div>
                            )}
                        </header>

                        {/* Projection Result Alert */}
                        {projectionResult.failureAge && (
                            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-amber-100 p-2 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-amber-900 font-bold">Scenario Warning</h3>
                                    <p className="text-amber-800 text-sm">
                                        Based on your current parameters, your portfolio may be depleted by <strong>age {projectionResult.failureAge}</strong> ({projectionResult.failureYear}). Consider adjusting your savings rate, retirement age, or safe withdrawal rate.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Main Chart Area */}
                            <div className="lg:col-span-8 space-y-6">
                                <Recommendations params={params} result={projectionResult} />
                                <ProjectionChart
                                    data={projection}
                                    retirementAge={params.retirementAge}
                                    phases={params.phases}
                                    viewMode={viewMode}
                                    inflationRate={params.inflationRate}
                                    currentAge={params.currentAge}
                                    onRetirementAgeChange={(age) => setParams(prev => ({ ...prev, retirementAge: age }))}
                                    onPhaseCreate={(start, end) => {
                                        const newPhase: ScenarioPhase = {
                                            id: crypto.randomUUID(),
                                            label: "Variable Drawdown",
                                            startAge: start,
                                            endAge: end,
                                            returnAdjustment: 0,
                                            spendingAdjustment: 1.0,
                                            withdrawalRate: params.safeWithdrawalRate,
                                            color: "blue",
                                        };
                                        setParams(prev => ({ ...prev, phases: [...(prev.phases || []), newPhase] }));
                                        setShowAdvanced(true);
                                    }}
                                />

                                <WithdrawalChart
                                    data={projection}
                                    retirementAge={params.retirementAge}
                                    viewMode={viewMode}
                                    inflationRate={params.inflationRate}
                                    currentAge={params.currentAge}
                                />

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-card border border-border rounded-lg">
                                        <h4 className="text-sm text-muted-foreground mb-1">Projected Portfolio @ Retirement</h4>
                                        <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                                            {formatCurrency(getValue(projectionResult.points.find(p => p.age === params.retirementAge)?.totalNetWorth || 0, params.retirementAge))}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-card border border-border rounded-lg relative group overflow-hidden">
                                        <div className="flex items-center justify-between mb-1 relative z-10">
                                            <h4 className="text-sm text-muted-foreground flex items-center gap-1">
                                                Coast FIRE Number
                                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded uppercase font-bold">Today</span>
                                            </h4>
                                            {estimatedMonthlySpend > 0 && (
                                                <button
                                                    onClick={() => setUseActualSpend(!useActualSpend)}
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1",
                                                        useActualSpend
                                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                            : "bg-muted text-muted-foreground border border-transparent hover:border-border"
                                                    )}
                                                >
                                                    {useActualSpend ? 'USING ACTUAL SPEND' : 'USE ACTUAL SPEND?'}
                                                </button>
                                            )}
                                        </div>
                                        <p className={cn("text-lg md:text-2xl font-bold truncate relative z-10", fireMetrics?.isCoastFire ? "text-green-600" : "text-foreground")}>
                                            {fireMetrics ? formatCurrency(fireMetrics.coastFireNumber) : '---'}
                                        </p>
                                        {useActualSpend && estimatedMonthlySpend > 0 && (
                                            <p className="text-[10px] text-blue-600 font-medium mt-1 animate-in fade-in slide-in-from-top-1 relative z-10">
                                                Based on {formatCurrency(estimatedMonthlySpend)}/mo actual spend
                                            </p>
                                        )}

                                        {/* Progress Bar Background */}
                                        <div className="absolute bottom-0 left-0 h-1 bg-muted w-full" />
                                        {/* Progress Bar Foreground */}
                                        <div
                                            className={cn("absolute bottom-0 left-0 h-1 transition-all duration-1000", fireMetrics?.isCoastFire ? "bg-green-500" : "bg-blue-500")}
                                            style={{ width: `${fireMetrics?.coastFireProgress || 0}%` }}
                                        />
                                    </div>
                                    <div className="p-4 bg-card border border-border rounded-lg">
                                        <h4 className="text-sm text-muted-foreground mb-1">Monthly Safe Withdrawal</h4>
                                        <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                                            {formatCurrency(getValue((projectionResult.points.find(p => p.age === params.retirementAge)?.totalNetWorth || 0), params.retirementAge) * (params.safeWithdrawalRate / 12))}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-card border border-border rounded-lg">
                                        <h4 className="text-sm text-muted-foreground mb-1">Age 90 Portfolio Value</h4>
                                        <p className="text-2xl font-bold text-foreground">
                                            {formatCurrency(getValue(projection.find(p => p.age === 90)?.totalNetWorth || 0, 90))}
                                        </p>
                                    </div>
                                </div>

                                {/* Smart Insights Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {fireMetrics?.isCoastFire ? (
                                        <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <Award className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-emerald-900 font-bold text-sm">You&apos;ve reached Coast FIRE!</h3>
                                                <p className="text-emerald-800 text-[11px] leading-tight">
                                                    Your current portfolio will grow to cover your retirement spend by age {params.retirementAge} with no further contributions.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-blue-900 font-bold text-sm">{Math.round(fireMetrics?.coastFireProgress || 0)}% of the way to Coast FIRE</h3>
                                                <p className="text-blue-800 text-[11px] leading-tight">
                                                    You need {formatCurrency(fireMetrics?.gapToCoastFire || 0)} more today to potentially stop saving and still retire on time.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {fireMetrics && fireMetrics.monthlySavingsGap > 0 ? (
                                        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl font-medium">
                                            <div className="bg-amber-100 p-2 rounded-lg">
                                                <Zap className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-amber-900 font-bold text-sm">Save {formatCurrency(fireMetrics.monthlySavingsGap)} more / month</h3>
                                                <p className="text-amber-800 text-[11px] leading-tight font-normal">
                                                    Adding this would bridge the gap to your {formatCurrency(fireMetrics.targetPortfolio)} goal at age {params.retirementAge}.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <Check className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-emerald-900 font-bold text-sm">On Track for Retirement</h3>
                                                <p className="text-emerald-800 text-[11px] leading-tight">
                                                    Your current plan is projected to meet or exceed your target portfolio of {formatCurrency(fireMetrics?.targetPortfolio || 0)}.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Advanced Controls - Moved to Main Column */}
                                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Settings2 className="h-4 w-4 text-primary" />
                                            <span className="font-bold text-sm uppercase tracking-wider">Advanced Controls</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {showAdvanced ? '[-]' : '[+]'}
                                        </span>
                                    </button>

                                    {showAdvanced && (
                                        <div className="px-6 pb-6 pt-2 border-t border-border animate-in fade-in zoom-in-95 duration-200">
                                            <AdvancedScenarios
                                                phases={params.phases || []}
                                                onPhasesChange={(phases) => setParams(prev => ({ ...prev, phases }))}
                                                currentAge={params.currentAge}
                                                lifeExpectancy={params.lifeExpectancy}
                                                stressTestEnabled={params.stressTestEnabled || false}
                                                onStressTestChange={(enabled) => setParams(prev => ({ ...prev, stressTestEnabled: enabled }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Config */}
                            <div className="lg:col-span-4 space-y-8">
                                <ConfigPanel params={params} onChange={setParams} activeTab={activeTab} birthYear={birthYear} />

                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

