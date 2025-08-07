/**
 * Data export utilities for the Asset Tracker application
 */

export interface ExportData {
  assets: any[];
  dictionary: any[];
  categories: any[];
  exportDate: string;
  version: string;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  includeCategories?: boolean;
  includeDictionary?: boolean;
  includeAssets?: boolean;
}

/**
 * Export all data as JSON
 */
export async function exportData(options: ExportOptions = { format: 'json' }): Promise<void> {
  try {
    const response = await fetch('/api/export');
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    const exportData: ExportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    if (options.format === 'json') {
      downloadJSON(exportData, 'asset-tracker-export');
    } else if (options.format === 'csv') {
      downloadCSV(exportData, 'asset-tracker-export');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

/**
 * Export specific data type
 */
export async function exportSpecificData(
  type: 'assets' | 'dictionary' | 'categories',
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  try {
    const endpoint = type === 'assets' ? '/api/assets' : 
                    type === 'dictionary' ? '/api/dictionary' : 
                    '/api/categories';
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (format === 'json') {
      downloadJSON(data, `${type}-export`);
    } else {
      downloadCSV(data, `${type}-export`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export ${type}. Please try again.`);
  }
}

/**
 * Download data as JSON file
 */
function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV file
 */
function downloadCSV(data: any[], filename: string): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data available for CSV export');
  }

  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(item => 
      headers.map(key => {
        const value = item[key];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate report and download
 */
export async function generateReport(
  reportType: 'summary' | 'financial' | 'utilization' | 'maintenance',
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  try {
    // Fetch data needed for the report
    const [assetsResponse, categoriesResponse, statsResponse] = await Promise.all([
      fetch('/api/assets'),
      fetch('/api/categories'),
      fetch('/api/dashboard/stats'),
    ]);

    if (!assetsResponse.ok || !categoriesResponse.ok || !statsResponse.ok) {
      throw new Error('Failed to fetch data for report generation');
    }

    const [assets, categories, stats] = await Promise.all([
      assetsResponse.json(),
      categoriesResponse.json(),
      statsResponse.json(),
    ]);

    let reportData: any;
    let filename: string;

    switch (reportType) {
      case 'summary':
        reportData = generateSummaryReport(assets, categories, stats);
        filename = 'asset-summary-report';
        break;
      case 'financial':
        reportData = generateFinancialReport(assets, categories);
        filename = 'financial-report';
        break;
      case 'utilization':
        reportData = generateUtilizationReport(assets, stats);
        filename = 'utilization-report';
        break;
      case 'maintenance':
        reportData = generateMaintenanceReport(assets);
        filename = 'maintenance-report';
        break;
      default:
        throw new Error('Unknown report type');
    }

    if (format === 'json') {
      downloadJSON(reportData, filename);
    } else {
      downloadCSV(Array.isArray(reportData) ? reportData : [reportData], filename);
    }
  } catch (error) {
    console.error('Report generation failed:', error);
    throw new Error('Failed to generate report. Please try again.');
  }
}

// Report generation helpers
function generateSummaryReport(assets: any[], categories: any[], stats: any) {
  return {
    reportType: 'Asset Summary Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0),
      categoriesCount: categories.length,
      ...stats,
    },
    categoryBreakdown: categories.map(category => ({
      name: category.name,
      count: assets.filter(asset => asset.categoryId === category.id).length,
      totalValue: assets
        .filter(asset => asset.categoryId === category.id)
        .reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0),
    })),
    assets: assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: categories.find(c => c.id === asset.categoryId)?.name || 'Unknown',
      status: asset.status,
      currentValue: asset.currentValue || asset.purchasePrice,
      purchaseDate: asset.purchaseDate,
      location: asset.location,
    })),
  };
}

function generateFinancialReport(assets: any[], categories: any[]) {
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0);
  
  return {
    reportType: 'Financial Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalCurrentValue: totalValue,
      totalPurchaseValue: totalPurchaseValue,
      totalDepreciation: totalPurchaseValue - totalValue,
      averageAssetValue: assets.length > 0 ? totalValue / assets.length : 0,
    },
    categoryFinancials: categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.categoryId === category.id);
      const categoryValue = categoryAssets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0);
      const categoryPurchaseValue = categoryAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0);
      
      return {
        category: category.name,
        assetCount: categoryAssets.length,
        currentValue: categoryValue,
        purchaseValue: categoryPurchaseValue,
        depreciation: categoryPurchaseValue - categoryValue,
        valuePercentage: totalValue > 0 ? (categoryValue / totalValue) * 100 : 0,
      };
    }),
  };
}

function generateUtilizationReport(assets: any[], stats: any) {
  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {});

  return {
    reportType: 'Utilization Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalAssets: assets.length,
      utilizationRate: assets.length > 0 ? (statusCounts.active || 0) / assets.length : 0,
      activeAssets: statusCounts.active || 0,
      inactiveAssets: statusCounts.inactive || 0,
      maintenanceAssets: statusCounts.maintenance || 0,
      disposedAssets: statusCounts.disposed || 0,
    },
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: assets.length > 0 ? ((count as number) / assets.length) * 100 : 0,
    })),
  };
}

function generateMaintenanceReport(assets: any[]) {
  // For now, we'll create a basic maintenance report structure
  // In a real app, this would include actual maintenance schedules and history
  return {
    reportType: 'Maintenance Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalAssets: assets.length,
      assetsInMaintenance: assets.filter(asset => asset.status === 'maintenance').length,
      upcomingMaintenance: 0, // Would be calculated from actual maintenance schedules
      overdueMaintenanace: 0,
    },
    maintenanceSchedule: assets
      .filter(asset => asset.maintenanceSchedule && Object.keys(asset.maintenanceSchedule).length > 0)
      .map(asset => ({
        assetId: asset.id,
        assetName: asset.name,
        currentStatus: asset.status,
        maintenanceSchedule: asset.maintenanceSchedule,
        lastMaintenance: null, // Would come from maintenance history
        nextMaintenance: null, // Would be calculated
      })),
  };
}
