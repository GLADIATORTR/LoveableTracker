// MIRR (Modified Internal Rate of Return) calculation utilities
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

export interface MIRRResult {
  mirrMonthly: number;
  mirrAnnual: number;
  pvNegative: number;
  fvPositive: number;
  cashFlows: number[];
  isValid: boolean;
}

/**
 * Calculate MIRR for a given cash flow stream
 * @param cashFlows Array of monthly cash flows
 * @param financeRateMonthly Monthly financing cost for outflows (e.g., mortgage APR / 12)
 * @param reinvestRateMonthly Monthly reinvestment rate for inflows (e.g., 5% / 12)
 * @returns MIRRResult object with monthly and annual MIRR
 */
export function calculateMIRR(
  cashFlows: number[],
  financeRateMonthly: number = 0.04 / 12, // Default 4% APR / 12
  reinvestRateMonthly: number = 0.05 / 12  // Default 5% APR / 12
): MIRRResult {
  const n = cashFlows.length - 1; // Number of periods (excluding initial investment)
  
  if (n <= 0 || cashFlows.length < 2) {
    return {
      mirrMonthly: 0,
      mirrAnnual: 0,
      pvNegative: 0,
      fvPositive: 0,
      cashFlows,
      isValid: false
    };
  }

  // Calculate Present Value of negative cash flows (outflows)
  let pvNegative = 0;
  for (let t = 0; t <= n; t++) {
    const cf = Math.min(cashFlows[t], 0);
    if (cf < 0) {
      pvNegative += cf / Math.pow(1 + financeRateMonthly, t);
    }
  }

  // Calculate Future Value of positive cash flows (inflows)
  let fvPositive = 0;
  for (let t = 0; t <= n; t++) {
    const cf = Math.max(cashFlows[t], 0);
    if (cf > 0) {
      fvPositive += cf * Math.pow(1 + reinvestRateMonthly, n - t);
    }
  }

  // Calculate MIRR
  if (Math.abs(pvNegative) === 0 || fvPositive === 0 || n === 0) {
    return {
      mirrMonthly: 0,
      mirrAnnual: 0,
      pvNegative,
      fvPositive,
      cashFlows,
      isValid: false
    };
  }

  const mirrMonthly = Math.pow(Math.abs(fvPositive / pvNegative), 1 / n) - 1;
  const mirrAnnual = Math.pow(1 + mirrMonthly, 12) - 1;

  return {
    mirrMonthly,
    mirrAnnual,
    pvNegative,
    fvPositive,
    cashFlows,
    isValid: !isNaN(mirrMonthly) && isFinite(mirrMonthly)
  };
}

/**
 * Generate monthly cash flows for a property from purchase to today
 */
export function generateHistoricalCashFlows(property: RealEstateInvestmentWithCategory): number[] {
  const purchaseDate = new Date(property.purchaseDate);
  const currentDate = new Date();
  const monthsHeld = Math.max(1, Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  
  const cashFlows: number[] = [];
  
  // Initial investment (negative)
  cashFlows.push(-(property.purchasePrice || 0));
  
  // Monthly cash flows
  const monthlyRent = property.monthlyRent || 0;
  const monthlyExpenses = property.monthlyExpenses || 0;
  const monthlyMortgage = property.monthlyMortgage || 0;
  const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
  
  for (let month = 1; month <= monthsHeld; month++) {
    if (month === monthsHeld) {
      // Add current property value in the final month
      cashFlows.push(monthlyCashFlow + (property.currentValue || 0));
    } else {
      cashFlows.push(monthlyCashFlow);
    }
  }
  
  return cashFlows;
}

/**
 * Generate projected cash flows from today for specified number of years
 */
export function generateProjectedCashFlows(
  property: RealEstateInvestmentWithCategory,
  projectionYears: number,
  appreciationRate: number = 0.035, // 3.5% annual
  rentGrowthRate: number = 0.03 // 3% annual
): number[] {
  const monthsProjected = projectionYears * 12;
  const cashFlows: number[] = [];
  
  // Initial value (negative - represents selling today to buy again)
  cashFlows.push(-(property.currentValue || 0));
  
  // Calculate monthly values
  const monthlyRent = property.monthlyRent || 0;
  const monthlyExpenses = property.monthlyExpenses || 0;
  const monthlyMortgage = property.monthlyMortgage || 0;
  const initialMonthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
  
  const monthlyRentGrowth = Math.pow(1 + rentGrowthRate, 1/12) - 1;
  const monthlyAppreciation = Math.pow(1 + appreciationRate, 1/12) - 1;
  
  for (let month = 1; month <= monthsProjected; month++) {
    // Adjust rent for growth
    const adjustedMonthlyCashFlow = initialMonthlyCashFlow * Math.pow(1 + monthlyRentGrowth, month);
    
    if (month === monthsProjected) {
      // Add future property value in the final month
      const futureValue = (property.currentValue || 0) * Math.pow(1 + monthlyAppreciation, monthsProjected);
      cashFlows.push(adjustedMonthlyCashFlow + futureValue);
    } else {
      cashFlows.push(adjustedMonthlyCashFlow);
    }
  }
  
  return cashFlows;
}

/**
 * Calculate all MIRR scenarios for a property
 */
export function calculatePropertyMIRRs(property: RealEstateInvestmentWithCategory): {
  purchaseToToday: MIRRResult;
  todayPlus10Years: MIRRResult;
  todayPlus20Years: MIRRResult;
  todayPlus30Years: MIRRResult;
  todayPlus40Years: MIRRResult;
} {
  const financeRate = 0.04 / 12; // 4% APR monthly
  const reinvestRate = 0.05 / 12; // 5% APR monthly
  
  return {
    purchaseToToday: calculateMIRR(
      generateHistoricalCashFlows(property),
      financeRate,
      reinvestRate
    ),
    todayPlus10Years: calculateMIRR(
      generateProjectedCashFlows(property, 10),
      financeRate,
      reinvestRate
    ),
    todayPlus20Years: calculateMIRR(
      generateProjectedCashFlows(property, 20),
      financeRate,
      reinvestRate
    ),
    todayPlus30Years: calculateMIRR(
      generateProjectedCashFlows(property, 30),
      financeRate,
      reinvestRate
    ),
    todayPlus40Years: calculateMIRR(
      generateProjectedCashFlows(property, 40),
      financeRate,
      reinvestRate
    )
  };
}

/**
 * Format MIRR as percentage with specified decimal places
 */
export function formatMIRR(mirr: number, decimals: number = 2): string {
  if (!isFinite(mirr) || isNaN(mirr)) return "N/A";
  return `${(mirr * 100).toFixed(decimals)}%`;
}