"use client";

import React, { useState } from 'react';
import { ModelingParams } from '@/lib/modeling';
import { cn } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, PiggyBank, ArrowRight, Info } from 'lucide-react';

interface QuickStartProps {
    params: ModelingParams;
    onChange: (params: ModelingParams) => void;
    onAdvancedMode: () => void;
}

interface QuickStartQuestion {
    id: keyof ModelingParams;
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

    const questions: QuickStartQuestion[] = [
        {
            id: 'currentAge',
            label: "How old are you?",
            description: "Your current age helps us plan your retirement timeline",
            icon: <Calendar className="w-6 h-6" />,
            placeholder: "e.g., 30",
            step: 1
        },
        {
            id: 'retirementAge',
            label: "When do you want to retire?",
            description: "The age you'd like to stop working and live off your savings",
            icon: <TrendingUp className="w-6 h-6" />,
            placeholder: "e.g., 65",
            step: 1
        },
        {
            id: 'currentTaxable',
            label: "How much do you have saved?",
            description: "Total amount you've saved across all accounts",
            icon: <DollarSign className="w-6 h-6" />,
            placeholder: "e.g., 50000",
            suffix: "$",
            step: 1000
        },
        {
            id: 'monthlyContribution',
            label: "How much can you save monthly?",
            description: "Amount you can add to your retirement savings each month",
            icon: <PiggyBank className="w-6 h-6" />,
            placeholder: "e.g., 1000",
            suffix: "$",
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
        const cleanValue = value.replace(/[$,]/g, '');
        const numValue = parseFloat(cleanValue);
        
        if (!isNaN(numValue) && numValue >= 0) {
            const scale = currentQuestion.step === 1 ? 1 : 1;
            onChange({ 
                ...params, 
                [currentQuestion.id]: numValue / scale,
                // Set reasonable defaults for other fields
                lifeExpectancy: 90,
                annualReturn: 0.07,
                inflationRate: 0.03,
                safeWithdrawalRate: 0.04,
                effectiveTaxRate: 0.15,
                currentPreTax: 0,
                currentRoth: 0,
                rothConversionAmount: 0,
                rothConversionStartAge: 40,
                rothConversionEndAge: 50,
                enableSEPP: false,
                seppStartAge: 40
            });
        }
    };

    const calculateRetirementSummary = () => {
        const yearsToRetirement = params.retirementAge - params.currentAge;
        const yearsInRetirement = 90 - params.retirementAge;
        
        // Simple calculation for demonstration
        const futureValue = params.currentTaxable * Math.pow(1.07, yearsToRetirement) + 
                          (params.monthlyContribution * 12 * ((Math.pow(1.07, yearsToRetirement) - 1) / 0.07));
        
        const annualWithdrawal = futureValue * 0.04;
        const monthlyWithdrawal = annualWithdrawal / 12;

        return {
            yearsToRetirement,
            futureValue,
            monthlyWithdrawal,
            canRetire: monthlyWithdrawal > 3000 // Simple threshold
        };
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
                            {summary.canRetire ? "Great News!" : "Let's Make a Plan"}
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
                                ${Math.round(summary.futureValue).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Total savings at retirement</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                ${Math.round(summary.monthlyWithdrawal).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Monthly income in retirement</div>
                        </div>
                    </div>

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
