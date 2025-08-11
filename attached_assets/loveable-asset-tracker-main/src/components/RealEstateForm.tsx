import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealEstateInvestment, ExpenseDetails } from "@/pages/Index";
import { calculateTotalExpensesFromDetails } from "@/lib/propertyUtils";

const PRESET_PROPERTIES = [
  {
    id: "boca-219",
    name: "Boca 219",
    data: {
      propertyName: "Boca 219",
      address: "500 SW Avenue, Boca Raton, Florida",
      purchasePrice: "212500",
      currentValue: "212500",
      netEquity: "184875", // 87% of 212500 (no mortgage)
      downPayment: "212500",
      loanAmount: "0",
      interestRate: "0",
      loanTerm: "0",
      monthlyMortgage: "0",
      monthlyRent: "1950",
      monthlyRentPotential: "",
      isInvestmentProperty: "true",
      monthlyExpenses: "936.33", // Auto-calculated from detailed expenses
      monthlyEscrow: "0",
      avgAppreciationRate: "3.5",
      outstandingBalance: "0",
      currentTerm: "0",
      propertyType: "single-family",
      purchaseDate: "2024-05-01",
      notes: "",
      group: "",
      country: "USA",
    },
    expenseDetails: {
      monthlyHELOC: 0,
      annualInsurance: 0,
      annualPropertyTaxes: 2800,
      monthlyManagementFees: 125,
      monthlyAssociationFees: 578,
      monthlyMaintenance: 0,
      monthlyMortgage: 0,
      monthlyEscrow: 0,
      monthlyOther: 0,
    }
  },
  {
    id: "hillcrest-12",
    name: "12 Hillcrest",
    data: {
      propertyName: "12 Hillcrest",
      address: "12 Hillcrest Ct, South San Francisco, CA 94080",
      purchasePrice: "675000",
      currentValue: "1250000",
      netEquity: "825000", // 66% of 1250000 (has mortgage)
      downPayment: "230000",
      loanAmount: "445000",
      interestRate: "3.75",
      loanTerm: "30",
      monthlyMortgage: "2030",
      monthlyRent: "4450",
      monthlyRentPotential: "",
      isInvestmentProperty: "true",
      monthlyExpenses: "2910",
      monthlyEscrow: "0",
      avgAppreciationRate: "3.5",
      outstandingBalance: "", // Will be auto-calculated
      currentTerm: "125", // Months since purchase
      propertyType: "single-family",
      purchaseDate: "2014-03-01",
      notes: "",
      group: "",
      country: "USA",
    },
    expenseDetails: {
      monthlyHELOC: 0,
      annualInsurance: 0,
      annualPropertyTaxes: 0,
      monthlyManagementFees: 0,
      monthlyAssociationFees: 0,
      monthlyMaintenance: 0,
      monthlyMortgage: 2030,
      monthlyEscrow: 880,
      monthlyOther: 0,
    }
  },
  {
    id: "lupin-way",
    name: "Lupin way",
    data: {
      propertyName: "Lupin way",
      address: "925 Lupin way San Carlos CA",
      purchasePrice: "1375000",
      currentValue: "2300000",
      netEquity: "1629165", // Current value minus outstanding balance
      downPayment: "704165", // Purchase price minus loan amount
      loanAmount: "670835",
      interestRate: "2.50",
      loanTerm: "30",
      monthlyMortgage: "1600",
      monthlyRent: "0",
      monthlyRentPotential: "6500",
      isInvestmentProperty: "false",
      monthlyExpenses: "1600",
      monthlyEscrow: "0",
      avgAppreciationRate: "3.5",
      outstandingBalance: "670835",
      currentTerm: "66",
      propertyType: "single-family",
      purchaseDate: "2020-03-01",
      notes: "",
      group: "",
      country: "USA",
    },
    expenseDetails: {
      monthlyHELOC: 1600,
      annualInsurance: 0,
      annualPropertyTaxes: 0,
      monthlyManagementFees: 0,
      monthlyAssociationFees: 0,
      monthlyMaintenance: 0,
      monthlyMortgage: 0,
      monthlyEscrow: 0,
      monthlyOther: 0,
    }
  }
];

interface RealEstateFormProps {
  onSubmit: (investment: Omit<RealEstateInvestment, "id">) => void;
  onCancel: () => void;
  initialData?: RealEstateInvestment | null;
}

export const RealEstateForm = ({ onSubmit, onCancel, initialData }: RealEstateFormProps) => {
  const [isInvestmentProperty, setIsInvestmentProperty] = useState(
    initialData ? (initialData.isInvestmentProperty !== false) : true
  );
  const [useDetailedExpenses, setUseDetailedExpenses] = useState(
    initialData ? !!initialData.expenseDetails : true
  );

  // Helper function to calculate cumulative principal paid (CUMPRINC equivalent)
  const calculateCumulativePrincipal = (rate: number, numPeriods: number, presentValue: number, startPeriod: number, endPeriod: number) => {
    if (rate === 0) {
      // For 0% interest, principal is paid evenly
      const monthlyPrincipal = presentValue / numPeriods;
      return monthlyPrincipal * (endPeriod - startPeriod + 1);
    }

    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = presentValue * (monthlyRate * Math.pow(1 + monthlyRate, numPeriods)) / (Math.pow(1 + monthlyRate, numPeriods) - 1);
    
    let cumulativePrincipal = 0;
    let remainingBalance = presentValue;
    
    for (let period = startPeriod; period <= endPeriod; period++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      cumulativePrincipal += principalPayment;
      remainingBalance -= principalPayment;
    }
    
    return cumulativePrincipal;
  };

  // Helper function to calculate outstanding balance using currentTerm
  const calculateOutstandingBalance = (loanAmount: number, interestRate: number, loanTerm: number, currentTerm: number) => {
    if (loanAmount === 0) return 0;
    
    const totalPeriods = loanTerm * 12;
    
    if (currentTerm <= 0) return loanAmount;
    if (currentTerm >= totalPeriods) return 0;
    
    const cumulativePrincipalPaid = calculateCumulativePrincipal(interestRate, totalPeriods, loanAmount, 1, currentTerm);
    return Math.max(0, loanAmount - cumulativePrincipalPaid);
  };
  
  // Helper function to calculate months elapsed since purchase
  const calculateMonthsElapsed = (purchaseDate: string) => {
    if (!purchaseDate) return 0;
    return Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  };

  const [formData, setFormData] = useState({
    propertyName: initialData?.propertyName || "",
    address: initialData?.address || "",
    purchasePrice: initialData?.purchasePrice?.toString() || "",
    currentValue: initialData?.currentValue?.toString() || "",
    netEquity: initialData?.netEquity?.toString() || "",
    downPayment: initialData?.downPayment?.toString() || "",
    loanAmount: initialData?.loanAmount?.toString() || "",
    interestRate: initialData?.interestRate?.toString() || "",
    loanTerm: initialData?.loanTerm?.toString() || "",
    monthlyMortgage: initialData?.monthlyMortgage?.toString() || "",
    monthlyRent: initialData?.monthlyRent?.toString() || "",
    monthlyRentPotential: initialData?.monthlyRentPotential?.toString() || "",
    isInvestmentProperty: initialData?.isInvestmentProperty !== false ? "true" : "false",
    monthlyExpenses: initialData?.monthlyExpenses?.toString() || "",
    monthlyEscrow: initialData?.monthlyEscrow?.toString() || "",
      avgAppreciationRate: initialData?.avgAppreciationRate?.toString() || "3.5",
      outstandingBalance: initialData?.outstandingBalance?.toString() || "",
      currentTerm: initialData?.currentTerm?.toString() || "",
      propertyType: initialData?.propertyType || "",
      purchaseDate: initialData?.purchaseDate || "",
      notes: initialData?.notes || "",
      group: initialData?.group || "",
      country: initialData?.country || "USA",
  });

  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetails>({
    monthlyHELOC: initialData?.expenseDetails?.monthlyHELOC || 0,
    annualInsurance: initialData?.expenseDetails?.annualInsurance || 0,
    annualPropertyTaxes: initialData?.expenseDetails?.annualPropertyTaxes || 0,
    monthlyManagementFees: initialData?.expenseDetails?.monthlyManagementFees || 0,
    monthlyAssociationFees: initialData?.expenseDetails?.monthlyAssociationFees || 0,
    monthlyMaintenance: initialData?.expenseDetails?.monthlyMaintenance || 0,
    monthlyMortgage: initialData?.expenseDetails?.monthlyMortgage || initialData?.monthlyMortgage || 0,
    monthlyEscrow: initialData?.expenseDetails?.monthlyEscrow || initialData?.monthlyEscrow || 0,
    monthlyOther: initialData?.expenseDetails?.monthlyOther || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const investment: Omit<RealEstateInvestment, "id"> = {
      propertyName: formData.propertyName,
      address: formData.address,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      currentValue: parseFloat(formData.currentValue) || 0,
      netEquity: parseFloat(formData.netEquity) || 0,
      downPayment: parseFloat(formData.downPayment) || 0,
      loanAmount: parseFloat(formData.loanAmount) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      loanTerm: parseInt(formData.loanTerm) || 0,
      monthlyMortgage: parseFloat(formData.monthlyMortgage) || 0,
      monthlyRent: parseFloat(formData.monthlyRent) || 0,
      monthlyRentPotential: parseFloat(formData.monthlyRentPotential) || undefined,
      isInvestmentProperty: formData.isInvestmentProperty === "true",
      monthlyExpenses: useDetailedExpenses ? calculateTotalExpensesFromDetails(expenseDetails) : (parseFloat(formData.monthlyExpenses) || 0),
      expenseDetails: useDetailedExpenses ? expenseDetails : undefined,
      monthlyEscrow: parseFloat(formData.monthlyEscrow) || 0,
      avgAppreciationRate: parseFloat(formData.avgAppreciationRate) || 3.5,
      outstandingBalance: parseFloat(formData.outstandingBalance) || 0,
      currentTerm: parseInt(formData.currentTerm) || 0,
      propertyType: formData.propertyType as RealEstateInvestment["propertyType"],
      purchaseDate: formData.purchaseDate,
      notes: formData.notes,
      group: formData.group,
      country: formData.country,
    };

    onSubmit(investment);
  };

  const handleExpenseDetailChange = (field: keyof ExpenseDetails, value: string) => {
    const newExpenseDetails = { ...expenseDetails, [field]: parseFloat(value) || 0 };
    setExpenseDetails(newExpenseDetails);
    
    // Auto-update the total monthly expenses when using detailed breakdown
    if (useDetailedExpenses) {
      const total = calculateTotalExpensesFromDetails(newExpenseDetails);
      setFormData(prev => ({ ...prev, monthlyExpenses: total.toString() }));
    }
  };

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-calculate currentTerm when purchase date changes
    if (field === "purchaseDate" && value) {
      const monthsElapsed = calculateMonthsElapsed(value);
      newFormData.currentTerm = monthsElapsed.toString();
    }
    
    // Auto-calculate down payment when loan amount or purchase price changes
    if ((field === "loanAmount" || field === "purchasePrice") && newFormData.purchasePrice && newFormData.loanAmount) {
      const purchasePrice = parseFloat(newFormData.purchasePrice) || 0;
      const loanAmount = parseFloat(newFormData.loanAmount) || 0;
      if (purchasePrice > 0 && loanAmount > 0) {
        newFormData.downPayment = Math.max(0, purchasePrice - loanAmount).toString();
      }
    }
    
    // Auto-calculate outstanding balance when relevant fields change
    if ((field === "loanAmount" || field === "interestRate" || field === "loanTerm" || field === "currentTerm" || field === "purchaseDate")) {
      const loanAmount = parseFloat(newFormData.loanAmount) || 0;
      if (loanAmount > 0) {
        const currentTerm = parseInt(newFormData.currentTerm) || 0;
        const calculatedBalance = calculateOutstandingBalance(
          loanAmount,
          parseFloat(newFormData.interestRate) || 0,
          parseInt(newFormData.loanTerm) || 30,
          currentTerm
        );
        newFormData.outstandingBalance = Math.round(calculatedBalance).toString();
      } else {
        newFormData.outstandingBalance = "0";
      }
    }
    
    // Auto-calculate Net Equity/NRV using dynamic formula: 100% - (Outstanding Balance/Market Value) - 6% (selling costs)
    if ((field === "currentValue" || field === "loanAmount" || field === "interestRate" || field === "loanTerm" || field === "currentTerm" || field === "purchaseDate" || field === "outstandingBalance") && newFormData.currentValue) {
      const currentValue = parseFloat(newFormData.currentValue) || 0;
      const outstandingBalance = parseFloat(newFormData.outstandingBalance) || 0;
      
      if (currentValue > 0) {
        // Calculate NRV adjustor: 100% - (Outstanding Balance/Market Value) - 6% (selling costs)
        const debtRatio = outstandingBalance / currentValue;
        const nrvAdjustor = 1.0 - debtRatio - 0.06; // 100% - debt ratio - 6% selling costs
        const netEquity = Math.max(0, currentValue * nrvAdjustor);
        newFormData.netEquity = Math.round(netEquity).toString();
      }
    }
    
    setFormData(newFormData);
  };

  const handlePresetSelect = (presetId: string) => {
    if (presetId === "none") return;
    
    const preset = PRESET_PROPERTIES.find(p => p.id === presetId);
    if (preset) {
      let newFormData = { ...preset.data };
      setIsInvestmentProperty(preset.data.isInvestmentProperty === "true");
      
      // Set detailed expenses if available
      if (preset.expenseDetails) {
        setExpenseDetails(preset.expenseDetails);
        setUseDetailedExpenses(true);
        // Calculate total from detailed expenses
        const total = calculateTotalExpensesFromDetails(preset.expenseDetails);
        newFormData.monthlyExpenses = total.toString();
      } else {
        setUseDetailedExpenses(false);
      }
      
      // Auto-calculate currentTerm from purchase date
      if (newFormData.purchaseDate) {
        const monthsElapsed = calculateMonthsElapsed(newFormData.purchaseDate);
        newFormData.currentTerm = monthsElapsed.toString();
      }
      
      // Auto-calculate outstanding balance
      const loanAmount = parseFloat(newFormData.loanAmount) || 0;
      if (loanAmount > 0) {
        const currentTerm = parseInt(newFormData.currentTerm) || 0;
        const calculatedBalance = calculateOutstandingBalance(
          loanAmount,
          parseFloat(newFormData.interestRate) || 0,
          parseInt(newFormData.loanTerm) || 30,
          currentTerm
        );
        newFormData.outstandingBalance = Math.round(calculatedBalance).toString();
      } else {
        newFormData.outstandingBalance = "0";
      }
      
      // Auto-calculate Net Equity/NRV using dynamic formula
      const currentValue = parseFloat(newFormData.currentValue) || 0;
      const outstandingBalance = parseFloat(newFormData.outstandingBalance) || 0;
      
      if (currentValue > 0) {
        const debtRatio = outstandingBalance / currentValue;
        const nrvAdjustor = 1.0 - debtRatio - 0.06; // 100% - debt ratio - 6% selling costs
        const netEquity = Math.max(0, currentValue * nrvAdjustor);
        newFormData.netEquity = Math.round(netEquity).toString();
      }
      
      setFormData({ ...newFormData, country: newFormData.country || "USA" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!initialData && (
        <div className="space-y-2 mb-6 p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="preset">Quick Add Property</Label>
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset property to auto-fill form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Manual Entry</SelectItem>
              {PRESET_PROPERTIES.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyName">Property Name *</Label>
          <Input
            id="propertyName"
            value={formData.propertyName}
            onChange={(e) => handleChange("propertyName", e.target.value)}
            placeholder="e.g., Sunset Boulevard Duplex"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select value={formData.propertyType} onValueChange={(value) => handleChange("propertyType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single-family">Single Family</SelectItem>
              <SelectItem value="multi-family">Multi Family</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="group">Property Group</Label>
          <Input
            id="group"
            value={formData.group}
            onChange={(e) => handleChange("group", e.target.value)}
            placeholder="e.g., My Properties, Spouse Properties"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="Turkey">Turkey</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="123 Main St, City, State, ZIP"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase Price *</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => handleChange("purchasePrice", e.target.value)}
            placeholder="250000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentValue">Current Value</Label>
          <Input
            id="currentValue"
            type="number"
            value={formData.currentValue}
            onChange={(e) => handleChange("currentValue", e.target.value)}
            placeholder="275000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="netEquity">Net Equity/NRV (Auto-calculated)</Label>
          <Input
            id="netEquity"
            type="number"
            value={formData.netEquity}
            onChange={(e) => handleChange("netEquity", e.target.value)}
            placeholder="Auto-calculated based on mortgage status"
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated using formula: Current Value × (100% - Outstanding Balance/Current Value - 6% selling costs)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanAmount">Loan Amount</Label>
          <Input
            id="loanAmount"
            type="number"
            value={formData.loanAmount}
            onChange={(e) => handleChange("loanAmount", e.target.value)}
            placeholder="200000"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty if property has no mortgage
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="downPayment">Down Payment (Auto-calculated)</Label>
          <Input
            id="downPayment"
            type="number"
            value={formData.downPayment}
            onChange={(e) => handleChange("downPayment", e.target.value)}
            placeholder="50000"
            className="bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Current Interest Rate (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) => handleChange("interestRate", e.target.value)}
            placeholder="4.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanTerm">Loan Term (years)</Label>
          <Input
            id="loanTerm"
            type="number"
            value={formData.loanTerm}
            onChange={(e) => handleChange("loanTerm", e.target.value)}
            placeholder="30"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isInvestmentProperty"
              checked={isInvestmentProperty}
              onCheckedChange={(checked) => {
                setIsInvestmentProperty(!!checked);
                handleChange("isInvestmentProperty", checked ? "true" : "false");
              }}
            />
            <Label htmlFor="isInvestmentProperty">This is an investment property (generates rental income)</Label>
          </div>
        </div>

        {isInvestmentProperty ? (
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent Income</Label>
            <Input
              id="monthlyRent"
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => handleChange("monthlyRent", e.target.value)}
              placeholder="1800"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="monthlyRentPotential">Monthly Rent Potential</Label>
            <Input
              id="monthlyRentPotential"
              type="number"
              value={formData.monthlyRentPotential}
              onChange={(e) => handleChange("monthlyRentPotential", e.target.value)}
              placeholder="6500"
            />
            <p className="text-xs text-muted-foreground">
              Estimated rental income if this property were to be rented out
            </p>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="useDetailedExpenses"
              checked={useDetailedExpenses}
              onCheckedChange={(checked) => {
                setUseDetailedExpenses(!!checked);
                if (checked) {
                  // When switching to detailed, calculate total from details
                  const total = calculateTotalExpensesFromDetails(expenseDetails);
                  setFormData(prev => ({ ...prev, monthlyExpenses: total.toString() }));
                }
              }}
            />
            <Label htmlFor="useDetailedExpenses">Break down expenses into categories</Label>
          </div>
          
          {useDetailedExpenses ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyMortgage">Monthly Mortgage Payment</Label>
                  <Input
                    id="monthlyMortgage"
                    type="number"
                    value={expenseDetails.monthlyMortgage || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyMortgage", e.target.value)}
                    placeholder="1200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyEscrow">Monthly Escrow (Tax + Insurance)</Label>
                  <Input
                    id="monthlyEscrow"
                    type="number"
                    value={expenseDetails.monthlyEscrow || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyEscrow", e.target.value)}
                    placeholder="400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyManagementFees">Monthly Management Fees</Label>
                  <Input
                    id="monthlyManagementFees"
                    type="number"
                    value={expenseDetails.monthlyManagementFees || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyManagementFees", e.target.value)}
                    placeholder="150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyAssociationFees">Monthly Association Fees</Label>
                  <Input
                    id="monthlyAssociationFees"
                    type="number"
                    value={expenseDetails.monthlyAssociationFees || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyAssociationFees", e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyMaintenance">Monthly Maintenance</Label>
                  <Input
                    id="monthlyMaintenance"
                    type="number"
                    value={expenseDetails.monthlyMaintenance || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyMaintenance", e.target.value)}
                    placeholder="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyHELOC">Monthly HELOC Payment</Label>
                  <Input
                    id="monthlyHELOC"
                    type="number"
                    value={expenseDetails.monthlyHELOC || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyHELOC", e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyOther">Monthly Other Expenses</Label>
                  <Input
                    id="monthlyOther"
                    type="number"
                    value={expenseDetails.monthlyOther || ""}
                    onChange={(e) => handleExpenseDetailChange("monthlyOther", e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="annualInsurance">Annual Insurance</Label>
                  <Input
                    id="annualInsurance"
                    type="number"
                    value={expenseDetails.annualInsurance || ""}
                    onChange={(e) => handleExpenseDetailChange("annualInsurance", e.target.value)}
                    placeholder="1200"
                  />
                  <p className="text-xs text-muted-foreground">Will be converted to monthly</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="annualPropertyTaxes">Annual Property Taxes</Label>
                  <Input
                    id="annualPropertyTaxes"
                    type="number"
                    value={expenseDetails.annualPropertyTaxes || ""}
                    onChange={(e) => handleExpenseDetailChange("annualPropertyTaxes", e.target.value)}
                    placeholder="3600"
                  />
                  <p className="text-xs text-muted-foreground">Will be converted to monthly</p>
                </div>
                
                <div className="space-y-2 md:col-span-2 bg-muted/50 p-4 rounded-lg">
                  <Label className="text-base font-semibold">Total Monthly Expenses (Auto-calculated)</Label>
                  <div className="text-2xl font-bold text-primary">
                    ${calculateTotalExpensesFromDetails(expenseDetails).toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Monthly Expenses</Label>
              <Input
                id="monthlyExpenses"
                type="number"
                value={formData.monthlyExpenses}
                onChange={(e) => handleChange("monthlyExpenses", e.target.value)}
                placeholder="300"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgAppreciationRate">Avg. US Real Estate Appreciation (%)</Label>
          <Input
            id="avgAppreciationRate"
            type="number"
            step="0.1"
            value={formData.avgAppreciationRate}
            onChange={(e) => handleChange("avgAppreciationRate", e.target.value)}
            placeholder="3.5"
          />
          <p className="text-xs text-muted-foreground">
            Default 3.5% - used for Net Return calculations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outstandingBalance">Outstanding Balance ($)</Label>
          <Input
            id="outstandingBalance"
            type="number"
            value={formData.outstandingBalance}
            onChange={(e) => handleChange("outstandingBalance", e.target.value)}
            placeholder="Auto-calculated from loan amount"
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Current remaining loan balance - auto-calculated from loan amount
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => handleChange("purchaseDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentTerm">Current Term (Months)</Label>
          <Input
            id="currentTerm"
            type="number"
            value={formData.currentTerm}
            onChange={(e) => handleChange("currentTerm", e.target.value)}
            placeholder="Auto-calculated from purchase date"
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Months since purchase - auto-calculated but can be manually overridden
          </p>
        </div>


        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Additional notes about this property..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Investment" : "Add Investment"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};