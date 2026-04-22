"use client";

import React from 'react';
import { ModelingParams, ProjectionResult, calculateFireMetrics } from '@/lib/modeling';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, DollarSign, Target, Settings, BarChart3, ArrowRight } from 'lucide-react';

interface SimpleDashboardProps {
    params: ModelingParams;
    projectionResult: ProjectionResult;
    onDetailsMode: () => void;
    onAdvancedMode: () => void;
    onParamsChange: (params: ModelingParams) => void;
}

export function SimpleDashboard({ 
    params, 
    projectionResult, 
    onDetailsMode, 
    onAdvancedMode, 
    onParamsChange 
}: SimpleDashboardProps) {

    const currentNetWorth = params.currentTaxable + params.currentPreTax + params.currentRoth;
    const targetNetWorth = 40000 / 0.04; // Target based on $40k annual spend at 4% withdrawal rate
    const fireMetrics = calculateFireMetrics(params, currentNetWorth, targetNetWorth);

    // Calculate key results
    const yearsToRetirement = params.retirementAge - params.currentAge;
    const retirementPoint = projectionResult.points.find(p => p.age === params.retirementAge);
    const monthlyIncome = retirementPoint ? (retirementPoint.totalNetWorth * params.safeWithdrawalRate) / 12 : 0;
    const totalSaved = params.currentTaxable + params.currentPreTax + params.currentRoth;

    const canRetireWell = monthlyIncome > 3000; // Simple threshold for "good" retirement income

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-8 shadow-lg">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        {canRetireWell ? (
                            <Target className="w-10 h-10 text-emerald-600" />
                        ) : (
                            <Calendar className="w-10 h-10 text-blue-600" />
                        )}
                    </div>
                    
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {canRetireWell 
                                ? `You can retire at ${params.retirementAge} with ${formatCurrency(monthlyIncome)}/month`
                                : `Retire at ${params.retirementAge} with ${formatCurrency(monthlyIncome)}/month`
                            }
                        </h1>
                        <p className="text-gray-600 text-lg">
                            {yearsToRetirement} years to go with {formatCurrency(totalSaved)} currently saved
                        </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">
                                {yearsToRetirement}
                            </div>
                            <div className="text-sm text-gray-600">Years to retirement</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {formatCurrency(monthlyIncome)}
                            </div>
                            <div className="text-sm text-gray-600">Monthly retirement income</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                                {formatCurrency(retirementPoint?.totalNetWorth || 0)}
                            </div>
                            <div className="text-sm text-gray-600">Total at retirement</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Timeline Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Your Retirement Timeline
                    </h2>
                </div>
                
                <div className="relative h-48 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">Age {params.currentAge} to {params.retirementAge}</div>
                            <div className="w-64 bg-gray-200 rounded-full h-4 relative">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-4 rounded-full"
                                    style={{ width: `${Math.min((yearsToRetirement / 30) * 100, 100)}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {yearsToRetirement} years
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Working Years: {yearsToRetirement} | Retirement Years: {90 - params.retirementAge}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-600" />
                        Quick Settings
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Retirement Age
                        </label>
                        <input
                            type="number"
                            value={params.retirementAge}
                            onChange={(e) => onParamsChange({ ...params, retirementAge: parseInt(e.target.value) || 65 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Savings
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={params.monthlyContribution}
                                onChange={(e) => onParamsChange({ ...params, monthlyContribution: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="absolute right-3 top-2.5 text-gray-500">$</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Risk Level
                        </label>
                        <select
                            value={params.annualReturn === 0.05 ? 'conservative' : params.annualReturn === 0.07 ? 'moderate' : 'aggressive'}
                            onChange={(e) => {
                                const riskLevel = e.target.value;
                                const returnRate = riskLevel === 'conservative' ? 0.05 : riskLevel === 'moderate' ? 0.07 : 0.09;
                                onParamsChange({ ...params, annualReturn: returnRate });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="conservative">Conservative (5%)</option>
                            <option value="moderate">Moderate (7%)</option>
                            <option value="aggressive">Aggressive (9%)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onDetailsMode}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                    <BarChart3 className="w-5 h-5" />
                    See Detailed Charts
                    <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                    onClick={onAdvancedMode}
                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    <Settings className="w-5 h-5" />
                    Advanced Options
                </button>
            </div>

            {/* Simple Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Quick Insight</p>
                        <p>
                            {canRetireWell 
                                ? `You're on track for a comfortable retirement! With ${yearsToRetirement} years to go, your current savings rate should get you to ${formatCurrency(monthlyIncome)} monthly income in retirement.`
                                : `To improve your retirement income, consider increasing your monthly savings or planning to work a few more years. Every ${formatCurrency(100)} extra per month could add ${formatCurrency(24000)} to your retirement portfolio.`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
