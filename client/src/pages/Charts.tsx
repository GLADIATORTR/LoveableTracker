import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateNetGainPV } from "@/lib/timeseries-calculations";

interface ChartDataPoint {
  year: number;
  [propertyName: string]: number;
}

export default function Charts() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  const { data: investments, isLoading, error } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading investments...</div>
      </div>
    );
  }

  if (error) {
    console.error('Charts page error:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">Error loading investments: {String(error)}</div>
      </div>
    );
  }

  if (!investments || investments.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No investments found.</div>
      </div>
    );
  }

  // Generate chart data for years 0-30 using shared calculation functions
  const years = Array.from({ length: 31 }, (_, i) => i);
  const chartData: ChartDataPoint[] = years.map(year => {
    const dataPoint: ChartDataPoint = { year };
    
    // Calculate Net Gain PV for each selected property using the exact TimeSeries calculations
    selectedProperties.forEach(propertyId => {
      const investment = investments.find(inv => inv.id === propertyId);
      if (investment) {
        const netGainPV = calculateNetGainPV(investment, year);
        dataPoint[investment.propertyName || 'Unknown'] = netGainPV;
      }
    });
    
    return dataPoint;
  });

  // Define colors for different properties
  const colors = [
    '#8B5CF6', // Purple
    '#10B981', // Emerald  
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#84CC16', // Lime
  ];

  const handlePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Charts</h1>
        <p className="text-gray-600">Interactive Net Gain Present Value analysis across multiple properties</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Selection</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {investments.map((investment) => (
              <label key={investment.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(investment.id)}
                  onChange={() => handlePropertySelection(investment.id)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 truncate">
                  {investment.propertyName || 'Unknown Property'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {selectedProperties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Please select at least one property to view the chart.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Net Gain Present Value (Years 0-30)</h2>
              <p className="text-sm text-gray-600">Values are in today's purchasing power using country-specific inflation rates</p>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Net Gain PV ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Net Gain PV']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  {selectedProperties.map((propertyId, index) => {
                    const investment = investments.find(inv => inv.id === propertyId);
                    if (!investment) return null;
                    
                    return (
                      <Line
                        key={propertyId}
                        type="monotone"
                        dataKey={investment.propertyName || 'Unknown'}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}