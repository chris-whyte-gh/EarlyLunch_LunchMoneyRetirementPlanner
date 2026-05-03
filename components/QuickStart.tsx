"use client";

import React, { useState, useEffect } from 'react';
import { SimpleRetirementParams, SimpleRetirementResults, calculateSimpleRetirement, calculateRequiredMonthlySavings, getBeginnerRecommendations } from '@/lib/simpleModeling';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, PiggyBank, ArrowRight, Info, Wallet, CreditCard } from 'lucide-react';
import { Asset, Transaction, getLunchMoneyClient } from '@/lib/lunchmoney';
import { STORAGE_KEYS } from '@/lib/constants';
import { categorizeAssets, categorizeAsset, getCategoryDisplayName } from '@/lib/assetCategorization';

interface QuickStartProps {
    params: SimpleRetirementParams;
    onChange: (params: SimpleRetirementParams) => void;
    onAdvancedMode: () => void;
}

interface QuickStartQuestion {
    id: keyof SimpleRetirementParams;
    label: string;
    description: string;
    icon: React.ReactNode;
    placeholder: string;
    prefix?: string;
    step?: number;
}

export function QuickStart({ params, onChange, onAdvancedMode }: QuickStartProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categorizedAssets, setCategorizedAssets] = useState(categorizeAssets([]));
    const [loadingData, setLoadingData] = useState(false);
    const [dataError, setDataError] = useState<string | null>(null);
    const [hasLunchMoneyToken, setHasLunchMoneyToken] = useState(false);
    const [userSpendingEstimate, setUserSpendingEstimate] = useState<number | null>(null);
    const [monthlySpending, setMonthlySpending] = useState<string>('');
    const [yearlySpending, setYearlySpending] = useState<string>('');

    // Load user spending estimate on mount
    useEffect(() => {
        const stored = localStorage.getItem('userEstimatedSpending');
        if (stored) {
            const monthly = parseFloat(stored);
            setUserSpendingEstimate(monthly);
            setMonthlySpending(monthly.toString());
            setYearlySpending((monthly * 12).toString());
        }
    }, []);

    // Prevent browser back button from leaving the app
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            
            // Handle back navigation within the QuickStart flow
            if (showResults) {
                setShowResults(false);
            } else if (currentStep > 0) {
                setCurrentStep(currentStep - 1);
            }
            // Don't navigate away from the app
            window.history.pushState(null, '', window.location.pathname);
        };

        // Add initial history entry
        window.history.pushState(null, '', window.location.pathname);
        
        // Add popstate listener
        window.addEventListener('popstate', handlePopState);
        
        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showResults, currentStep]);

    // Check for LunchMoney token and fetch data on mount
    useEffect(() => {
        const checkLunchMoneyConnection = async () => {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            console.log('QuickStart - Token check:', { token: token ? 'exists' : 'none', tokenValue: token });
            if (token && token !== 'your_token_here') {
                console.log('QuickStart - Setting hasLunchMoneyToken to true');
                setHasLunchMoneyToken(true);
                await fetchLunchMoneyData(token);
            }
        };
        checkLunchMoneyConnection();
    }, []);

    const fetchLunchMoneyData = async (token: string) => {
        setLoadingData(true);
        setDataError(null);
        
        try {
            const client = getLunchMoneyClient(token);
            const [assetsData, transactionsData] = await Promise.all([
                client.getAssets(),
                client.getTransactions()
            ]);
            
            setAssets(assetsData);
            setTransactions(transactionsData);
            
            // Auto-categorize assets
            const categorized = categorizeAssets(assetsData);
            console.log('Debug - Raw Assets:', assetsData.map(a => ({ name: a.name, type: a.type_name, subtype: a.subtype_name, balance: a.balance })));
            console.log('Debug - Categorized:', categorized);
            console.log('Debug - Individual categorization:', assetsData.map(a => ({ name: a.name, category: categorizeAsset(a) })));
            setCategorizedAssets(categorized);
            
            // Auto-populate savings amount with categorized data
            const monthlySavings = calculateMonthlySavings(transactionsData);
            
            onChange({
                ...params,
                totalSavings: categorized.taxable + categorized.preTax + categorized.roth,
                monthlySavings: monthlySavings,
            });
        } catch (error) {
            console.error('Failed to fetch LunchMoney data:', error);
            setDataError('Unable to connect to LunchMoney. Please check your token.');
        } finally {
            setLoadingData(false);
        }
    };

    const calculateTotalSavings = (assetsData: Asset[]): number => {
        return assetsData
            .filter(asset => asset.balance && parseFloat(asset.balance) > 0)
            .reduce((total, asset) => total + parseFloat(asset.balance), 0);
    };

    const calculateMonthlySavings = (transactionsData: Transaction[]): number => {
        // Calculate average monthly income from the last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const incomeTransactions = transactionsData
            .filter(t => new Date(t.date) >= threeMonthsAgo && parseFloat(t.amount) > 0)
            .reduce((total, t) => total + parseFloat(t.amount), 0);
            
        return Math.round(incomeTransactions / 3); // Average per month
    };

    const questions: QuickStartQuestion[] = [
        {
            id: 'currentAge',
            label: 'What is your current age?',
            description: 'This helps us calculate your retirement timeline',
            icon: <Calendar className="w-5 h-5" />,
            placeholder: '30',
            step: 1
        },
        {
            id: 'retirementAge',
            label: 'When would you like to retire?',
            description: 'The age you want to stop working and live off your savings',
            icon: <TrendingUp className="w-5 h-5" />,
            placeholder: '45',
            step: 1
        },
        {
            id: 'totalSavings',
            label: 'What are your current total savings?',
            description: 'All your retirement accounts combined (401k, IRA, brokerage, etc.)',
            icon: <DollarSign className="w-5 h-5" />,
            placeholder: '100000',
            prefix: '$',
            step: 1000
        },
        {
            id: 'monthlySavings',
            label: 'How much do you save monthly?',
            description: 'Total amount you save each month toward retirement',
            icon: <PiggyBank className="w-5 h-5" />,
            placeholder: '2000',
            prefix: '$',
            step: 100
        }
    ];

    const currentQuestion = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;
    const currentValue = params[currentQuestion.id];
    const canProceed = typeof currentValue === 'number' && currentValue > 0;

    const handleNext = () => {
        if (isLastStep) {
            setShowResults(true);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (showResults) {
            setShowResults(false);
        } else {
            setCurrentStep(Math.max(0, currentStep - 1));
        }
    };

    const handleInputChange = (value: string) => {
        // Remove commas and convert to number
        const cleanValue = value.replace(/,/g, '');
        const numValue = parseFloat(cleanValue) || 0;
        onChange({
            ...params,
            [currentQuestion.id]: numValue,
            annualReturn: 0.07, // Fixed 7% return
            withdrawalRate: 0.04, // Fixed 4% withdrawal rate
        });
    };

    const formatInputValue = (value: number, questionId: keyof SimpleRetirementParams): string => {
        // Round monthly values to whole dollars, keep decimals for total savings
        const roundedValue = questionId === 'monthlySavings' ? Math.round(value) : value;
        return roundedValue.toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    const calculateRetirementSummary = () => {
        return calculateSimpleRetirement(params);
    };

    const summary = calculateRetirementSummary();

    if (showResults) {
        return (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-4xl mx-auto">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {summary.isOnTrack ? "Great News!" : "Let's Make a Plan"}
                        </h2>
                        <p className="text-muted-foreground">
                            Based on your current savings rate, here's your retirement outlook:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 rounded-xl p-6 mb-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {summary.yearsToRetirement}
                            </div>
                            <div className="text-sm text-muted-foreground">Years to retirement</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                                ${params.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">Current total savings</div>
                        </div>
                    </div>

                    {/* Estimated Spending Section */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                            <h3 className="font-semibold text-amber-900">Estimated Monthly Spending in Retirement</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-amber-100">
                                <div className="font-medium text-gray-900 mb-2">Basic Lifestyle</div>
                                <div className="text-2xl font-bold text-amber-600">$3,000</div>
                                <div className="text-sm text-gray-500 font-medium">$36,000/year</div>
                                <div className="text-xs text-gray-600 mt-1">Housing, food, utilities, basic expenses</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-amber-100">
                                <div className="font-medium text-gray-900 mb-2">Comfortable Lifestyle</div>
                                <div className="text-2xl font-bold text-amber-600">$5,000</div>
                                <div className="text-sm text-gray-500 font-medium">$60,000/year</div>
                                <div className="text-xs text-gray-600 mt-1">Basic + travel, dining, entertainment</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-amber-100">
                                <div className="font-medium text-gray-900 mb-2">Luxury Lifestyle</div>
                                <div className="text-2xl font-bold text-amber-600">$8,000</div>
                                <div className="text-sm text-gray-500 font-medium">$96,000/year</div>
                                <div className="text-xs text-gray-600 mt-1">Comfortable + premium travel, hobbies</div>
                            </div>
                        </div>
                        
                        {/* User Input Section */}
                        <div className="mt-6 p-4 bg-white rounded-lg border border-amber-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-4 h-4 text-amber-600" />
                                <h4 className="font-medium text-amber-900">What's your estimated spending in retirement?</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Spending</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            placeholder="5000"
                                            value={monthlySpending}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setMonthlySpending(value);
                                                const monthly = parseFloat(value) || 0;
                                                const yearly = monthly * 12;
                                                setYearlySpending(yearly.toString());
                                                if (monthly > 0) {
                                                    setUserSpendingEstimate(monthly);
                                                    localStorage.setItem('userEstimatedSpending', monthly.toString());
                                                }
                                            }}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Spending</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            placeholder="60000"
                                            value={yearlySpending}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setYearlySpending(value);
                                                const yearly = parseFloat(value) || 0;
                                                const monthly = yearly / 12;
                                                setMonthlySpending(monthly.toString());
                                                if (yearly > 0) {
                                                    setUserSpendingEstimate(monthly);
                                                    localStorage.setItem('userEstimatedSpending', monthly.toString());
                                                }
                                            }}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-3">
                                Enter your estimated retirement expenses. Monthly and yearly values sync automatically.
                            </p>
                        </div>
                        
                        <p className="text-sm text-amber-700 mt-4">
                            Most retirees need $3,000-$5,000/month for a comfortable retirement. Your current plan provides ${summary.monthlyIncomeInRetirement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month.
                        </p>
                    </div>

                    {/* Retirement Income Analysis */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-900">Your Retirement Income Analysis</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-1">
                                    ${summary.monthlyIncomeInRetirement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-sm text-muted-foreground">Current projected monthly income</div>
                                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                                    summary.monthlyIncomeInRetirement >= (userSpendingEstimate || 3000) 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {summary.monthlyIncomeInRetirement >= (userSpendingEstimate || 3000) ? 'On Track' : 'Needs Improvement'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-1">
                                    ${(() => {
                                        const targetIncome = userSpendingEstimate || 3000;
                                        const targetRetirementSavings = (targetIncome * 12) / params.withdrawalRate;
                                        const requiredSavings = calculateRequiredMonthlySavings(
                                            targetRetirementSavings,
                                            params.totalSavings,
                                            summary.yearsToRetirement,
                                            params.annualReturn
                                        );
                                        return requiredSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                                    })()}
                                </div>
                                <div className="text-sm text-muted-foreground">Recommended monthly savings</div>
                                <div className="text-xs text-gray-600 mt-2">
                                    To reach ${userSpendingEstimate ? userSpendingEstimate.toLocaleString() : '3,000'}/month retirement income
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categorized Assets Display */}
                    {(() => {
                        const totalCategorized = categorizedAssets.taxable + categorizedAssets.preTax + categorizedAssets.roth;
                        const shouldShow = hasLunchMoneyToken && totalCategorized > 0;
                        console.log('QuickStart - Display check:', { 
                            hasLunchMoneyToken, 
                            assetsLength: assets.length, 
                            categorizedAssets,
                            totalCategorized,
                            shouldShow 
                        });
                        return shouldShow;
                    })() && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-blue-900">Your Accounts (Auto-Categorized)</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-white rounded-lg p-4 border border-blue-100 min-w-0">
                                    <div className="font-medium text-gray-900 mb-1">Taxable</div>
                                    <div className="text-blue-600 font-bold text-lg leading-tight">{formatCurrency(categorizedAssets.taxable, { maxDecimals: 2 })}</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-blue-100 min-w-0">
                                    <div className="font-medium text-gray-900 mb-1">Pre-Tax</div>
                                    <div className="text-blue-600 font-bold text-lg leading-tight">{formatCurrency(categorizedAssets.preTax, { maxDecimals: 2 })}</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-blue-100 min-w-0">
                                    <div className="font-medium text-gray-900 mb-1">Roth</div>
                                    <div className="text-blue-600 font-bold text-lg leading-tight">{formatCurrency(categorizedAssets.roth, { maxDecimals: 2 })}</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-blue-100 min-w-0">
                                    <div className="font-medium text-gray-900 mb-1">Savings</div>
                                    <div className="text-blue-600 font-bold text-lg leading-tight">{formatCurrency(categorizedAssets.savings, { maxDecimals: 2 })}</div>
                                </div>
                            </div>
                            <p className="text-xs text-blue-700 mt-3">
                                We automatically categorized your {assets.length} accounts based on account types
                            </p>
                        </div>
                    )}

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">This is a simplified estimate</p>
                                <p>Actual results depend on investment returns, inflation, and many other factors. 
                                   Want to see more detailed scenarios and tax optimization strategies?</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handlePrevious}
                            className="px-6 py-3 border border-input rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Adjust your answers
                        </button>
                        <button
                            onClick={onAdvancedMode}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            View Detailed Analysis
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
            {/* LunchMoney Connection Status */}
            {hasLunchMoneyToken && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-green-600" />
                        <div className="text-sm text-green-800">
                            <p className="font-medium">Connected to LunchMoney</p>
                            <p className="text-xs">Using your real account data for accurate projections</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Step {currentStep + 1} of {questions.length}</span>
                    <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="space-y-6">
                {loadingData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Fetching your account data...</p>
                                <p className="text-xs">Connecting to LunchMoney to get your real balances</p>
                            </div>
                        </div>
                    </div>
                )}

                {dataError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-amber-600" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Connection Issue</p>
                                <p className="text-xs">{dataError}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        {currentQuestion.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                            {currentQuestion.label}
                        </h3>
                        <p className="text-muted-foreground">
                            {currentQuestion.description}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    {currentQuestion.prefix && (
                            <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-2xl text-muted-foreground pointer-events-none">
                                {currentQuestion.prefix}
                            </span>
                        )}
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputValue(params[currentQuestion.id] as number, currentQuestion.id)}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={currentQuestion.placeholder}
                            className="w-full text-2xl font-semibold bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 pl-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                </div>

                {/* Simple explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            {currentStep === 0 && "This helps us create a timeline for your retirement planning."}
                            {currentStep === 1 && "Most people retire between 60-70, but you choose what works for you."}
                            {currentStep === 2 && "Include all accounts: 401(k), IRA, savings, investments, etc."}
                            {currentStep === 3 && "This is the amount you can consistently add to retirement savings each month."}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLastStep ? "See Results" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
