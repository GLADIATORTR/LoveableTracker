import { RealEstateInvestment, ExpenseDetails } from "@/pages/Index";

/**
 * Gets the actual monthly rent for portfolio calculations (excludes potential income)
 * Only includes actual income from investment properties
 */
export const getActualMonthlyRent = (investment: RealEstateInvestment): number => {
  // Only count actual rent from investment properties
  if (investment.isInvestmentProperty !== false) {
    return investment.monthlyRent || 0;
  }
  // Non-investment properties contribute $0 to actual income totals
  return 0;
};

/**
 * Gets the effective monthly rent for calculations based on property type
 * For investment properties: uses monthlyRent (actual income)
 * For non-investment properties: uses monthlyRentPotential (scenarios only)
 */
export const getEffectiveMonthlyRent = (investment: RealEstateInvestment): number => {
  // If it's an investment property (or undefined, defaulting to investment), use actual rent
  if (investment.isInvestmentProperty !== false) {
    return investment.monthlyRent || 0;
  }
  
  // For non-investment properties, use rent potential for scenarios
  return investment.monthlyRentPotential || 0;
};

/**
 * Gets potential monthly rent for display purposes (with disclaimer needed)
 */
export const getPotentialMonthlyRent = (investment: RealEstateInvestment): number => {
  // For non-investment properties, return potential rent
  if (investment.isInvestmentProperty === false) {
    return investment.monthlyRentPotential || 0;
  }
  return 0;
};

/**
 * Gets the display label for rent based on property type
 */
export const getRentLabel = (investment: RealEstateInvestment): string => {
  if (investment.isInvestmentProperty !== false) {
    return "Monthly Rent";
  }
  return "Monthly Rent Potential";
};

/**
 * Calculates total monthly expenses from detailed breakdown
 */
export const calculateTotalExpensesFromDetails = (expenseDetails: ExpenseDetails): number => {
  const monthly = (expenseDetails.monthlyHELOC || 0) +
                  (expenseDetails.monthlyManagementFees || 0) +
                  (expenseDetails.monthlyAssociationFees || 0) +
                  (expenseDetails.monthlyMaintenance || 0) +
                  (expenseDetails.monthlyMortgage || 0) +
                  (expenseDetails.monthlyEscrow || 0) +
                  (expenseDetails.monthlyOther || 0);
  
  const annualToMonthly = ((expenseDetails.annualInsurance || 0) +
                           (expenseDetails.annualPropertyTaxes || 0)) / 12;
  
  return monthly + annualToMonthly;
};

/**
 * Gets the effective monthly expenses for calculations
 * Uses detailed breakdown if available, otherwise uses simple monthlyExpenses
 */
export const getEffectiveMonthlyExpenses = (investment: RealEstateInvestment): number => {
  if (investment.expenseDetails) {
    return calculateTotalExpensesFromDetails(investment.expenseDetails);
  }
  return investment.monthlyExpenses || 0;
};

/**
 * Calculates total monthly expenses from detailed breakdown excluding mortgage payment
 */
export const calculateTotalExpensesFromDetailsExcludingMortgage = (expenseDetails: ExpenseDetails): number => {
  const monthly = (expenseDetails.monthlyHELOC || 0) +
                  (expenseDetails.monthlyManagementFees || 0) +
                  (expenseDetails.monthlyAssociationFees || 0) +
                  (expenseDetails.monthlyMaintenance || 0) +
                  (expenseDetails.monthlyEscrow || 0) +
                  (expenseDetails.monthlyOther || 0);
  
  const annualToMonthly = ((expenseDetails.annualInsurance || 0) +
                           (expenseDetails.annualPropertyTaxes || 0)) / 12;
  
  return monthly + annualToMonthly;
};

/**
 * Gets the effective monthly expenses for calculations excluding mortgage payment
 */
export const getEffectiveMonthlyExpensesExcludingMortgage = (investment: RealEstateInvestment): number => {
  if (investment.expenseDetails) {
    return calculateTotalExpensesFromDetailsExcludingMortgage(investment.expenseDetails);
  }
  // For simple monthlyExpenses, we assume it doesn't include mortgage since mortgage is tracked separately
  return investment.monthlyExpenses || 0;
};

/**
 * Checks if investment has detailed expense breakdown
 */
export const hasDetailedExpenses = (investment: RealEstateInvestment): boolean => {
  return !!investment.expenseDetails && Object.values(investment.expenseDetails).some(value => value && value > 0);
};