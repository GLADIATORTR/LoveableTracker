import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const Dictionary = () => {
  const navigate = useNavigate();
  const definitions = [
    {
      term: "After-Tax Net Equity",
      formula: "Market Value - Loan Balance - (Sales Cost + Capital Gains Tax)",
      description: "The net equity remaining after selling the property and paying all costs and taxes"
    },
    {
      term: "Cash at Hand",
      formula: "Net Yield - Mortgage Payment",
      description: "Annual cash flow available after mortgage payments"
    },
    {
      term: "Net Value", 
      formula: "Net Yield - Interest + Appreciation + Tax Benefits",
      description: "Total annual value creation including rental income, appreciation, and tax benefits"
    },
    {
      term: "Net Yield (Net Rent)",
      formula: "Annual Rent - Annual Expenses",
      description: "Net rental income after all operating expenses"
    },
    {
      term: "Mortgage Payment",
      formula: "Next 12-Month Interest + Next 12-Month Principal",
      description: "Total annual mortgage payment including interest and principal"
    },
    {
      term: "Sales Cost",
      formula: "Market Value × Sales Cost %",
      description: "Total costs associated with selling the property (realtor fees, closing costs, etc.)"
    },
    {
      term: "Capital Gains Tax",
      formula: "(Market Value - Loan Balance) × Capital Gains Tax %",
      description: "Tax on the profit from selling the property"
    },
    {
      term: "Appreciation",
      formula: "Market Value × Real Estate Appreciation Rate %",
      description: "Annual increase in property value"
    },
    {
      term: "Annual Depreciation",
      formula: "Cost Basis ÷ Depreciation Period (27.5 years residential, 39 years commercial)",
      description: "Annual tax deduction for property depreciation"
    },
    {
      term: "Total Tax Benefits",
      formula: "Annual Depreciation + Mortgage Interest Deduction + Property Tax Deduction + Maintenance Deductions",
      description: "Total annual tax deductions available from the property"
    },
    {
      term: "Mortgage Interest Deduction",
      formula: "Annual Mortgage Interest Payments",
      description: "Tax-deductible mortgage interest paid annually"
    },
    {
      term: "Property Tax Deduction",
      formula: "Annual Property Tax Payments",
      description: "Tax-deductible property taxes paid annually"
    },
    {
      term: "Maintenance Deductions",
      formula: "Annual Maintenance and Repair Expenses",
      description: "Tax-deductible property maintenance and operating expenses"
    },
    {
      term: "Cost Basis",
      formula: "Purchase Price × Building Ratio (typically 80%)",
      description: "Depreciable value of the property for tax purposes"
    },
    {
      term: "Depreciation Recapture",
      formula: "Total Depreciation Taken × 25%",
      description: "Tax owed on depreciation when property is sold"
    },
    {
      term: "Max Asset Value with 20% Down",
      formula: "After-Tax Net Equity × 5",
      description: "Maximum property value you can purchase using available equity as 20% down payment"
    },
    {
      term: "Number of Assets",
      formula: "Max Asset Value with 20% Down ÷ Market Value",
      description: "Number of similar properties you could purchase with available equity"
    },
    {
      term: "Current Yield",
      formula: "(Net Rent ÷ Current Value) × 100",
      description: "Annual rental yield as percentage of current property value"
    },
    {
      term: "Monthly Cash Flow",
      formula: "Monthly Rent - Monthly Expenses - Monthly Escrow - Monthly Mortgage",
      description: "Net monthly cash flow from the property"
    },
    {
      term: "Cash-on-Cash Return",
      formula: "(Annual Cash Flow ÷ Initial Cash Investment) × 100",
      description: "Return on actual cash invested, including down payment and closing costs"
    },
    {
      term: "1031 Exchange",
      formula: "Like-Kind Property Exchange",
      description: "Tax-deferred exchange allowing reinvestment of proceeds into similar property"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Real Estate Investment Dictionary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Term</TableHead>
                <TableHead className="w-1/3">Formula</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {definitions.map((def, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{def.term}</TableCell>
                  <TableCell className="font-mono text-sm">{def.formula}</TableCell>
                  <TableCell>{def.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dictionary;