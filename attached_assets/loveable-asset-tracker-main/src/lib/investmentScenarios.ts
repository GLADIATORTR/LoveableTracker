import { RealEstateInvestment } from "@/pages/Index";

export type InvestmentScenario = 'current' | 'maxDebt' | 'zeroDebt';

export interface ScenarioInvestment extends RealEstateInvestment {
  scenarioType: InvestmentScenario;
  scenarioLabel: string;
}

export const createInvestmentScenarios = (investment: RealEstateInvestment): ScenarioInvestment[] => {
  const scenarios: ScenarioInvestment[] = [];

  // Current scenario (existing investment as-is)
  scenarios.push({
    ...investment,
    scenarioType: 'current',
    scenarioLabel: 'Current'
  });

  // Max Debt scenario (80% LTV, 20% down payment)
  const maxDebtLTV = 0.8;
  const maxDebtLoanAmount = investment.currentValue * maxDebtLTV;
  const maxDebtDownPayment = investment.currentValue * (1 - maxDebtLTV);
  
  // Calculate new monthly payment for max debt
  const monthlyRate = investment.interestRate / 100 / 12;
  const totalPayments = investment.loanTerm * 12;
  const maxDebtMonthlyPayment = monthlyRate > 0 ? 
    maxDebtLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
    (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;

  scenarios.push({
    ...investment,
    loanAmount: maxDebtLoanAmount,
    outstandingBalance: maxDebtLoanAmount,
    downPayment: maxDebtDownPayment,
    monthlyMortgage: maxDebtMonthlyPayment,
    currentTerm: 0, // Reset term for new loan
    scenarioType: 'maxDebt',
    scenarioLabel: 'Max Debt (80% LTV)'
  });

  // Zero Debt scenario (all cash, no mortgage)
  scenarios.push({
    ...investment,
    loanAmount: 0,
    outstandingBalance: 0,
    downPayment: investment.currentValue, // Full purchase price as down payment
    monthlyMortgage: 0,
    interestRate: 0,
    currentTerm: 0,
    loanTerm: 0,
    scenarioType: 'zeroDebt',
    scenarioLabel: '0 Debt (All Cash)'
  });

  return scenarios;
};

export const getScenarioDisplayName = (propertyName: string, scenario: InvestmentScenario): string => {
  const scenarioLabels = {
    current: 'Current',
    maxDebt: 'Max Debt',
    zeroDebt: '0 Debt'
  };
  
  return `${propertyName} (${scenarioLabels[scenario]})`;
};

export const getScenarioColor = (baseColor: string, scenario: InvestmentScenario): string => {
  // Return the same base color but with different styling
  // We'll handle visual differentiation through stroke patterns in the chart
  return baseColor;
};