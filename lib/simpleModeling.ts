// Simplified retirement modeling for beginners
// Focus on clear, understandable calculations

export interface SimpleRetirementParams {
  currentAge: number;
  retirementAge: number;
  totalSavings: number;
  monthlySavings: number;
  annualReturn: number; // Fixed at 7% for simplicity
  withdrawalRate: number; // Fixed at 4% (the 4% rule)
}

export interface SimpleRetirementResults {
  yearsToRetirement: number;
  totalAtRetirement: number;
  annualIncomeInRetirement: number;
  monthlyIncomeInRetirement: number;
  isOnTrack: boolean;
  recommendedMonthlySavings: number;
  retirementAgeTarget: number;
}

/**
 * Calculate simple compound interest: Future Value = Present * (1 + rate)^years
 */
export function calculateFutureValue(
  presentValue: number, 
  annualReturn: number, 
  years: number
): number {
  return presentValue * Math.pow(1 + annualReturn, years);
}

/**
 * Calculate how much money you'll have at retirement
 */
export function calculateRetirementSavings(
  params: SimpleRetirementParams
): number {
  const yearsToRetirement = params.retirementAge - params.currentAge;
  
  // Current savings growth
  const currentSavingsGrowth = calculateFutureValue(
    params.totalSavings,
    params.annualReturn,
    yearsToRetirement
  );
  
  // Future contributions growth (annuity formula)
  const monthlyReturn = params.annualReturn / 12;
  const monthsToRetirement = yearsToRetirement * 12;
  
  let contributionsGrowth = 0;
  if (monthlyReturn > 0) {
    contributionsGrowth = params.monthlySavings * 
      ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
  } else {
    contributionsGrowth = params.monthlySavings * monthsToRetirement;
  }
  
  return currentSavingsGrowth + contributionsGrowth;
}

/**
 * Calculate retirement income using the 4% rule
 */
export function calculateRetirementIncome(
  totalSavings: number,
  withdrawalRate: number
): { annual: number; monthly: number } {
  const annual = totalSavings * withdrawalRate;
  const monthly = annual / 12;
  return { annual, monthly };
}

/**
 * Calculate how much you need to save monthly to reach your retirement goal
 */
export function calculateRequiredMonthlySavings(
  targetAmount: number,
  currentSavings: number,
  yearsToRetirement: number,
  annualReturn: number
): number {
  const monthlyReturn = annualReturn / 12;
  const monthsToRetirement = yearsToRetirement * 12;
  
  // How much we need to grow from current savings
  const growthNeeded = targetAmount - calculateFutureValue(currentSavings, annualReturn, yearsToRetirement);
  
  if (monthlyReturn <= 0 || monthsToRetirement <= 0) {
    return 0;
  }
  
  // Annuity formula to find required monthly payment
  const requiredMonthly = growthNeeded * monthlyReturn / 
    (Math.pow(1 + monthlyReturn, monthsToRetirement) - 1);
  
  return Math.max(0, requiredMonthly);
}

/**
 * Main calculation function for beginner retirement planning
 */
export function calculateSimpleRetirement(
  params: SimpleRetirementParams
): SimpleRetirementResults {
  const yearsToRetirement = Math.max(0, params.retirementAge - params.currentAge);
  
  // Calculate total savings at retirement
  const totalAtRetirement = calculateRetirementSavings(params);
  
  // Calculate retirement income using 4% rule
  const { annual: annualIncome, monthly: monthlyIncome } = 
    calculateRetirementIncome(totalAtRetirement, params.withdrawalRate);
  
  // Determine if on track (simple threshold: $3,000/month income)
  const isOnTrack = monthlyIncome >= 3000;
  
  // Calculate recommended savings to reach $3,000/month retirement income
  const targetRetirementIncome = 3000 * 12; // $36,000/year
  const targetRetirementSavings = targetRetirementIncome / params.withdrawalRate; // $900,000
  const recommendedMonthlySavings = calculateRequiredMonthlySavings(
    targetRetirementSavings,
    params.totalSavings,
    yearsToRetirement,
    params.annualReturn
  );
  
  // Calculate what retirement age would be achievable with current savings rate
  let retirementAgeTarget = params.retirementAge;
  if (params.monthlySavings > 0) {
    // Binary search to find retirement age with current savings rate
    let low = params.currentAge;
    let high = 100;
    
    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2;
      const testYears = mid - params.currentAge;
      const testTotal = calculateFutureValue(params.totalSavings, params.annualReturn, testYears) +
        params.monthlySavings * ((Math.pow(1 + params.annualReturn / 12, testYears * 12) - 1) / (params.annualReturn / 12));
      
      const testIncome = calculateRetirementIncome(testTotal, params.withdrawalRate).monthly;
      
      if (testIncome >= 3000) {
        high = mid;
        retirementAgeTarget = mid;
      } else {
        low = mid;
      }
    }
  }
  
  return {
    yearsToRetirement,
    totalAtRetirement,
    annualIncomeInRetirement: annualIncome,
    monthlyIncomeInRetirement: monthlyIncome,
    isOnTrack,
    recommendedMonthlySavings,
    retirementAgeTarget
  };
}

/**
 * Get beginner-friendly recommendations based on results
 */
export function getBeginnerRecommendations(
  results: SimpleRetirementResults,
  params: SimpleRetirementParams
): string[] {
  const recommendations: string[] = [];
  
  if (results.yearsToRetirement > 40) {
    recommendations.push("Consider increasing your monthly savings to retire earlier");
  }
  
  if (results.monthlyIncomeInRetirement < 3000) {
    recommendations.push("Your projected retirement income is below the recommended $3,000/month");
    
    if (params.monthlySavings < results.recommendedMonthlySavings) {
      const additionalNeeded = Math.round(results.recommendedMonthlySavings - params.monthlySavings);
      recommendations.push(`Try to save an additional $${additionalNeeded.toLocaleString()}/month`);
    }
  }
  
  if (params.annualReturn < 0.07) {
    recommendations.push("Consider a more diversified investment portfolio for better returns");
  }
  
  if (results.isOnTrack) {
    recommendations.push("Great job! You're on track for a comfortable retirement");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("You're doing well! Keep up your current savings strategy");
  }
  
  return recommendations;
}
