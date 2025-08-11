import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Download, Calendar, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { TaxBenefitsCalculator } from "./TaxBenefitsCalculator";
import { getEffectiveMonthlyExpenses } from "@/lib/propertyUtils";

interface AnalyticsReportGeneratorProps {
  investments: RealEstateInvestment[];
}

export const AnalyticsReportGenerator = ({ investments }: AnalyticsReportGeneratorProps) => {
  const [reportType, setReportType] = useState<string>("portfolio-summary");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("annual");
  const [selectedProperties, setSelectedProperties] = useState<string[]>(investments.map(inv => inv.id));
  const [includeOptions, setIncludeOptions] = useState({
    taxBenefits: true,
    marketComparison: true,
    performanceMetrics: true,
    recommendations: true,
    charts: false
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  const generateReportData = () => {
    const filteredInvestments = investments.filter(inv => selectedProperties.includes(inv.id));
    
    // Portfolio Summary
    const totalPurchasePrice = filteredInvestments.reduce((sum, inv) => sum + inv.purchasePrice, 0);
    const totalCurrentValue = filteredInvestments.reduce((sum, inv) => 
      sum + (inv.currentValue > 0 ? inv.currentValue : inv.purchasePrice), 0);
    const totalDownPayment = filteredInvestments.reduce((sum, inv) => sum + inv.downPayment, 0);
    const totalMonthlyRent = filteredInvestments.reduce((sum, inv) => sum + inv.monthlyRent, 0);
    const totalMonthlyCosts = filteredInvestments.reduce((sum, inv) => 
      sum + getEffectiveMonthlyExpenses(inv), 0);
    const totalMonthlyCashFlow = totalMonthlyRent - totalMonthlyCosts;

    // Tax Benefits
    let totalTaxBenefits = 0;
    let totalTaxSavings = 0;
    const taxDetails = filteredInvestments.map(investment => {
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
      const taxRate = investment.taxRate || 0.25;
      const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, taxRate);
      
      totalTaxBenefits += taxBenefits.totalTaxBenefits;
      totalTaxSavings += taxSavings;
      
      return {
        property: investment.propertyName,
        taxBenefits: taxBenefits.totalTaxBenefits,
        taxSavings,
        breakdown: {
          depreciation: taxBenefits.annualDepreciation,
          interest: taxBenefits.mortgageInterestDeduction,
          propertyTax: taxBenefits.propertyTaxDeduction,
          maintenance: taxBenefits.maintenanceDeductions
        }
      };
    });

    // Performance Metrics
    const performanceMetrics = filteredInvestments.map(investment => {
      const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
      const monthlyNonMortgageCosts = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
      const annualNetIncome = (investment.monthlyRent - monthlyNonMortgageCosts) * 12;
      const capRate = currentValue > 0 ? (annualNetIncome / currentValue) * 100 : 0;
      
      const totalMonthlyCosts = getEffectiveMonthlyExpenses(investment);
      const annualCashFlow = (investment.monthlyRent - totalMonthlyCosts) * 12;
      const cashOnCashReturn = investment.downPayment > 0 ? (annualCashFlow / investment.downPayment) * 100 : 0;
      
      const yearsHeld = investment.purchaseDate 
        ? (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
        : 1;
      const totalAppreciation = investment.purchasePrice > 0 
        ? ((currentValue - investment.purchasePrice) / investment.purchasePrice) * 100
        : 0;
      const annualizedAppreciation = yearsHeld > 0 ? totalAppreciation / yearsHeld : 0;

      return {
        property: investment.propertyName,
        capRate,
        cashOnCashReturn,
        annualizedAppreciation,
        totalReturn: cashOnCashReturn + annualizedAppreciation,
        yearsHeld
      };
    });

    return {
      reportMetadata: {
        type: reportType,
        timeframe: selectedTimeframe,
        generatedDate: new Date().toLocaleDateString(),
        propertyCount: filteredInvestments.length,
        totalValue: totalCurrentValue
      },
      portfolioSummary: {
        totalPurchasePrice,
        totalCurrentValue,
        totalDownPayment,
        totalMonthlyRent,
        totalMonthlyCosts,
        totalMonthlyCashFlow,
        totalAppreciation: totalPurchasePrice > 0 ? ((totalCurrentValue - totalPurchasePrice) / totalPurchasePrice) * 100 : 0,
        portfolioROI: totalDownPayment > 0 ? (totalMonthlyCashFlow * 12 / totalDownPayment) * 100 : 0
      },
      taxAnalysis: {
        totalTaxBenefits,
        totalTaxSavings,
        details: taxDetails
      },
      performanceAnalysis: {
        metrics: performanceMetrics,
        averageCapRate: performanceMetrics.reduce((sum, m) => sum + m.capRate, 0) / performanceMetrics.length,
        averageCashOnCash: performanceMetrics.reduce((sum, m) => sum + m.cashOnCashReturn, 0) / performanceMetrics.length,
        averageTotalReturn: performanceMetrics.reduce((sum, m) => sum + m.totalReturn, 0) / performanceMetrics.length
      }
    };
  };

  const generateHTMLReport = () => {
    const data = generateReportData();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Real Estate Investment Report - ${data.reportMetadata.generatedDate}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Real Estate Investment Portfolio Report</h1>
        <p>Generated on ${data.reportMetadata.generatedDate} | ${data.reportMetadata.propertyCount} Properties | Total Value: ${formatCurrency(data.reportMetadata.totalValue)}</p>
    </div>

    <div class="section">
        <h2>Portfolio Summary</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(data.portfolioSummary.totalCurrentValue)}</div>
                <div class="metric-label">Total Portfolio Value</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(data.portfolioSummary.totalDownPayment)}</div>
                <div class="metric-label">Total Investment</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(data.portfolioSummary.totalMonthlyCashFlow)}</div>
                <div class="metric-label">Monthly Cash Flow</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatPercentage(data.portfolioSummary.totalAppreciation)}</div>
                <div class="metric-label">Total Appreciation</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatPercentage(data.portfolioSummary.portfolioROI)}</div>
                <div class="metric-label">Portfolio ROI</div>
            </div>
        </div>
    </div>

    ${includeOptions.taxBenefits ? `
    <div class="section">
        <h2>Tax Benefits Analysis</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(data.taxAnalysis.totalTaxBenefits)}</div>
                <div class="metric-label">Total Annual Deductions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(data.taxAnalysis.totalTaxSavings)}</div>
                <div class="metric-label">Estimated Tax Savings</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Depreciation</th>
                    <th>Mortgage Interest</th>
                    <th>Property Tax</th>
                    <th>Maintenance</th>
                    <th>Total Benefits</th>
                    <th>Est. Tax Savings</th>
                </tr>
            </thead>
            <tbody>
                ${data.taxAnalysis.details.map(detail => `
                    <tr>
                        <td>${detail.property}</td>
                        <td>${formatCurrency(detail.breakdown.depreciation)}</td>
                        <td>${formatCurrency(detail.breakdown.interest)}</td>
                        <td>${formatCurrency(detail.breakdown.propertyTax)}</td>
                        <td>${formatCurrency(detail.breakdown.maintenance)}</td>
                        <td>${formatCurrency(detail.taxBenefits)}</td>
                        <td class="positive">${formatCurrency(detail.taxSavings)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${includeOptions.performanceMetrics ? `
    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${formatPercentage(data.performanceAnalysis.averageCapRate)}</div>
                <div class="metric-label">Average Cap Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatPercentage(data.performanceAnalysis.averageCashOnCash)}</div>
                <div class="metric-label">Average Cash-on-Cash</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatPercentage(data.performanceAnalysis.averageTotalReturn)}</div>
                <div class="metric-label">Average Total Return</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Cap Rate</th>
                    <th>Cash-on-Cash Return</th>
                    <th>Annualized Appreciation</th>
                    <th>Total Return</th>
                    <th>Years Held</th>
                </tr>
            </thead>
            <tbody>
                ${data.performanceAnalysis.metrics.map(metric => `
                    <tr>
                        <td>${metric.property}</td>
                        <td class="${metric.capRate >= 6 ? 'positive' : 'negative'}">${formatPercentage(metric.capRate)}</td>
                        <td class="${metric.cashOnCashReturn >= 0 ? 'positive' : 'negative'}">${formatPercentage(metric.cashOnCashReturn)}</td>
                        <td class="${metric.annualizedAppreciation >= 0 ? 'positive' : 'negative'}">${formatPercentage(metric.annualizedAppreciation)}</td>
                        <td class="${metric.totalReturn >= 8 ? 'positive' : 'negative'}">${formatPercentage(metric.totalReturn)}</td>
                        <td>${metric.yearsHeld.toFixed(1)} years</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${includeOptions.recommendations ? `
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Properties with cap rates below 6% may benefit from rent increases or expense reduction</li>
            <li>Consider refinancing properties with interest rates above 5.5%</li>
            <li>Properties with negative cash flow should be reviewed for optimization opportunities</li>
            <li>Maximize tax benefits through proper expense tracking and depreciation strategies</li>
            <li>Consider 1031 exchanges for properties with significant appreciation</li>
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p>This report is generated for informational purposes only. Consult with a qualified tax professional and investment advisor for personalized advice.</p>
        <p>Generated by Real Estate Investment Tracker on ${data.reportMetadata.generatedDate}</p>
    </div>
</body>
</html>`;

    return html;
  };

  const downloadReport = () => {
    const html = generateHTMLReport();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSONReport = () => {
    const data = generateReportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const reportData = generateReportData();

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports for tax filing, performance analysis, and portfolio review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio-summary">Portfolio Summary</SelectItem>
                  <SelectItem value="tax-report">Tax Benefits Report</SelectItem>
                  <SelectItem value="performance-analysis">Performance Analysis</SelectItem>
                  <SelectItem value="annual-summary">Annual Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button onClick={downloadReport} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  HTML Report
                </Button>
                <Button variant="outline" onClick={generateJSONReport} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  JSON Data
                </Button>
              </div>
            </div>
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Include in Report</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                {Object.entries(includeOptions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setIncludeOptions(prev => ({ ...prev, [key]: !!checked }))
                      }
                    />
                    <Label htmlFor={key} className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Properties to Include</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {investments.map((investment) => (
                  <div key={investment.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={investment.id}
                      checked={selectedProperties.includes(investment.id)}
                      onCheckedChange={() => togglePropertySelection(investment.id)}
                    />
                    <Label htmlFor={investment.id} className="text-sm">
                      {investment.propertyName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Preview
          </CardTitle>
          <CardDescription>
            Preview of your {reportType.replace('-', ' ')} report data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mb-2">
                <PieChart className="h-4 w-4" />
                Portfolio Value
              </div>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(reportData.portfolioSummary.totalCurrentValue)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 mb-2">
                <DollarSign className="h-4 w-4" />
                Tax Savings
              </div>
              <p className="text-xl font-bold text-green-800">{formatCurrency(reportData.taxAnalysis.totalTaxSavings)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-purple-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                Avg Cap Rate
              </div>
              <p className="text-xl font-bold text-purple-800">{formatPercentage(reportData.performanceAnalysis.averageCapRate)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-orange-700 mb-2">
                <FileText className="h-4 w-4" />
                Properties
              </div>
              <p className="text-xl font-bold text-orange-800">{reportData.reportMetadata.propertyCount}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Report Contents:</h4>
              <ul className="text-sm space-y-1">
                <li>• Portfolio overview with {reportData.reportMetadata.propertyCount} properties</li>
                {includeOptions.taxBenefits && <li>• Tax benefits totaling {formatCurrency(reportData.taxAnalysis.totalTaxBenefits)} in deductions</li>}
                {includeOptions.performanceMetrics && <li>• Performance analysis with average {formatPercentage(reportData.performanceAnalysis.averageTotalReturn)} total return</li>}
                {includeOptions.marketComparison && <li>• Market comparison and benchmarking data</li>}
                {includeOptions.recommendations && <li>• Actionable recommendations for portfolio optimization</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};