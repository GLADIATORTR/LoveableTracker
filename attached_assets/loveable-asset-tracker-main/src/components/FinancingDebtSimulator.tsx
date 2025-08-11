import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RealEstateInvestment } from "@/pages/Index";
import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";
import { getEffectiveMonthlyRent, getEffectiveMonthlyExpenses, getEffectiveMonthlyExpensesExcludingMortgage } from "@/lib/propertyUtils";
import { TaxBenefitsCalculator } from "@/components/TaxBenefitsCalculator";

interface AssetData {
  marketValue: number;
  purchasePrice: number;
  loanBalance: number;
  salesCostPercent: number;
  taxPercent: number;
  netRent: number;
  next12MonthInterest: number;
  next12MonthPrincipal: number;
}

interface MaxDebtData {
  maxAssetValueWith20Down: number;
  numAssets: number;
  rent: number;
  loan: number;
}

interface FinancingDebtSimulatorProps {
  investments: RealEstateInvestment[];
}

// PMT formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
const calculatePMT = (principal: number, annualRate: number, termYears: number) => {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  
  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
  const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
  
  return principal * (numerator / denominator);
};

export const FinancingDebtSimulator = ({ investments }: FinancingDebtSimulatorProps) => {
  const { settings } = useGlobalSettings();
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [customMortgageRate, setCustomMortgageRate] = useState<number>(settings.currentMortgageRate);
  const [customAppreciationRate, setCustomAppreciationRate] = useState<number>(settings.realEstateAppreciationRate);
  const [customAssetEfficiency, setCustomAssetEfficiency] = useState<number>((30000 / 500000) * 100); // Default 6%
  const [customDownPayment, setCustomDownPayment] = useState<number>(20); // Default 20%
  const [loanTermYears, setLoanTermYears] = useState<number>(30); // Default 30 years
  const [currentAsset, setCurrentAsset] = useState<AssetData>({
    marketValue: 500000,
    purchasePrice: 400000,
    loanBalance: 400000,
    salesCostPercent: settings.sellingCosts,
    taxPercent: settings.capitalGainsTax,
    netRent: 30000,
    next12MonthInterest: 20000,
    next12MonthPrincipal: 5000
  });

  const [maxDebt, setMaxDebt] = useState<MaxDebtData>({
    maxAssetValueWith20Down: 300000,
    numAssets: 3,
    rent: 25000,
    loan: 240000
  });

  // Auto-select first investment when investments change
  useEffect(() => {
    if (investments.length > 0 && !selectedAssetId) {
      setSelectedAssetId(investments[0].id);
    }
  }, [investments, selectedAssetId]);

  // Auto-populate current asset when an investment is selected
  useEffect(() => {
    if (selectedAssetId && investments.length > 0) {
      const selectedInvestment = investments.find(inv => inv.id === selectedAssetId);
      if (selectedInvestment) {
        const effectiveMonthlyRent = getEffectiveMonthlyRent(selectedInvestment);
        const annualRent = effectiveMonthlyRent * 12;
        const annualExpensesExcMortgage = getEffectiveMonthlyExpensesExcludingMortgage(selectedInvestment) * 12;
        const netRent = annualRent - annualExpensesExcMortgage;
        
        // Calculate interest and principal based on mortgage payment
        const monthlyInterest = (selectedInvestment.outstandingBalance * selectedInvestment.interestRate / 100) / 12;
        const monthlyPrincipal = Math.max(0, selectedInvestment.monthlyMortgage - monthlyInterest);
        
        // Ensure values are valid numbers
        const validInterest = isNaN(monthlyInterest) ? 0 : monthlyInterest;
        const validPrincipal = isNaN(monthlyPrincipal) ? 0 : monthlyPrincipal;
        
        setCurrentAsset({
          marketValue: selectedInvestment.currentValue,
          purchasePrice: selectedInvestment.purchasePrice,
          loanBalance: selectedInvestment.outstandingBalance,
          salesCostPercent: settings.sellingCosts,
          taxPercent: settings.capitalGainsTax,
          netRent: netRent,
          next12MonthInterest: validInterest * 12,
          next12MonthPrincipal: validPrincipal * 12
        });
        
        // Update asset efficiency based on selected investment
        const assetEfficiency = selectedInvestment.currentValue > 0 ? (netRent / selectedInvestment.currentValue) * 100 : 6;
        setCustomAssetEfficiency(assetEfficiency);
      }
    }
  }, [selectedAssetId, investments]);

  const calculateCurrentAsset = () => {
    const salesCost = currentAsset.marketValue * (currentAsset.salesCostPercent / 100);
    const capitalGain = Math.max(0, currentAsset.marketValue - currentAsset.purchasePrice);
    const capitalGainsTax = capitalGain * (currentAsset.taxPercent / 100);
    const afterTaxNetEquity = currentAsset.marketValue - currentAsset.loanBalance - (salesCost + capitalGainsTax);
    
    // For current asset, use actual mortgage payment from investment data
    const selectedInvestment = selectedAssetId ? investments.find(inv => inv.id === selectedAssetId) : null;
    const monthlyMortgagePayment = selectedInvestment ? selectedInvestment.monthlyMortgage : 0;
    const mortgagePayment = monthlyMortgagePayment * 12;
    const cashAtHand = currentAsset.netRent - mortgagePayment;
    const appreciation = currentAsset.marketValue * (customAppreciationRate / 100);
    
    // Calculate tax benefits for current asset (if selected from portfolio)
    let taxBenefits = 0;
    if (selectedAssetId && investments.length > 0) {
      const selectedInvestment = investments.find(inv => inv.id === selectedAssetId);
      if (selectedInvestment) {
        const taxBenefitsResult = TaxBenefitsCalculator.calculateTaxBenefits(selectedInvestment);
        taxBenefits = taxBenefitsResult.totalTaxBenefits;
      }
    }
    
    // Net Value (Tax-Adjusted) = Net Yield - Interest + Appreciation + Tax Benefits
    const netValue12M = currentAsset.netRent - currentAsset.next12MonthInterest + appreciation + taxBenefits;
    // Calculate Net Yield: Gross Yield - Annual Expenses (exc.MortgagePMT)
    const grossYield = selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
      ? getEffectiveMonthlyRent(investments.find(inv => inv.id === selectedAssetId)!) * 12
      : currentAsset.netRent + (selectedAssetId && investments.find(inv => inv.id === selectedAssetId) ? getEffectiveMonthlyExpensesExcludingMortgage(investments.find(inv => inv.id === selectedAssetId)!) * 12 : 0);
    const annualExpensesExcMortgage = selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
      ? getEffectiveMonthlyExpensesExcludingMortgage(investments.find(inv => inv.id === selectedAssetId)!) * 12
      : 0;
    const netYield = grossYield - annualExpensesExcMortgage;

    // 10-year calculations (annualized average)
    // Calculate average annual interest over 10 years as loan balance decreases
    const annualPrincipalPayment = currentAsset.next12MonthPrincipal;
    const currentBalance = currentAsset.loanBalance;
    const averageBalance = currentBalance - (annualPrincipalPayment * 10) / 2; // Average balance over 10 years
    const interestRate = currentAsset.loanBalance > 0 ? currentAsset.next12MonthInterest / currentAsset.loanBalance : 0;
    const next10yInterest = Math.max(0, averageBalance * interestRate); // Average annual interest
    
    console.log('10y Interest Debug:', {
      annualPrincipalPayment,
      currentBalance,
      averageBalance,
      interestRate,
      next10yInterest,
      next12MonthInterest: currentAsset.next12MonthInterest,
      loanBalance: currentAsset.loanBalance
    });
    // Net Value (Tax-Adjusted) = Net Yield - Interest + Appreciation + Tax Benefits
    const netValue10y = currentAsset.netRent - next10yInterest + appreciation + taxBenefits;
    const annualMortgagePmt = mortgagePayment;

    return {
      afterTaxNetEquity,
      cashAtHand,
      netValue12M,
      netValue10y,
      netYield,
      salesCost,
      capitalGainsTax,
      appreciation,
      next10yInterest,
      annualMortgagePmt,
      taxBenefits
    };
  };

  const calculateMaxDebt = () => {
    const currentCalcs = calculateCurrentAsset();
    
    // Calculate max asset value using custom down payment percentage
    const downPaymentDecimal = customDownPayment / 100;
    const calculatedMaxAssetValue = currentCalcs.afterTaxNetEquity / downPaymentDecimal;
    const calculatedNumAssets = calculatedMaxAssetValue / currentAsset.marketValue;
    
    // Update maxDebt state with calculated values
    const updatedMaxDebt = {
      ...maxDebt,
      maxAssetValueWith20Down: calculatedMaxAssetValue,
      numAssets: calculatedNumAssets
    };
    
    const totalValue = updatedMaxDebt.maxAssetValueWith20Down;
    const totalLoan = totalValue * (1 - downPaymentDecimal); // Loan is based on custom down payment percentage
    const totalRent = totalValue * (customAssetEfficiency / 100); // Use custom asset efficiency
    
    const salesCost = totalValue * (currentAsset.salesCostPercent / 100);
    const capitalGainsTax = Math.max(0, (totalValue - totalLoan) * (currentAsset.taxPercent / 100));
    const afterTaxNetEquity = totalValue - totalLoan - (salesCost + capitalGainsTax);
    
    // Calculate mortgage payment using PMT formula
    const selectedInterestRate = customMortgageRate / 100;
    const monthlyMortgagePayment = calculatePMT(totalLoan, selectedInterestRate, loanTermYears);
    const mortgagePayment = monthlyMortgagePayment * 12;
    
    // Extract interest and principal from PMT calculation
    const estimatedInterest = totalLoan * selectedInterestRate;
    const estimatedPrincipal = mortgagePayment - estimatedInterest;
    
    const cashAtHand = totalRent - mortgagePayment;
    const appreciation = totalValue * (customAppreciationRate / 100);
    
    // Create a mock investment object for proper tax benefits calculation
    const selectedInvestment = selectedAssetId ? investments.find(inv => inv.id === selectedAssetId) : null;
    const mockInvestment: RealEstateInvestment = {
      ...(selectedInvestment || {
        id: "mock",
        propertyName: "Mock Property",
        address: "Mock Address",
        propertyType: "single-family" as const,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: "",
        avgAppreciationRate: customAppreciationRate,
        netEquity: afterTaxNetEquity,
        monthlyRent: totalRent / 12,
        monthlyEscrow: 0,
        currentTerm: 0,
        group: "",
        downPayment: totalValue * downPaymentDecimal,
        loanAmount: totalLoan,
        loanTerm: loanTermYears,
      }),
      currentValue: totalValue,
      purchasePrice: totalValue, // For depreciation calculation
      outstandingBalance: totalLoan,
      interestRate: selectedInterestRate * 100, // Convert back to percentage
      monthlyMortgage: monthlyMortgagePayment,
      monthlyExpenses: selectedInvestment ? getEffectiveMonthlyExpenses(selectedInvestment) : totalRent / 12 * 0.3, // Estimate 30% expenses if no investment selected
    };
    
    // Calculate proper tax benefits using the full calculator
    const taxBenefitsResult = TaxBenefitsCalculator.calculateTaxBenefits(mockInvestment);
    const estimatedTaxBenefits = taxBenefitsResult.totalTaxBenefits;
    
    // Net Value (Tax-Adjusted) = Net Yield - Interest + Appreciation + Tax Benefits
    const netValue12M = totalRent - estimatedInterest + appreciation + estimatedTaxBenefits;
    // For Max Debt Scenario:
    // 1. Gross Yield and Annual Expenses are N/A (meaningless)
    // 2. Net Yield = Asset Efficiency (%) * Market Value
    const grossYield = null; // N/A for Max Debt scenario
    const annualExpensesExcMortgage = null; // N/A for Max Debt scenario
    const netYield = totalValue * (customAssetEfficiency / 100); // Asset Efficiency * Market Value

    // 10-year calculations using selected interest rate
    const annualPrincipalPayment = estimatedPrincipal;
    const averageBalance = totalLoan - (annualPrincipalPayment * 10) / 2;
    const next10yInterest = Math.max(0, averageBalance * selectedInterestRate);
    
    console.log('Max Debt 10y Interest Debug:', {
      totalLoan,
      selectedInterestRate,
      annualPrincipalPayment,
      averageBalance,
      next10yInterest,
      estimatedPrincipal,
      estimatedInterest
    });
    // Net Value (Tax-Adjusted) = Net Yield - Interest + Appreciation + Tax Benefits (estimated for 10y)
    const netValue10y = totalRent - next10yInterest + appreciation + estimatedTaxBenefits;
    const annualMortgagePmt = mortgagePayment;

    return {
      afterTaxNetEquity,
      cashAtHand,
      netValue12M,
      netValue10y,
      netYield,
      totalValue,
      totalLoan,
      totalRent,
      calculatedMaxAssetValue,
      calculatedNumAssets,
      appreciation,
      estimatedInterest,
      estimatedPrincipal,
      next10yInterest,
      annualMortgagePmt,
      estimatedTaxBenefits
    };
  };

  const calculateZeroDebt = () => {
    const currentCalcs = calculateCurrentAsset();
    
    // Zero debt scenario: buy property with cash using after-tax net equity
    const cashPropertyValue = currentCalcs.afterTaxNetEquity;
    const outstandingBalance = 0; // No loan
    
    // Estimate rent based on property value using custom asset efficiency
    const estimatedRent = cashPropertyValue * (customAssetEfficiency / 100);
    
    // No selling costs or taxes for this calculation since we're not selling
    const afterTaxNetEquity = cashPropertyValue; // Full value is equity
    
    // No mortgage payments
    const estimatedInterest = 0;
    const estimatedPrincipal = 0;
    const cashAtHand = estimatedRent; // Full rent since no mortgage
    
     const appreciation = cashPropertyValue * (customAppreciationRate / 100);
     const netValue12M = estimatedRent + appreciation; // No interest expense
    // Calculate Net Yield: Gross Yield - Annual Expenses (exc.MortgagePMT)  
    const grossYield = selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
      ? getEffectiveMonthlyRent(investments.find(inv => inv.id === selectedAssetId)!) * 12 * (cashPropertyValue / currentAsset.marketValue)
      : estimatedRent;
    const annualExpensesExcMortgage = selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
      ? getEffectiveMonthlyExpensesExcludingMortgage(investments.find(inv => inv.id === selectedAssetId)!) * 12 * (cashPropertyValue / currentAsset.marketValue)
      : estimatedRent * 0.3; // Estimate 30% of rent as expenses if no asset selected
    const netYield = grossYield - annualExpensesExcMortgage;

    // 10-year calculations (annualized average)
    const next10yInterest = 0; // No interest in zero debt scenario
     const netValue10y = estimatedRent + appreciation; // No interest expense
    const annualMortgagePmt = 0; // No mortgage payment in zero debt scenario

    return {
      afterTaxNetEquity,
      cashAtHand,
      netValue12M,
      netValue10y,
      netYield,
      totalValue: cashPropertyValue,
      totalLoan: outstandingBalance,
      totalRent: estimatedRent,
      appreciation,
      estimatedInterest,
      estimatedPrincipal,
      next10yInterest,
      annualMortgagePmt
    };
  };

  const currentCalcs = calculateCurrentAsset();
  const maxDebtCalcs = calculateMaxDebt();
  const zeroDebtCalcs = calculateZeroDebt();

  const handleCurrentAssetChange = (field: keyof AssetData, value: string) => {
    setCurrentAsset(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleMaxDebtChange = (field: keyof MaxDebtData, value: string) => {
    setMaxDebt(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Auto-update max debt calculations when current asset changes
  useEffect(() => {
    const currentCalcs = calculateCurrentAsset();
    const downPaymentDecimal = customDownPayment / 100;
    const calculatedMaxAssetValue = currentCalcs.afterTaxNetEquity / downPaymentDecimal;
    const calculatedNumAssets = calculatedMaxAssetValue / currentAsset.marketValue;
    
    setMaxDebt(prev => ({
      ...prev,
      maxAssetValueWith20Down: calculatedMaxAssetValue,
      numAssets: calculatedNumAssets,
      rent: currentAsset.netRent // Auto-update rent to match current asset
    }));
  }, [currentAsset, settings, customDownPayment]);

  // Helper function to create expense breakdown for tooltip
  const getExpenseBreakdown = (investment: RealEstateInvestment | null, multiplier: number = 1) => {
    if (!investment || !investment.expenseDetails) return "No detailed expenses available";
    
    const details = investment.expenseDetails;
    const breakdown = [
      details.monthlyHELOC && details.monthlyHELOC > 0 ? `Monthly HELOC: $${Math.round(details.monthlyHELOC * multiplier * 12).toLocaleString()}` : null,
      details.annualInsurance && details.annualInsurance > 0 ? `Annual Insurance: $${Math.round(details.annualInsurance * multiplier).toLocaleString()}` : null,
      details.annualPropertyTaxes && details.annualPropertyTaxes > 0 ? `Annual Property Taxes: $${Math.round(details.annualPropertyTaxes * multiplier).toLocaleString()}` : null,
      details.monthlyManagementFees && details.monthlyManagementFees > 0 ? `Monthly Management Fees: $${Math.round(details.monthlyManagementFees * multiplier * 12).toLocaleString()}` : null,
      details.monthlyAssociationFees && details.monthlyAssociationFees > 0 ? `Monthly Association Fees: $${Math.round(details.monthlyAssociationFees * multiplier * 12).toLocaleString()}` : null,
      details.monthlyMaintenance && details.monthlyMaintenance > 0 ? `Monthly Maintenance: $${Math.round(details.monthlyMaintenance * multiplier * 12).toLocaleString()}` : null,
      details.monthlyEscrow && details.monthlyEscrow > 0 ? `Monthly Escrow: $${Math.round(details.monthlyEscrow * multiplier * 12).toLocaleString()}` : null,
      details.monthlyOther && details.monthlyOther > 0 ? `Monthly Other: $${Math.round(details.monthlyOther * multiplier * 12).toLocaleString()}` : null,
    ].filter(Boolean);
    
    return breakdown.length > 0 ? breakdown.join('\n') : "No expenses recorded";
  };

  // Helper function to create tax benefits breakdown for tooltip
  const getTaxBenefitsBreakdown = (investment: RealEstateInvestment | null) => {
    if (!investment) return "No investment selected";
    
    const taxBenefitsResult = TaxBenefitsCalculator.calculateTaxBenefits(investment);
    const breakdown = [
      `Annual Depreciation: $${Math.round(taxBenefitsResult.annualDepreciation).toLocaleString()}`,
      `Mortgage Interest Deduction: $${Math.round(taxBenefitsResult.mortgageInterestDeduction).toLocaleString()}`,
      `Property Tax Deduction: $${Math.round(taxBenefitsResult.propertyTaxDeduction).toLocaleString()}`,
      `Maintenance Deductions: $${Math.round(taxBenefitsResult.maintenanceDeductions).toLocaleString()}`,
      `Total: $${Math.round(taxBenefitsResult.totalTaxBenefits).toLocaleString()}`
    ];
    
    return breakdown.join('\n');
  };

  // Helper function to create Max Debt tax benefits breakdown
  const getMaxDebtTaxBenefitsBreakdown = () => {
    const maxDebtCalcs = calculateMaxDebt();
    const selectedInvestment = selectedAssetId ? investments.find(inv => inv.id === selectedAssetId) : null;
    
    // Recreate the mock investment like in calculateMaxDebt
    const downPaymentDecimal = customDownPayment / 100;
    const selectedInterestRate = customMortgageRate / 100;
    const monthlyMortgagePayment = calculatePMT(maxDebtCalcs.totalLoan, selectedInterestRate, loanTermYears);
    
    const mockInvestment: RealEstateInvestment = {
      ...(selectedInvestment || {
        id: "mock",
        propertyName: "Mock Property",
        address: "Mock Address",
        propertyType: "single-family" as const,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: "",
        avgAppreciationRate: customAppreciationRate,
        netEquity: maxDebtCalcs.afterTaxNetEquity,
        monthlyRent: maxDebtCalcs.totalRent / 12,
        monthlyEscrow: 0,
        currentTerm: 0,
        group: "",
        downPayment: maxDebtCalcs.totalValue * downPaymentDecimal,
        loanAmount: maxDebtCalcs.totalLoan,
        loanTerm: loanTermYears,
      }),
      currentValue: maxDebtCalcs.totalValue,
      purchasePrice: maxDebtCalcs.totalValue,
      outstandingBalance: maxDebtCalcs.totalLoan,
      interestRate: selectedInterestRate * 100,
      monthlyMortgage: monthlyMortgagePayment,
      monthlyExpenses: selectedInvestment ? getEffectiveMonthlyExpenses(selectedInvestment) : maxDebtCalcs.totalRent / 12 * 0.3,
    };
    
    const result = TaxBenefitsCalculator.calculateTaxBenefits(mockInvestment);
    const breakdown = [
      `Annual Depreciation: $${Math.round(result.annualDepreciation).toLocaleString()}`,
      `Mortgage Interest Deduction: $${Math.round(result.mortgageInterestDeduction).toLocaleString()}`,
      `Property Tax Deduction: $${Math.round(result.propertyTaxDeduction).toLocaleString()}`,
      `Maintenance Deductions: $${Math.round(result.maintenanceDeductions).toLocaleString()}`,
      `Total: $${Math.round(result.totalTaxBenefits).toLocaleString()}`
    ];
    
    return breakdown.join('\n');
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
      <CardHeader>
        <CardTitle>Financing Debt Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection Dropdown */}
        {investments.length > 0 && (
          <div className="mb-6">
            <Label htmlFor="assetSelect">Select Asset from Portfolio</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-full bg-background border border-input">
                <SelectValue placeholder="Choose an asset to auto-populate fields..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-input shadow-lg z-50">
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investment.propertyName} - {investment.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        
        {/* Controls Grid - Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Interest Rate Control */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Interest Rate (Max Debt)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomMortgageRate(prev => Math.max(0.5, prev - 0.5))}
                  disabled={customMortgageRate <= 0.5}
                >
                  -0.5%
                </Button>
                <span className="min-w-[4rem] text-center font-medium text-sm">
                  {customMortgageRate}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomMortgageRate(prev => prev + 0.5)}
                >
                  +0.5%
                </Button>
              </div>
            </div>
          </div>

          {/* Appreciation Rate Control */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Appreciation Rate (%)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomAppreciationRate(prev => Math.max(0.5, prev - 0.5))}
                  disabled={customAppreciationRate <= 0.5}
                >
                  -0.5%
                </Button>
                <span className="min-w-[4rem] text-center font-medium text-sm">
                  {customAppreciationRate}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomAppreciationRate(prev => prev + 0.5)}
                >
                  +0.5%
                </Button>
              </div>
            </div>
          </div>

          {/* Asset Efficiency Control */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Asset Efficiency (%)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomAssetEfficiency(prev => Math.max(0.5, prev - 0.5))}
                  disabled={customAssetEfficiency <= 0.5}
                >
                  -0.5%
                </Button>
                <span className="min-w-[4rem] text-center font-medium text-sm">
                  {customAssetEfficiency.toFixed(1)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomAssetEfficiency(prev => prev + 0.5)}
                >
                  +0.5%
                </Button>
              </div>
            </div>
          </div>

          {/* Down Payment Control */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Down Payment (%)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomDownPayment(prev => Math.max(5, prev - 5))}
                  disabled={customDownPayment <= 5}
                >
                  -5%
                </Button>
                <span className="min-w-[4rem] text-center font-medium text-sm">
                  {customDownPayment}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomDownPayment(prev => Math.min(95, prev + 5))}
                  disabled={customDownPayment >= 95}
                >
                  +5%
                </Button>
              </div>
            </div>
          </div>

          {/* Loan Term Control */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Loan Term (Years)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoanTermYears(prev => Math.max(5, prev - 5))}
                  disabled={loanTermYears <= 5}
                >
                  -5
                </Button>
                <span className="min-w-[4rem] text-center font-medium text-sm">
                  {loanTermYears}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoanTermYears(prev => Math.min(50, prev + 5))}
                  disabled={loanTermYears >= 50}
                >
                  +5
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Comparison Results</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-center">Current Asset</TableHead>
                <TableHead className="text-center">Max Debt Scenario</TableHead>
                <TableHead className="text-center">Zero Debt Scenario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Market Value</TableCell>
                <TableCell className="text-center">${Math.round(currentAsset.marketValue).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.totalValue).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.totalValue).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Outstanding Balance</TableCell>
                <TableCell className="text-center">${Math.round(currentAsset.loanBalance).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.totalLoan).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.totalLoan).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Interest Rate Used</TableCell>
                <TableCell className="text-center">{((currentAsset.next12MonthInterest / Math.max(currentAsset.loanBalance, 1)) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-center">{customMortgageRate.toFixed(2)}%</TableCell>
                <TableCell className="text-center">0.00%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">After-Tax Net Equity</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.afterTaxNetEquity).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.afterTaxNetEquity).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.afterTaxNetEquity).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow className="bg-green-800/20">
                <TableCell className="font-medium">Gross Yield</TableCell>
                <TableCell className="text-center">
                  ${Math.round(
                    selectedAssetId && investments.find(inv => inv.id === selectedAssetId) 
                      ? getEffectiveMonthlyRent(investments.find(inv => inv.id === selectedAssetId)!) * 12
                      : currentAsset.netRent + (selectedAssetId && investments.find(inv => inv.id === selectedAssetId) ? getEffectiveMonthlyExpenses(investments.find(inv => inv.id === selectedAssetId)!) * 12 : 0)
                  ).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  N/A
                </TableCell>
                <TableCell className="text-center">
                  ${Math.round(
                    selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
                      ? getEffectiveMonthlyRent(investments.find(inv => inv.id === selectedAssetId)!) * 12 * (zeroDebtCalcs.totalValue / currentAsset.marketValue)
                      : zeroDebtCalcs.totalRent
                  ).toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell className="font-medium cursor-help">Annual Expenses (exc.MortgagePMT)</TableCell>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs whitespace-pre-line">
                    <div className="text-sm">
                      <strong>Current Asset:</strong>
                      {'\n'}{getExpenseBreakdown(selectedAssetId ? investments.find(inv => inv.id === selectedAssetId) : null)}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <TableCell className="text-center">
                  ${Math.round(
                    selectedAssetId && investments.find(inv => inv.id === selectedAssetId) 
                      ? getEffectiveMonthlyExpensesExcludingMortgage(investments.find(inv => inv.id === selectedAssetId)!) * 12
                      : 0
                  ).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  N/A
                </TableCell>
                <TableCell className="text-center">
                  ${Math.round(
                    selectedAssetId && investments.find(inv => inv.id === selectedAssetId)
                      ? getEffectiveMonthlyExpensesExcludingMortgage(investments.find(inv => inv.id === selectedAssetId)!) * 12 * (zeroDebtCalcs.totalValue / currentAsset.marketValue)
                      : zeroDebtCalcs.totalRent * 0.3 // Estimate 30% of rent as expenses if no asset selected
                  ).toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow className="bg-green-600/20">
                <TableCell className="font-medium">Net Yield (Net Rent)</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.netYield).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.netYield).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.netYield).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Mortgage Pmt (Annual)</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.annualMortgagePmt).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.annualMortgagePmt).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.annualMortgagePmt).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow className="bg-green-200/30">
                <TableCell className="font-medium">Cash at Hand</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.cashAtHand).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.cashAtHand).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.cashAtHand).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell className="font-medium cursor-help">Tax Benefits (Annual)</TableCell>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs whitespace-pre-line">
                    <div className="text-sm">
                      <strong>Current Asset:</strong>
                      {'\n'}{getTaxBenefitsBreakdown(selectedAssetId ? investments.find(inv => inv.id === selectedAssetId) : null)}
                      {'\n\n'}<strong>Max Debt Scenario:</strong>
                      {'\n'}{getMaxDebtTaxBenefitsBreakdown()}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <TableCell className="text-center">${Math.round(currentCalcs.taxBenefits || 0).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.estimatedTaxBenefits || 0).toLocaleString()}</TableCell>
                <TableCell className="text-center">$0</TableCell>
              </TableRow>
              <TableRow className="bg-blue-200/30">
                <TableCell className="font-medium">Net Value Next12M</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.netValue12M).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.netValue12M).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.netValue12M).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow className="bg-blue-200/30">
                <TableCell className="font-medium">Net Value Next10y</TableCell>
                <TableCell className="text-center">${Math.round(currentCalcs.netValue10y).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(maxDebtCalcs.netValue10y).toLocaleString()}</TableCell>
                <TableCell className="text-center">${Math.round(zeroDebtCalcs.netValue10y).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};