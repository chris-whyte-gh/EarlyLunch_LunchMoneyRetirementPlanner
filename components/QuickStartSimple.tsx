"use client";

import React, { useState, useEffect } from 'react';
import { SimpleRetirementParams, SimpleRetirementResults, calculateSimpleRetirement, getBeginnerRecommendations } from '@/lib/simpleModeling';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, PiggyBank, ArrowRight, Info, Wallet } from 'lucide-react';
import { Asset, Transaction, getLunchMoneyClient } from '@/lib/lunchmoney';
import { STORAGE_KEYS } from '@/lib/constants';
import { categorizeAssets, getCategoryDisplayName } from '@/lib/assetCategorization';

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

export function QuickStartSimple({ params, onChange, onAdvancedMode }: QuickStartProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categorizedAssets, setCategorizedAssets] = useState(categorizeAssets([]));
    const [hasLunchMoneyToken, setHasLunchMoneyToken] = useState(false);

    // Check for LunchMoney token and fetch data on mount
    useEffect(() => {
        const checkLunchMoneyConnection = async () => {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (token && token !== 'your_token_here') {
                setHasLunchMoneyToken(true);
                await fetchLunchMoneyData(token);
            }
        };
        checkLunchMoneyConnection();
    }, []);

    const fetchLunchMoneyData = async (token: string) => {
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
            setCategorizedAssets(categorized);
            
            // Calculate total savings from categorized assets
            const totalSavings = categorized.taxable + categorized.preTax + categorized.roth;
            
            // Calculate monthly savings from transactions
            const monthlySavings = calculateMonthlySavings(transactionsData);
            
            // Auto-populate the form
            onChange({
                ...params,
                totalSavings,
                monthlySavings,
                annualReturn: 0.07, // Fixed 7% return
                withdrawalRate: 0.04, // Fixed 4% withdrawal rate
            });
        } catch (error) {
            console.error('Error fetching LunchMoney data:', error);
        }
    };

    const calculateMonthlySavings = (transactions: Transaction[]): number => {
        // Simple calculation: sum of positive transactions in last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const incomeTransactions = transactions
            .filter(t => new Date(t.date) >= threeMonthsAgo && parseFloat(t.amount) > 0)
            .reduce((total, t) => total + parseFloat(t.amount), 0);
            
        return Math.round(incomeTransactions / 3); // Average per month
    };

    const quickStartQuestions: QuickStartQuestion[] = [
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

    const currentQuestion = quickStartQuestions[currentStep];
    const isLastStep = currentStep === quickStartQuestions.length - 1;
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
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleInputChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        onChange({
            ...params,
            [currentQuestion.id]: numValue,
            annualReturn: 0.07, // Always use 7% return
            withdrawalRate: 0.04, // Always use 4% withdrawal rate
        });
    };

    const calculateResults = (): SimpleRetirementResults => {
        return calculateSimpleRetirement(params);
    };

    const progress = ((currentStep + 1) / quickStartQuestions.length) * 100;

    if (showResults) {
        const results = calculateResults();
        const recommendations = getBeginnerRecommendations(results, params);

        return (
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            You can retire at age {Math.round(results.retirementAgeTarget)}
                        </h2>
                        <p className="text-muted-foreground">
                            Based on your current savings rate
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 rounded-xl p-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {results.yearsToRetirement}
                            </div>
                            <div className="text-sm text-muted-foreground">Years to retirement</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                                ${Math.round(results.totalAtRetirement).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Total at retirement</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                ${Math.round(results.monthlyIncomeInRetirement).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Monthly income in retirement</div>
                        </div>
                    </div>

                    {/* Categorized Assets Display */}
                    {hasLunchMoneyToken && assets.length > 0 && (
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
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-2">Recommendations</h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    {recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-amber-600 mt-1">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setShowResults(false);
                                setCurrentStep(0);
                            }}
                            className="px-6 py-3 border border-border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Start Over
                        </button>
                        <button
                            onClick={onAdvancedMode}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                        >
                            View Detailed Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Quick Retirement Planning</h2>
                    <span className="text-sm text-muted-foreground">
                        Step {currentStep + 1} of {quickStartQuestions.length}
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        {currentQuestion.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {currentQuestion.label}
                        </h3>
                        <p className="text-muted-foreground">
                            {currentQuestion.description}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="number"
                            value={currentValue || ''}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={currentQuestion.placeholder}
                            step={currentQuestion.step || 1}
                            className="w-full px-4 py-4 text-lg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
                        />
                        {currentQuestion.suffix && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                                {currentQuestion.suffix}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className={cn(
                            "px-6 py-3 border border-border rounded-lg transition-colors",
                            currentStep === 0
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-slate-50"
                        )}
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={cn(
                            "px-6 py-3 rounded-lg transition-colors flex-1",
                            canProceed
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "opacity-50 cursor-not-allowed bg-muted"
                        )}
                    >
                        {isLastStep ? 'See Results' : 'Next'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
}
