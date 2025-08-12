import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface DictionaryEntry {
  term: string;
  type: string;
  formula: string;
  description: string;
}

export const FINANCIAL_DICTIONARY: DictionaryEntry[] = [
  {
    term: "After-Tax Net Equity",
    type: "USD",
    formula: "Market Value - Loan Balance - (Sales Cost + Capital Gains Tax)",
    description: "The net equity remaining after selling the property and paying all costs and taxes"
  },
  {
    term: "Net Yield (Net Rent) (Cash Flow)",
    type: "USD", 
    formula: "Rent - Expenses (Mortgage,Escrow(Tax,Insurance),Association,Monthly Management Fee,Maintenance,Misc.)",
    description: "Net rental income after all operating expenses"
  },
  {
    term: "Market Value (Current Value)",
    type: "USD",
    formula: "Estimated Sales Value of the Property",
    description: "This value appreciates with country specific appreciation rate"
  },
  {
    term: "% Net Yield of Market Value",
    type: "Measure",
    formula: "(Net Rent ÷ Current Value) × 100",
    description: "Annual rental yield as percentage of current property value"
  },
  {
    term: "Mortgage Payment",
    type: "USD",
    formula: "Mortgage Payment",
    description: "Total annual mortgage payment including interest and principal"
  },
  {
    term: "Cash at Hand",
    type: "USD",
    formula: "Net Yield - Mortgage Payment",
    description: "Annual cash flow available after mortgage payments"
  },
  {
    term: "Net Value",
    type: "USD",
    formula: "Net Yield - Interest + Appreciation + Tax Benefits",
    description: "Total annual value creation including rental income, appreciation, and tax benefits"
  },
  {
    term: "Escrow",
    type: "USD",
    formula: "Tax + Insurance Payments",
    description: "Total costs associated with selling the property (realtor fees, closing costs, etc.)"
  },
  {
    term: "Sales Cost",
    type: "USD",
    formula: "Market Value × Sales Cost % per Country",
    description: "Total costs associated with selling the property (realtor fees, closing costs, etc.)"
  },
  {
    term: "Capital Gains Tax",
    type: "USD",
    formula: "(Market Value - Loan Balance) × Capital Gains Tax % per Country",
    description: "Tax on the profit from selling the property"
  },
  {
    term: "Appreciation",
    type: "USD",
    formula: "Market Value × Real Estate Appreciation Rate % per Country",
    description: "Annual increase in property value"
  },
  {
    term: "Cost Basis",
    type: "USD",
    formula: "Purchase Price × Building Ratio (typically 80%)",
    description: "Depreciable value of the property for tax purposes"
  },
  {
    term: "Annual Depreciation",
    type: "USD",
    formula: "Cost Basis ÷ Depreciation Period (27.5 years residential)",
    description: "Annual tax deduction for property depreciation"
  },
  {
    term: "Mortgage Interest Deduction",
    type: "USD",
    formula: "Annual Mortgage Interest Payments",
    description: "Tax-deductible mortgage interest paid annually"
  },
  {
    term: "Property Tax Deduction",
    type: "USD",
    formula: "Annual Property Tax Payments",
    description: "Tax-deductible property taxes paid annually"
  },
  {
    term: "Maintenance Deductions",
    type: "USD",
    formula: "Annual Maintenance and Repair Expenses",
    description: "Tax-deductible property maintenance and operating expenses"
  },
  {
    term: "Total Tax Benefits",
    type: "USD",
    formula: "Annual Depreciation + Mortgage Interest Deduction + Property Tax Deduction + Maintenance Deductions",
    description: "Total annual tax deductions available from the property"
  },
  {
    term: "1031 Exchange",
    type: "Process",
    formula: "Like-Kind Property Exchange",
    description: "Tax-deferred exchange allowing reinvestment of proceeds into similar property"
  },
  {
    term: "Depreciation Recapture",
    type: "Measure",
    formula: "Total Depreciation Taken × 25% (Annual Cash Flow ÷ Initial Investment) × 100",
    description: "Tax owed on depreciation when property is sold"
  },
  {
    term: "Cash-on-Cash Return",
    type: "Measure",
    formula: "(Annual Cash Flow ÷ Initial Investment) × 100",
    description: "Return on actual cash invested including down payment and closing costs"
  }
];

export function FinancialDictionary() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Financial Dictionary
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Real Estate Investment Financial Dictionary
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Term</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-80">Formula</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FINANCIAL_DICTIONARY.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {entry.term}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.type === "USD" ? "default" : entry.type === "Measure" ? "secondary" : "outline"}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.formula}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}