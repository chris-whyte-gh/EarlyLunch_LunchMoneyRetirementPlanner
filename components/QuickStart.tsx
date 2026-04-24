"use client";

import React, { useState, useEffect } from 'react';
import { SimpleRetirementParams, SimpleRetirementResults, calculateSimpleRetirement, getBeginnerRecommendations } from '@/lib/simpleModeling';
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
    suffix?: string;
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
            suffix: '$',
            step: 1000
        },
        {
            id: 'monthlySavings',
            label: 'How much do you save monthly?',
            description: 'Total amount you save each month toward retirement',
            icon: <PiggyBank className="w-5 h-5" />,
            placeholder: '2000',
            suffix: '$',
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
        const numValue = parseFloat(value) || 0;
        onChange({
            ...params,
            [currentQuestion.id]: numValue,
            annualReturn: 0.07, // Fixed 7% return
            withdrawalRate: 0.04, // Fixed 4% withdrawal rate
        });
    };

    const calculateRetirementSummary = () => {
        return calculateSimpleRetirement(params);
    };

    const summary = calculateRetirementSummary();

    if (showResults) {
        return (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 rounded-xl p-6">
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
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                ${summary.monthlyIncomeInRetirement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">Monthly income in retirement</div>
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-blue-900">Your Accounts (Auto-Categorized)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="font-medium text-gray-900">Taxable</div>
                                    <div className="text-blue-600 font-bold">{formatCurrency(categorizedAssets.taxable)}</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="font-medium text-gray-900">Pre-Tax</div>
                                    <div className="text-blue-600 font-bold">{formatCurrency(categorizedAssets.preTax)}</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-100">
                                    <div className="font-medium text-gray-900">Roth</div>
                                    <div className="text-blue-600 font-bold">{formatCurrency(categorizedAssets.roth)}</div>
                                </div>
                            </div>
                            <p className="text-xs text-blue-700 mt-3">
                                We automatically categorized your {assets.length} accounts based on account types
                            </p>
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">This is a simplified estimate</p>
                                <p>Actual results depend on investment returns, inflation, and many other factors. 
                                   Want to see more detailed scenarios and tax optimization strategies?</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                            Try Advanced Mode
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
                    <input
                        type="text"
                        inputMode="decimal"
                        value={(params[currentQuestion.id] as number)?.toString() || ''}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={currentQuestion.placeholder}
                        className="w-full text-2xl font-semibold bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    {currentQuestion.suffix && (
                        <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl text-muted-foreground">
                            {currentQuestion.suffix}
                        </span>
                    )}
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
