"use client";

import React, { useState } from 'react';
import { SimpleRetirementParams } from '@/lib/simpleModeling';
import { QuickStartSimple } from '@/components/QuickStartSimple';
import { SimpleDashboardNew } from '@/components/SimpleDashboardNew';
import { TopNav } from '@/components/TopNav';

export default function Home() {
  const [params, setParams] = useState<SimpleRetirementParams>({
    currentAge: 30,
    retirementAge: 45,
    totalSavings: 0,
    monthlySavings: 0,
    annualReturn: 0.07, // Fixed 7% return
    withdrawalRate: 0.04, // Fixed 4% withdrawal rate
  });

  const [showDashboard, setShowDashboard] = useState(false);

  const handleQuickStartComplete = (newParams: SimpleRetirementParams) => {
    setParams(newParams);
    setShowDashboard(true);
  };

  const handleParamsChange = (newParams: SimpleRetirementParams) => {
    setParams(newParams);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <TopNav activeTab="overview" onTabChange={() => {}} />
      <div className="container mx-auto px-4 py-8">
        {!showDashboard ? (
          <QuickStartSimple
            params={params}
            onChange={handleParamsChange}
            onAdvancedMode={() => setShowDashboard(true)}
          />
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Your Retirement Dashboard
              </h1>
              <p className="text-muted-foreground">
                Track your progress and plan your early retirement
              </p>
            </div>
            <SimpleDashboardNew
              params={params}
              onChange={handleParamsChange}
            />
          </div>
        )}
      </div>
    </main>
  );
}
