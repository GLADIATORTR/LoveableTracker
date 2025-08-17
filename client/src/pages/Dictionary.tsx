import { useState } from "react";
import { Search, Home, Building, TrendingUp, Calculator, DollarSign, Users, MapPin, Calendar, FileText } from "lucide-react";
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
    term: "Cash at Hand",
    definition: "The net cash flow accumulated from a property over time, calculated as cumulative net yield minus cumulative mortgage payments (in present value). This represents the actual cash benefit received from the investment, adjusted for inflation.",
    category: "Financial Metrics",
    icon: DollarSign,
    relatedTerms: ["Net Yield", "Present Value", "Cumulative Mortgage PV"]
  },
  {
    id: "2",
    term: "Net Gain Present Value",
    definition: "The total financial gain from a property investment expressed in today's purchasing power. Calculated as net equity plus cumulative net yield minus cumulative mortgage payments, all discounted to present value using inflation rates.",
    category: "Financial Metrics",
    icon: TrendingUp,
    relatedTerms: ["Net Equity", "Present Value", "Cash at Hand"]
  },
  {
    id: "3",
    term: "Annual Net Yield",
    definition: "The yearly cash flow from a property calculated as (Monthly Rent - Monthly Expenses) × 12. This excludes mortgage payments and represents the property's operating cash flow in today's dollars.",
    category: "Financial Metrics",
    icon: Calculator,
    relatedTerms: ["Monthly Rent", "Monthly Expenses", "Cash Flow"]
  },
  {
    id: "4",
    term: "Outstanding Balance",
    definition: "The remaining principal amount owed on a mortgage loan. This decreases over time as mortgage payments are made, following an amortization schedule.",
    category: "Mortgage",
    icon: FileText,
    relatedTerms: ["Principal", "Amortization", "Loan Term"]
  },
  {
    id: "5",
    term: "Current Term",
    definition: "The number of months that have passed since the loan originated. Used to calculate the current position in the amortization schedule and remaining loan balance.",
    category: "Mortgage",
    icon: Calendar,
    relatedTerms: ["Loan Term", "Outstanding Balance", "Amortization"]
  },
  {
    id: "6",
    term: "Capital Gains Tax",
    definition: "Tax paid on the profit from selling a property, calculated as (Sale Price - Purchase Price - Improvements) × Tax Rate. Varies by country and holding period.",
    category: "Taxation",
    icon: DollarSign,
    relatedTerms: ["Sale Price", "Purchase Price", "Tax Rate"]
  },
  {
    id: "7",
    term: "Net Equity",
    definition: "The owner's actual stake in a property after accounting for all costs. Calculated as Market Value - Outstanding Balance - Capital Gains Tax - Selling Costs, expressed in present value.",
    category: "Financial Metrics",
    icon: Home,
    relatedTerms: ["Market Value", "Outstanding Balance", "Selling Costs"]
  },
  {
    id: "8",
    term: "Property Type",
    definition: "Classification of real estate based on use and structure. Common types include Single Family homes, Condos, Multi-Family properties, and Commercial buildings.",
    category: "Property Classification",
    icon: Building,
    relatedTerms: ["Single Family", "Condo", "Multi-Family"]
  },
  {
    id: "9",
    term: "Appreciation Rate",
    definition: "The annual percentage increase in property value. Varies by country and region - typically 3.5% for USA properties and 12% for Turkey properties in this system.",
    category: "Market Analysis",
    icon: TrendingUp,
    relatedTerms: ["Market Value", "Current Value", "Country Settings"]
  },
  {
    id: "10",
    term: "Present Value",
    definition: "The current worth of future cash flows, discounted back to today's dollars using inflation rates. Essential for comparing investments across different time periods.",
    category: "Financial Theory",
    icon: Calculator,
    relatedTerms: ["Inflation Rate", "Discount Rate", "Time Value"]
  }
];

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(dictionaryEntries.map(entry => entry.category)));

  const filteredEntries = dictionaryEntries.filter(entry => {
    const matchesSearch = entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Financial Metrics": "bg-blue-100 text-blue-800",
      "Mortgage": "bg-green-100 text-green-800",
      "Taxation": "bg-red-100 text-red-800",
      "Property Classification": "bg-purple-100 text-purple-800",
      "Market Analysis": "bg-orange-100 text-orange-800",
      "Financial Theory": "bg-cyan-100 text-cyan-800"
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
      <div className="flex flex-col sm:flex-row gap-4">
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
        
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Badge>
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
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
