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
  mortgageInterestDeduction: number,
  propertyTaxDeduction: number,
  maintenanceDeductions: number
): number {
  return annualDepreciation + mortgageInterestDeduction + propertyTaxDeduction + maintenanceDeductions;
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

/**
 * Generate comprehensive financial projections using standardized calculations
 */
export function generateFinancialProjections(
  property: PropertyFinancials,
  countrySettings: GlobalCountrySettings,
  years: number[] = [0, 1, 2, 3, 4, 5, 10, 15, 25, 30],
  inflationAdjusted: boolean = false
): FinancialProjection[] {
  const costBasis = calculateCostBasis(property.purchasePrice);
  const annualDepreciation = calculateAnnualDepreciation(costBasis);
  
  return years.map(year => {
    // Apply time-based growth rates
    const futureMarketValue = property.marketValue * Math.pow(1 + countrySettings.realEstateAppreciationRate / 100, year);
    const futureMonthlyRent = property.monthlyRent * Math.pow(1 + (countrySettings.realEstateAppreciationRate * 0.7) / 100, year);
    const futureMonthlyExpenses = property.monthlyExpenses * Math.pow(1.02, year); // 2% expense growth
    
    // Core calculations using standardized formulas
    const netYield = calculateNetYield(futureMonthlyRent, futureMonthlyExpenses);
    const netYieldPercentage = calculateNetYieldPercentage(netYield, futureMarketValue);
    const appreciation = calculateAppreciation(futureMarketValue, countrySettings.realEstateAppreciationRate);
    
    // Mortgage calculations (simplified - assuming fixed payment)
    const annualMortgagePayment = (property.loanBalance * (countrySettings.currentMortgageRate / 100)) / 12 * 12;
    const mortgageInterest = property.loanBalance * (countrySettings.currentMortgageRate / 100);
    const cashAtHand = calculateCashAtHand(netYield, annualMortgagePayment);
    
    // Tax calculations
    const propertyTaxDeduction = futureMonthlyExpenses * 12 * 0.3; // Estimate 30% of expenses are property tax
    const maintenanceDeductions = futureMonthlyExpenses * 12 * 0.4; // Estimate 40% of expenses are maintenance
    const totalTaxBenefits = calculateTotalTaxBenefits(
      annualDepreciation,
      mortgageInterest,
      propertyTaxDeduction,
      maintenanceDeductions
    );
    
    const netValue = calculateNetValue(netYield, mortgageInterest, appreciation, totalTaxBenefits);
    
    // Sales calculations
    const salesCost = calculateSalesCost(futureMarketValue, countrySettings.sellingCosts);
    const capitalGainsTax = calculateCapitalGainsTax(futureMarketValue, property.loanBalance, countrySettings.capitalGainsTax);
    const afterTaxNetEquity = calculateAfterTaxNetEquity(futureMarketValue, property.loanBalance, salesCost, capitalGainsTax);
    
    const cashOnCashReturn = calculateCashOnCashReturn(cashAtHand, property.downPayment);
    
    // Apply inflation adjustment if requested
    const inflationAdjustment = inflationAdjusted ? Math.pow(1 + countrySettings.inflationRate / 100, -year) : 1;
    
    return {
      year,
      marketValue: futureMarketValue * inflationAdjustment,
      monthlyRent: futureMonthlyRent * inflationAdjustment,
      netYield: netYield * inflationAdjustment,
      cashAtHand: cashAtHand * inflationAdjustment,
      netValue: netValue * inflationAdjustment,
      afterTaxNetEquity: afterTaxNetEquity * inflationAdjustment,
      netYieldPercentage,
      appreciation: appreciation * inflationAdjustment,
      totalTaxBenefits: totalTaxBenefits * inflationAdjustment,
      cashOnCashReturn, // Percentage doesn't adjust for inflation
    };
  });
}