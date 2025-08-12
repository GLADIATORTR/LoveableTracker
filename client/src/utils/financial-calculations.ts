/**
 * Financial Calculations using standardized Real Estate Investment Dictionary
 * All calculations follow the exact formulas and terminology from the financial dictionary
 */

export interface GlobalCountrySettings {
  realEstateAppreciationRate: number;
  inflationRate: number;
  sellingCosts: number;
  capitalGainsTax: number;
  currentMortgageRate: number;
}

export interface PropertyFinancials {
  marketValue: number; // Current estimated sales value
  monthlyRent: number;
  monthlyExpenses: number;
  loanBalance: number;
  purchasePrice: number;
  downPayment: number;
  yearsPurchased: number;
}

export interface FinancialProjection {
  year: number;
  marketValue: number;
  monthlyRent: number;
  netYield: number; // Net Rent (Cash Flow)
  cashAtHand: number;
  netValue: number;
  afterTaxNetEquity: number;
  netYieldPercentage: number; // % Net Yield of Market Value
  appreciation: number;
  totalTaxBenefits: number;
  cashOnCashReturn: number;
}

/**
 * Calculate Net Yield (Net Rent) (Cash Flow)
 * Formula: Rent - Expenses (Mortgage,Escrow(Tax,Insurance),Association,Monthly Management Fee,Maintenance,Misc.)
 */
export function calculateNetYield(
  monthlyRent: number,
  monthlyExpenses: number
): number {
  return (monthlyRent - monthlyExpenses) * 12;
}

/**
 * Calculate % Net Yield of Market Value
 * Formula: (Net Rent ÷ Current Value) × 100
 */
export function calculateNetYieldPercentage(
  netYield: number,
  marketValue: number
): number {
  if (marketValue === 0) return 0;
  return (netYield / marketValue) * 100;
}

/**
 * Calculate Cash at Hand
 * Formula: Net Yield - Mortgage Payment
 */
export function calculateCashAtHand(
  netYield: number,
  annualMortgagePayment: number
): number {
  return netYield - annualMortgagePayment;
}

/**
 * Calculate Appreciation
 * Formula: Market Value × Real Estate Appreciation Rate % per Country
 */
export function calculateAppreciation(
  marketValue: number,
  appreciationRate: number
): number {
  return marketValue * (appreciationRate / 100);
}

/**
 * Calculate Sales Cost
 * Formula: Market Value × Sales Cost % per Country
 */
export function calculateSalesCost(
  marketValue: number,
  salesCostRate: number
): number {
  return marketValue * (salesCostRate / 100);
}

/**
 * Calculate Capital Gains Tax
 * Formula: (Market Value - Loan Balance) × Capital Gains Tax % per Country
 */
export function calculateCapitalGainsTax(
  marketValue: number,
  loanBalance: number,
  capitalGainsTaxRate: number
): number {
  const gain = Math.max(0, marketValue - loanBalance);
  return gain * (capitalGainsTaxRate / 100);
}

/**
 * Calculate After-Tax Net Equity
 * Formula: Market Value - Loan Balance - (Sales Cost + Capital Gains Tax)
 */
export function calculateAfterTaxNetEquity(
  marketValue: number,
  loanBalance: number,
  salesCost: number,
  capitalGainsTax: number
): number {
  return marketValue - loanBalance - (salesCost + capitalGainsTax);
}

/**
 * Calculate Cost Basis (for depreciation)
 * Formula: Purchase Price × Building Ratio (typically 80%)
 */
export function calculateCostBasis(
  purchasePrice: number,
  buildingRatio: number = 0.8
): number {
  return purchasePrice * buildingRatio;
}

/**
 * Calculate Annual Depreciation
 * Formula: Cost Basis ÷ Depreciation Period (27.5 years residential)
 */
export function calculateAnnualDepreciation(
  costBasis: number,
  depreciationPeriod: number = 27.5
): number {
  return costBasis / depreciationPeriod;
}

/**
 * Calculate Total Tax Benefits
 * Formula: Annual Depreciation + Mortgage Interest Deduction + Property Tax Deduction + Maintenance Deductions
 */
export function calculateTotalTaxBenefits(
  annualDepreciation: number,
  mortgageInterest: number,
  propertyTax: number,
  maintenanceDeductions: number
): number {
  return annualDepreciation + mortgageInterest + propertyTax + maintenanceDeductions;
}

/**
 * Generate complete financial projections for a property
 */
export function generateFinancialProjections(
  propertyFinancials: PropertyFinancials,
  globalSettings: GlobalCountrySettings,
  years: number = 10,
  inflationAdjusted: boolean = false
): FinancialProjection[] {
  const projections: FinancialProjection[] = [];
  
  for (let year = 1; year <= years; year++) {
    const adjustedMarketValue = propertyFinancials.marketValue * Math.pow(1 + globalSettings.realEstateAppreciationRate / 100, year);
    const adjustedRent = propertyFinancials.monthlyRent * 12 * Math.pow(1 + globalSettings.inflationRate / 100, year);
    const adjustedExpenses = propertyFinancials.monthlyExpenses * 12 * Math.pow(1 + globalSettings.inflationRate / 100, year);
    
    const netYield = calculateNetYield(adjustedRent / 12, adjustedExpenses / 12);
    const netYieldPercentage = calculateNetYieldPercentage(netYield, adjustedMarketValue);
    const appreciation = calculateAppreciation(adjustedMarketValue, globalSettings.realEstateAppreciationRate);
    const salesCost = calculateSalesCost(adjustedMarketValue, globalSettings.sellingCosts);
    const capitalGainsTax = calculateCapitalGainsTax(adjustedMarketValue, propertyFinancials.loanBalance, globalSettings.capitalGainsTax);
    const afterTaxNetEquity = calculateAfterTaxNetEquity(adjustedMarketValue, propertyFinancials.loanBalance, salesCost, capitalGainsTax);
    
    // Estimate mortgage payment (simplified)
    const annualMortgagePayment = propertyFinancials.monthlyExpenses * 12 * 0.6; // Assuming 60% of expenses is mortgage
    const cashAtHand = calculateCashAtHand(netYield, annualMortgagePayment);
    
    // Tax benefits calculation
    const costBasis = calculateCostBasis(propertyFinancials.purchasePrice);
    const annualDepreciation = calculateAnnualDepreciation(costBasis);
    const totalTaxBenefits = calculateTotalTaxBenefits(annualDepreciation, annualMortgagePayment * 0.8, 0, 0);
    
    // Cash on cash return
    const cashOnCashReturn = propertyFinancials.downPayment > 0 ? (cashAtHand / propertyFinancials.downPayment) * 100 : 0;
    
    projections.push({
      year,
      marketValue: adjustedMarketValue,
      monthlyRent: adjustedRent / 12,
      netYield,
      cashAtHand,
      netValue: adjustedMarketValue - propertyFinancials.loanBalance,
      afterTaxNetEquity,
      netYieldPercentage,
      appreciation,
      totalTaxBenefits,
      cashOnCashReturn
    });
  }
  
  return projections;
}

/**
 * Calculate Net Value
 * Formula: Net Yield - Interest + Appreciation + Tax Benefits
 */
export function calculateNetValue(
  netYield: number,
  mortgageInterest: number,
  appreciation: number,
  totalTaxBenefits: number
): number {
  return netYield - mortgageInterest + appreciation + totalTaxBenefits;
}

/**
 * Calculate Cash-on-Cash Return
 * Formula: (Annual Cash Flow ÷ Initial Investment) × 100
 */
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  initialInvestment: number
): number {
  if (initialInvestment === 0) return 0;
  return (annualCashFlow / initialInvestment) * 100;
}

