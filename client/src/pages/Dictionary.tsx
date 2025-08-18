import { useState } from "react";
import { Search, Home, Building, TrendingUp, Calculator, DollarSign, Users, MapPin, Calendar, FileText, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  icon: any;
  relatedTerms?: string[];
}

const dictionaryEntries: DictionaryEntry[] = [
  {
    id: "1",
    term: "Real ROI (Return on Investment)",
    definition: "Inflation-adjusted return on investment that shows the true purchasing power gain. Calculated as ((Current Value - Purchase Price) / Inflation-Adjusted Purchase Price) × 100. Uses historical CPI data from 1950-2024 to provide accurate real returns.",
    category: "Financial Metrics",
    icon: TrendingUp,
    relatedTerms: ["Nominal ROI", "Inflation", "CPI", "Real Appreciation Rate"]
  },
  {
    id: "2",
    term: "Nominal ROI",
    definition: "Traditional return on investment without inflation adjustment. Calculated as ((Current Value - Purchase Price) / Purchase Price) × 100. Shows raw percentage gain but doesn't account for purchasing power changes.",
    category: "Financial Metrics", 
    icon: Calculator,
    relatedTerms: ["Real ROI", "Purchase Price", "Current Value"]
  },
  {
    id: "3",
    term: "Real Appreciation Rate (Annualized)",
    definition: "The annual percentage increase in property value after adjusting for inflation. Shows true wealth creation rate by accounting for changes in purchasing power over time.",
    category: "Financial Metrics",
    icon: TrendingUp,
    relatedTerms: ["Real ROI", "Inflation", "Annual Growth"]
  },
  {
    id: "4",
    term: "Cap Rate (Capitalization Rate)",
    definition: "Annual net operating income as a percentage of property value. Calculated as (Annual Net Cash Flow / Current Property Value) × 100. Measures the return on investment from cash flow alone.",
    category: "Financial Metrics",
    icon: Calculator,
    relatedTerms: ["Cash Flow", "NOI", "Property Value", "Yield"]
  },
  {
    id: "5",
    term: "Cash Flow",
    definition: "Monthly net income from a property calculated as Monthly Rent - Monthly Expenses. Positive cash flow means the property generates income; negative means it costs money monthly.",
    category: "Financial Metrics",
    icon: DollarSign,
    relatedTerms: ["Monthly Rent", "Monthly Expenses", "NOI"]
  },
  {
    id: "6",
    term: "Total Cash at Hand",
    definition: "Portfolio-wide annual net cash flow from all rent-generating properties. Sum of (Monthly Rent - Monthly Expenses) × 12 for all properties with positive rental income.",
    category: "Portfolio Metrics",
    icon: DollarSign,
    relatedTerms: ["Cash Flow", "Portfolio", "Rent-Generating Properties"]
  },
  {
    id: "7",
    term: "Portfolio Star Rating",
    definition: "Performance benchmarking system using 1-5 stars based on Real ROI and Cap Rate: 1⭐=0-2%, 2⭐=2-4%, 3⭐=4-6%, 4⭐=6-8%, 5⭐=8%+ annual returns.",
    category: "Portfolio Metrics",
    icon: TrendingUp,
    relatedTerms: ["Real ROI", "Cap Rate", "Benchmarking"]
  },
  {
    id: "8",
    term: "Inflation-Adjusted Purchase Price",
    definition: "Original purchase price converted to today's purchasing power using historical Consumer Price Index (CPI) data. Shows what the original investment would cost in current dollars.",
    category: "Inflation Analysis",
    icon: Calculator,
    relatedTerms: ["CPI", "Purchase Price", "Inflation", "Present Value"]
  },
  {
    id: "9",
    term: "Consumer Price Index (CPI)",
    definition: "Government measure of inflation tracking the cost of goods and services. Application uses authentic historical CPI data from 1950-2024 to calculate real returns and inflation adjustments.",
    category: "Economic Indicators",
    icon: TrendingUp,
    relatedTerms: ["Inflation", "Real ROI", "Historical Data"]
  },
  {
    id: "10",
    term: "S&P 500 Index",
    definition: "Stock market index tracking 500 largest U.S. companies. Used as a benchmark for investment performance comparison. Application includes historical data from 1950s showing major market periods.",
    category: "Economic Indicators",
    icon: TrendingUp,
    relatedTerms: ["Market Benchmark", "Investment Comparison", "Historical Performance"]
  },
  {
    id: "11",
    term: "Case-Shiller Home Price Index",
    definition: "Measures changes in residential real estate prices. Tracks repeat sales of the same properties to show true market appreciation, providing real estate market benchmarks.",
    category: "Economic Indicators",
    icon: Home,
    relatedTerms: ["Home Prices", "Real Estate Market", "Price Appreciation"]
  },
  {
    id: "12",
    term: "Monthly Mortgage Payment",
    definition: "Fixed monthly payment toward loan principal and interest. Calculated using loan amount, interest rate, and loan term. Does not include taxes, insurance, or HOA fees.",
    category: "Mortgage",
    icon: FileText,
    relatedTerms: ["Principal", "Interest", "Loan Amount", "Loan Term"]
  },
  {
    id: "13",
    term: "Outstanding Balance",
    definition: "Remaining principal amount owed on a mortgage loan. Decreases over time as mortgage payments are made, following an amortization schedule.",
    category: "Mortgage",
    icon: FileText,
    relatedTerms: ["Principal", "Amortization", "Loan Term"]
  },
  {
    id: "14",
    term: "Net Equity",
    definition: "Owner's actual stake in a property after all costs. Calculated as Current Value - Outstanding Balance - Selling Costs - Capital Gains Tax. Represents true ownership value.",
    category: "Financial Metrics",
    icon: Home,
    relatedTerms: ["Current Value", "Outstanding Balance", "Selling Costs"]
  },
  {
    id: "15",
    term: "Market Sentiment",
    definition: "Real-time indicator of market conditions using AI analysis. Provides mood assessment (Optimistic, Cautious, Concerned) with confidence scores and market trend insights.",
    category: "Market Analysis",
    icon: TrendingUp,
    relatedTerms: ["Market Mood", "AI Analysis", "Trend Indicator"]
  },
  {
    id: "16",
    term: "Monthly Expenses",
    definition: "Regular monthly costs of property ownership including maintenance, property management, insurance, taxes, and utilities. Used to calculate net cash flow and cap rate.",
    category: "Property Management",
    icon: DollarSign,
    relatedTerms: ["Cash Flow", "Operating Expenses", "NOI"]
  },
  {
    id: "17",
    term: "Purchase Date",
    definition: "Date when property was acquired. Critical for inflation calculations, loan amortization, and determining holding period for tax implications and performance analysis.",
    category: "Property Data",
    icon: Calendar,
    relatedTerms: ["Holding Period", "Inflation Calculation", "Amortization"]
  },
  {
    id: "18",
    term: "Property Categories",
    definition: "Classification system for real estate types including Single Family, Condo, Multi-Family, Commercial, and Land. Used for portfolio diversification analysis and benchmarking.",
    category: "Property Classification",
    icon: Building,
    relatedTerms: ["Diversification", "Property Type", "Portfolio Analysis"]
  },
  {
    id: "19",
    term: "Portfolio IRR (Internal Rate of Return)",
    definition: "The average annual return rate across all properties in the portfolio, calculated using advanced cash flow projections. Uses Newton-Raphson method to determine the discount rate that makes NPV equal to zero. Accounts for purchase price, rental income, expenses, and projected future sale value over 10-year periods.",
    category: "Portfolio Metrics",
    icon: TrendingUp,
    relatedTerms: ["NPV", "Cash Flow", "Discount Rate", "Investment Return"]
  },
  {
    id: "20",
    term: "Total NPV (Net Present Value)",
    definition: "Sum of all individual property NPVs using 8% discount rate. Represents the total dollar value created by the portfolio above the minimum required return. Positive NPV indicates wealth creation; negative suggests underperformance vs alternative investments.",
    category: "Portfolio Metrics",
    icon: DollarSign,
    relatedTerms: ["IRR", "Discount Rate", "Portfolio Value", "Investment Analysis"]
  },
  {
    id: "21",
    term: "Average NPV Index",
    definition: "Portfolio-wide profitability index calculated as Total NPV ÷ Total Initial Investment. Values above 1.0 indicate value creation, while below 1.0 suggests capital destruction. Measures efficiency of capital allocation across the portfolio.",
    category: "Portfolio Metrics",
    icon: Calculator,
    relatedTerms: ["NPV", "Profitability Index", "Capital Efficiency", "Investment Returns"]
  },
  {
    id: "22",
    term: "Risk Score",
    definition: "Composite risk assessment (0-100 scale) based on cap rate, property age, market stability, and cash flow consistency. Lower scores indicate less risky investments. Calculated using cap rate performance, holding period length, and market volatility factors.",
    category: "Portfolio Metrics",
    icon: TrendingUp,
    relatedTerms: ["Cap Rate", "Portfolio Risk", "Investment Risk", "Market Volatility"]
  }
];

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Predefined categories in the desired order
  const categories = [
    "Financial Metrics",
    "Portfolio Metrics", 
    "Inflation Analysis",
    "Economic Indicators",
    "Mortgage",
    "Market Analysis",
    "Property Management",
    "Property Data",
    "Property Classification"
  ];

  const filteredEntries = dictionaryEntries.filter(entry => {
    const matchesSearch = entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Financial Metrics": "bg-blue-100 text-blue-800",
      "Portfolio Metrics": "bg-emerald-100 text-emerald-800",
      "Inflation Analysis": "bg-amber-100 text-amber-800",
      "Economic Indicators": "bg-violet-100 text-violet-800",
      "Mortgage": "bg-green-100 text-green-800",
      "Market Analysis": "bg-orange-100 text-orange-800",
      "Property Management": "bg-rose-100 text-rose-800",
      "Property Data": "bg-slate-100 text-slate-800",
      "Property Classification": "bg-purple-100 text-purple-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Asset Dictionary</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive database of real estate investment terms and definitions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search terms and definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Investment Strategy Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Dictionary Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEntries.map(entry => {
          const IconComponent = entry.icon;
          return (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{entry.term}</CardTitle>
                      <Badge className={`text-xs ${getCategoryColor(entry.category)}`}>
                        {entry.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed mb-4">
                  {entry.definition}
                </CardDescription>
                
                {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Related Terms:</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.relatedTerms.map(term => (
                        <Badge key={term} variant="outline" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No terms found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or selecting a different category.
          </p>
        </div>
      )}
    </div>
  );
}
