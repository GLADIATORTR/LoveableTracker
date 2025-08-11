import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyExpenses, getEffectiveMonthlyExpensesExcludingMortgage } from "@/lib/propertyUtils";

export interface TaxBenefitsResult {
  annualDepreciation: number;
  mortgageInterestDeduction: number;
  propertyTaxDeduction: number;
  maintenanceDeductions: number;
  totalTaxBenefits: number;
  depreciation27_5Years: number;
  depreciationCommercial39Years: number;
}

export class TaxBenefitsCalculator {
  static calculateTaxBenefits(investment: RealEstateInvestment, countrySettings?: any): TaxBenefitsResult {
    // Use manual override if provided
    if (investment.taxBenefitOverride && investment.taxBenefitOverride > 0) {
      return {
        annualDepreciation: 0,
        mortgageInterestDeduction: 0,
        propertyTaxDeduction: 0,
        maintenanceDeductions: 0,
        totalTaxBenefits: investment.taxBenefitOverride,
        depreciation27_5Years: 0,
        depreciationCommercial39Years: 0,
      };
    }

    // Calculate cost basis for depreciation (typically 80% of purchase price for building)
    const costBasis = investment.costBasis || (investment.purchasePrice * 0.8);
    
    // Calculate annual depreciation based on property type
    let annualDepreciation = 0;
    let depreciation27_5Years = 0;
    let depreciationCommercial39Years = 0;
    
    if (investment.propertyType === "commercial") {
      // Commercial real estate: 39 years
      depreciationCommercial39Years = costBasis / 39;
      annualDepreciation = depreciationCommercial39Years;
    } else {
      // Residential rental property: 27.5 years
      depreciation27_5Years = costBasis / 27.5;
      annualDepreciation = depreciation27_5Years;
    }

    // Calculate mortgage interest deduction
    const monthlyInterestPayment = investment.outstandingBalance > 0 
      ? (investment.outstandingBalance * (investment.interestRate / 100)) / 12 
      : 0;
    const mortgageInterestDeduction = monthlyInterestPayment * 12;

    // Calculate property tax deduction
    // First try to get it from detailed expense breakdown, otherwise use escrow estimate
    let propertyTaxDeduction = 0;
    if (investment.expenseDetails?.annualPropertyTaxes) {
      propertyTaxDeduction = investment.expenseDetails.annualPropertyTaxes;
    } else {
      // Fallback: Assume 70% of escrow is property tax if no detailed breakdown
      propertyTaxDeduction = investment.monthlyEscrow * 12 * 0.7;
    }

    // Calculate maintenance and repair deductions (only actual maintenance costs)
    let maintenanceDeductions = 0;
    if (investment.expenseDetails?.monthlyMaintenance) {
      maintenanceDeductions = investment.expenseDetails.monthlyMaintenance * 12;
    }
    // Note: We don't include other expenses like management fees, association fees, etc. 
    // as these are not typically deductible as maintenance/repairs

    // Calculate total tax benefits
    const totalTaxBenefits = annualDepreciation + mortgageInterestDeduction + propertyTaxDeduction + maintenanceDeductions;

    return {
      annualDepreciation,
      mortgageInterestDeduction,
      propertyTaxDeduction,
      maintenanceDeductions,
      totalTaxBenefits,
      depreciation27_5Years,
      depreciationCommercial39Years,
    };
  }

  static calculateTaxSavings(taxBenefits: number, taxRate: number = 0.25): number {
    return taxBenefits * taxRate;
  }

  static calculateDepreciationRecapture(investment: RealEstateInvestment, yearsHeld: number, salePrice: number): number {
    const costBasis = investment.costBasis || (investment.purchasePrice * 0.8);
    const depreciationRate = investment.propertyType === "commercial" ? 1/39 : 1/27.5;
    const totalDepreciation = costBasis * depreciationRate * yearsHeld;
    
    // Depreciation recapture is taxed at 25% (or ordinary income rate if lower)
    return totalDepreciation * 0.25;
  }

  static calculate1031ExchangeOpportunity(investment: RealEstateInvestment): {
    eligible: boolean;
    deferredGains: number;
    minimumReplacement: number;
  } {
    const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const capitalGains = Math.max(0, currentValue - investment.purchasePrice);
    const netEquity = currentValue - investment.outstandingBalance;
    
    return {
      eligible: investment.propertyType !== "single-family" || investment.monthlyRent > 0, // Must be investment property
      deferredGains: capitalGains,
      minimumReplacement: netEquity, // Must replace all equity to defer all gains
    };
  }
}