"use client";

import React from 'react';
import { SimpleRetirementParams, SimpleRetirementResults, calculateSimpleRetirement, getBeginnerRecommendations } from '@/lib/simpleModeling';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, PiggyBank, Target, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface SimpleDashboardProps {
    params: SimpleRetirementParams;
    onChange: (params: SimpleRetirementParams) => void;
}

export function SimpleDashboardNew({ params, onChange }: SimpleDashboardProps) {
    const results = calculateSimpleRetirement(params);
    const recommendations = getBeginnerRecommendations(results, params);

    const isOnTrack = results.isOnTrack;
    const progressPercentage = Math.min(100, (results.monthlyIncomeInRetirement / 3000) * 100);

    return (
        <div className="space-y-6">
            {/* Main Results Card */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Years to Retirement */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {results.yearsToRetirement}
                        </div>
                        <div className="text-sm text-muted-foreground">Years to retirement</div>
                    </div>

                    {/* Total at Retirement */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            ${Math.round(results.totalAtRetirement).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total at retirement</div>
                    </div>

                    {/* Monthly Retirement Income */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <PiggyBank className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            ${Math.round(results.monthlyIncomeInRetirement).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Monthly retirement income</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Retirement Readiness</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                                isOnTrack ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Current: ${Math.round(results.monthlyIncomeInRetirement).toLocaleString()}/month</span>
                        <span className="text-xs text-muted-foreground">Target: $3,000/month</span>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className={`border rounded-xl p-6 ${
                isOnTrack 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-200'
            }`}>
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                        isOnTrack 
                            ? 'bg-green-100' 
                            : 'bg-amber-100'
                    }`}>
                        {isOnTrack ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-2 ${
                            isOnTrack ? 'text-green-900' : 'text-amber-900'
                        }`}>
                            {isOnTrack ? 'On Track for Retirement!' : 'Action Needed'}
                        </h3>
                        <p className={`text-sm mb-4 ${
                            isOnTrack ? 'text-green-800' : 'text-amber-800'
                        }`}>
                            {isOnTrack 
                                ? `Great job! You're on track to retire at age ${Math.round(params.retirementAge)} with ${Math.round(results.yearsToRetirement)} years to go.`
                                : `You're ${Math.round(3000 - results.monthlyIncomeInRetirement).toLocaleString()}/month away from your target retirement income.`
                            }
                        </p>
                        
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="text-sm font-medium mb-1">Retirement Age Target</div>
                                <div className="text-2xl font-bold">
                                    {Math.round(results.retirementAgeTarget)} years
                                </div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="text-sm font-medium mb-1">Recommended Monthly Savings</div>
                                <div className="text-2xl font-bold">
                                    ${Math.round(results.recommendedMonthlySavings).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
                </div>
                <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <p className="text-sm text-foreground">{recommendation}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-foreground">Increase Monthly Savings</div>
                            <div className="text-sm text-muted-foreground">
                                Add ${Math.round(Math.max(100, results.recommendedMonthlySavings - params.monthlySavings)).toLocaleString()}/month
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>

                    <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-foreground">Adjust Retirement Age</div>
                            <div className="text-sm text-muted-foreground">
                                Retire at {Math.round(results.retirementAgeTarget + 1)} instead
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                </div>
            </div>

            {/* Current Settings Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Current Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Age</span>
                        <span className="font-medium">{params.currentAge} years</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Retirement Age</span>
                        <span className="font-medium">{params.retirementAge} years</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Savings</span>
                        <span className="font-medium">{formatCurrency(params.totalSavings)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Savings</span>
                        <span className="font-medium">{formatCurrency(params.monthlySavings)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Annual Return</span>
                        <span className="font-medium">{(params.annualReturn * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawal Rate</span>
                        <span className="font-medium">{(params.withdrawalRate * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
