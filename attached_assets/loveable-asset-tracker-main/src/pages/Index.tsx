import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { RealEstateForm } from "@/components/RealEstateForm";
import { RealEstateList } from "@/components/RealEstateList";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { InvestmentComparison } from "@/components/InvestmentComparison";
import InvestmentTimeSeriesChart from "@/components/InvestmentTimeSeriesChart";
import { FinancingDebtSimulator } from "@/components/FinancingDebtSimulator";
import { GlobalSettingsDialog } from "@/components/GlobalSettingsDialog";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { InvestmentDecisionAnalyzerMulti } from "@/components/InvestmentDecisionAnalyzerMulti";
import { RealEstateImport } from "@/components/RealEstateImport";
import { PerformanceProjections } from "@/components/PerformanceProjections";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export interface ExpenseDetails {
  monthlyHELOC?: number;
  annualInsurance?: number;
  annualPropertyTaxes?: number;
  monthlyManagementFees?: number;
  monthlyAssociationFees?: number;
  monthlyMaintenance?: number;
  monthlyMortgage?: number;
  monthlyEscrow?: number;
  monthlyOther?: number;
}

export interface RealEstateInvestment {
  id: string;
  propertyName: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  netEquity: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyMortgage: number;
  monthlyRent: number;
  monthlyRentPotential?: number; // For non-investment properties
  isInvestmentProperty?: boolean; // Default true, false for primary residence
  monthlyExpenses: number;
  expenseDetails?: ExpenseDetails; // Optional detailed expense breakdown
  monthlyEscrow: number;
  avgAppreciationRate: number; // Default 3.5%
  outstandingBalance: number;
  currentTerm: number; // Months since purchase
  propertyType: "single-family" | "multi-family" | "condo" | "townhouse" | "commercial";
  purchaseDate: string;
  notes?: string;
  group?: string; // Property group for filtering
  country?: string; // Country location
  
  // Enhanced Tax Benefits
  annualDepreciation?: number;
  mortgageInterestDeduction?: number;
  propertyTaxDeduction?: number;
  maintenanceDeductions?: number;
  totalTaxBenefits?: number; // auto-calculated with manual override
  taxBenefitOverride?: number;
  
  // Additional property details for enhanced analytics
  zipCode?: string;
  taxRate?: number; // For tax optimization calculations
  depreciationMethod?: "straight-line" | "accelerated";
  costBasis?: number; // For depreciation calculations
}

const Index = () => {
  const [investments, setInvestments] = useState<RealEstateInvestment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<RealEstateInvestment | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedInvestments = localStorage.getItem('realEstateInvestments');
    if (savedInvestments) {
      try {
        setInvestments(JSON.parse(savedInvestments));
      } catch (error) {
        console.error('Error loading saved investments:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever investments change
  useEffect(() => {
    localStorage.setItem('realEstateInvestments', JSON.stringify(investments));
  }, [investments]);

  const addInvestment = (investment: Omit<RealEstateInvestment, "id">) => {
    const newInvestment = {
      ...investment,
      id: Date.now().toString(),
    };
    setInvestments([...investments, newInvestment]);
    setShowForm(false);
  };

  const importInvestments = (importedInvestments: Omit<RealEstateInvestment, "id">[]) => {
    const newInvestments = importedInvestments.map(investment => ({
      ...investment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));
    setInvestments([...investments, ...newInvestments]);
  };

  // Add the provided properties
  const addProvidedProperties = () => {
    // Also need to add the US properties from previous requests
    const usProperties = [
      {
        propertyName: "Lupin Way",
        group: "US_Properties",
        country: "USA",
        propertyType: "single-family" as const,
        address: "123 Lupin Way, California",
        purchaseDate: "2020-01-01",
        purchasePrice: 450000,
        currentValue: 500000,
        monthlyRent: 0,
        monthlyRentPotential: 2500,
        monthlyExpenses: 800,
        netEquity: 450000,
        downPayment: 450000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2020-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: false,
      },
      {
        propertyName: "12 Hillcrest",
        group: "US_Properties",
        country: "USA",
        propertyType: "condo" as const,
        address: "12 Hillcrest Drive, New York",
        purchaseDate: "2019-06-01",
        purchasePrice: 320000,
        currentValue: 350000,
        monthlyRent: 2200,
        monthlyExpenses: 650,
        netEquity: 350000,
        downPayment: 320000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2019-06-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Boca Raton",
        group: "US_Properties", 
        country: "USA",
        propertyType: "single-family" as const,
        address: "456 Ocean Drive, Boca Raton, FL",
        purchaseDate: "2021-03-01",
        purchasePrice: 280000,
        currentValue: 320000,
        monthlyRent: 1850,
        monthlyExpenses: 520,
        netEquity: 320000,
        downPayment: 280000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2021-03-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      }
    ];

    const providedProperties: Omit<RealEstateInvestment, "id">[] = [
      ...usProperties,
      {
        propertyName: "Levent",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Besiktas, Levent, Menekseli S No8",
        purchaseDate: "2005-10-01",
        purchasePrice: 930000,
        currentValue: 2000000,
        monthlyRent: 4500,
        monthlyExpenses: 333.33,
        netEquity: 2000000,
        downPayment: 930000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2005-10-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Eyup",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Eyup, Topcular C, No 40",
        purchaseDate: "2007-11-01",
        purchasePrice: 700000,
        currentValue: 1800000,
        monthlyRent: 5750,
        monthlyExpenses: 300,
        netEquity: 1800000,
        downPayment: 700000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2007-11-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Sisli_Gulbahar",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Sisli, Mecidiyekoy, Gulbahar M, Buyukdere C, Oya S, Tumer Plaza, No 7/6",
        purchaseDate: "2016-09-01",
        purchasePrice: 430000,
        currentValue: 550000,
        monthlyRent: 1100,
        monthlyExpenses: 91.67,
        netEquity: 550000,
        downPayment: 430000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2016-09-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Sisli_Halaskargazi",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Sisli, 19 Mayis M, Halaskargazi C, 226/1",
        purchaseDate: "2002-01-01",
        purchasePrice: 110000,
        currentValue: 550000,
        monthlyRent: 1050,
        monthlyExpenses: 91.67,
        netEquity: 550000,
        downPayment: 110000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2002-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Sisli_HirantDink",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Sisli, 19 Mayis M, Hirant Dink, 96/4",
        purchaseDate: "1995-01-01",
        purchasePrice: 60000,
        currentValue: 250000,
        monthlyRent: 825,
        monthlyExpenses: 41.67,
        netEquity: 250000,
        downPayment: 60000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("1995-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "KocaMustafa_AptiIpekci",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "KocaMustafaPasa, Apti Ipekci M, Mercan Balik S No 4/2",
        purchaseDate: "1990-01-01",
        purchasePrice: 9000,
        currentValue: 120000,
        monthlyRent: 300,
        monthlyExpenses: 20,
        netEquity: 120000,
        downPayment: 9000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("1990-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "KocaMustafa_Marmara",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "KocaMustafaPasa, Marmara C, 116/6",
        purchaseDate: "1970-01-01",
        purchasePrice: 2000,
        currentValue: 120000,
        monthlyRent: 313,
        monthlyExpenses: 20,
        netEquity: 120000,
        downPayment: 2000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("1970-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "ErsoySahil",
        group: "Arin_Aile",
        country: "USA",
        propertyType: "condo",
        address: "Kadikoy, Suadiye, Zihni Sakaryali S 7/2",
        purchaseDate: "2018-12-01",
        purchasePrice: 300000,
        currentValue: 400000,
        monthlyRent: 0,
        monthlyRentPotential: 1200,
        monthlyExpenses: 66.67,
        netEquity: 400000,
        downPayment: 300000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("2018-12-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: false,
      },
      {
        propertyName: "Sisli_Siracevizler",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Sisli, Merkez M, Siracevizler C, Marmara Ap, 132/7",
        purchaseDate: "1982-01-01",
        purchasePrice: 11840,
        currentValue: 300000,
        monthlyRent: 600,
        monthlyExpenses: 50,
        netEquity: 300000,
        downPayment: 11840,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("1982-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      },
      {
        propertyName: "Atakoy",
        group: "Arin_Aile",
        country: "Turkey",
        propertyType: "condo",
        address: "Bakirkoy, Atakoy, Karanfil S No 1/KB A/7-Bl 13/143",
        purchaseDate: "1995-01-01",
        purchasePrice: 32200,
        currentValue: 300000,
        monthlyRent: 875,
        monthlyExpenses: 50,
        netEquity: 300000,
        downPayment: 32200,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 360,
        monthlyMortgage: 0,
        monthlyEscrow: 0,
        avgAppreciationRate: 3.5,
        outstandingBalance: 0,
        currentTerm: Math.floor((new Date().getTime() - new Date("1995-01-01").getTime()) / (1000 * 60 * 60 * 24 * 30)),
        isInvestmentProperty: true,
      }
    ];

    importInvestments(providedProperties);
  };

  // Auto-import the provided properties on component mount if no investments exist
  useEffect(() => {
    if (investments.length === 0) {
      const hasProvidedProperties = localStorage.getItem('hasAddedProvidedProperties');
      if (!hasProvidedProperties) {
        addProvidedProperties();
        localStorage.setItem('hasAddedProvidedProperties', 'true');
      }
    }
  }, [investments.length]);

  const updateInvestment = (updatedInvestment: Omit<RealEstateInvestment, "id">) => {
    if (editingInvestment) {
      setInvestments(investments.map(inv => 
        inv.id === editingInvestment.id 
          ? { ...updatedInvestment, id: editingInvestment.id }
          : inv
      ));
      setEditingInvestment(null);
    }
  };

  const updateInvestmentById = (id: string, updates: Partial<RealEstateInvestment>) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
  };

  const handleEdit = (investment: RealEstateInvestment) => {
    setEditingInvestment(investment);
    setShowForm(false);
  };

  // Get unique groups for filtering
  const getUniqueGroups = () => {
    const groups = new Set(investments.map(inv => inv.group).filter(Boolean));
    return Array.from(groups).sort();
  };

  // Filter investments by selected group
  const filteredInvestments = selectedGroup === "all" 
    ? investments 
    : investments.filter(inv => inv.group === selectedGroup);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Real Estate Investment Tracker</h1>
              <p className="text-xl text-muted-foreground">
                Track your real estate investments, mortgages, and rental income
              </p>
            </div>
            <div className="flex gap-2">
              <GlobalSettingsDialog investments={investments} />
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/dictionary">
                  <BookOpen className="h-4 w-4" />
                  Dictionary
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Add Real Estate Investment
          </Button>
          <RealEstateImport onImport={importInvestments} />
        </div>

        {(showForm || editingInvestment) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingInvestment ? "Edit Real Estate Investment" : "Add New Real Estate Investment"}
              </CardTitle>
              <CardDescription>
                {editingInvestment 
                  ? "Update the details for your real estate investment property"
                  : "Enter all the details for your real estate investment property"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealEstateForm
                onSubmit={editingInvestment ? updateInvestment : addInvestment}
                onCancel={() => {
                  setShowForm(false);
                  setEditingInvestment(null);
                }}
                initialData={editingInvestment}
              />
            </CardContent>
          </Card>
        )}

        {investments.length > 0 && (
          <FinancingDebtSimulator investments={investments} />
        )}

        {investments.length > 0 && (
          <>
            <PortfolioSummary 
              investments={filteredInvestments} 
              selectedGroup={selectedGroup}
              onGroupChange={setSelectedGroup}
              allInvestments={investments}
            />
            <AdvancedAnalyticsDashboard 
              investments={filteredInvestments}
              onUpdateInvestment={updateInvestmentById}
            />
            <InvestmentComparison investments={filteredInvestments} />
            <div className="space-y-8">
              <InvestmentTimeSeriesChart investments={filteredInvestments} />
              <PerformanceProjections investments={filteredInvestments} />
            </div>
            <InvestmentDecisionAnalyzerMulti investments={filteredInvestments} />
          </>
        )}

        <RealEstateList
          investments={filteredInvestments}
          onDelete={deleteInvestment}
          onEdit={handleEdit}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
          allInvestments={investments}
        />
      </div>
    </div>
  );
};

export default Index;
