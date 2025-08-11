import React from 'react';
import { CollapsibleCard } from './CollapsibleCard';
import { RealEstateInvestment } from '@/pages/Index';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PerformanceProjectionsProps {
  investments: RealEstateInvestment[];
}

export const PerformanceProjections: React.FC<PerformanceProjectionsProps> = ({ investments }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProjections = () => {
    const years = Array.from({ length: 10 }, (_, i) => i + 1);
    
    return years.map(year => {
      let totalValue = 0;
      let totalCashFlow = 0;
      
      investments.forEach(investment => {
        const appreciation = investment.avgAppreciationRate || 3.5;
        const currentValue = investment.currentValue || investment.purchasePrice;
        const projectedValue = currentValue * Math.pow(1 + appreciation / 100, year);
        const projectedCashFlow = (investment.monthlyRent - investment.monthlyExpenses) * 12 * year;
        
        totalValue += projectedValue;
        totalCashFlow += projectedCashFlow;
      });
      
      return {
        year,
        totalValue,
        totalCashFlow,
        totalReturn: totalValue + totalCashFlow
      };
    });
  };

  const projectionData = calculateProjections();

  return (
    <CollapsibleCard 
      title="Performance Projections" 
      description="10-year portfolio value and cash flow projections"
      defaultOpen={false}
    >
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="totalValue" stroke="#2563eb" name="Portfolio Value" strokeWidth={2} />
            <Line type="monotone" dataKey="totalCashFlow" stroke="#16a34a" name="Cumulative Cash Flow" strokeWidth={2} />
            <Line type="monotone" dataKey="totalReturn" stroke="#dc2626" name="Total Return" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CollapsibleCard>
  );
};