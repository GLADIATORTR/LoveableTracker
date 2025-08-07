/**
 * Data import utilities for the Asset Tracker application
 */

import { apiRequest } from "@/lib/queryClient";
import type { InsertAsset } from "@shared/schema";

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

export interface AssetImportData {
  name: string;
  description?: string;
  categoryId?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  location?: string;
  assignedTo?: string;
  status?: string;
  tags?: string[];
  specifications?: Record<string, any>;
}

/**
 * Import assets from a file
 */
export async function importAssets(file: File): Promise<ImportResult> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !['csv', 'json'].includes(fileExtension)) {
      throw new Error('Unsupported file format. Please use CSV or JSON files.');
    }

    const fileContent = await readFileContent(file);
    let assetsData: AssetImportData[];

    if (fileExtension === 'csv') {
      assetsData = parseCSVContent(fileContent);
    } else {
      assetsData = parseJSONContent(fileContent);
    }

    // Validate and transform the data
    const validatedAssets = await validateAndTransformAssets(assetsData);
    
    if (validatedAssets.length === 0) {
      return {
        success: false,
        message: 'No valid assets found in the import file.',
      };
    }

    // Send to backend
    const response = await apiRequest('POST', '/api/import/assets', validatedAssets);
    const result = await response.json();

    return {
      success: true,
      message: result.message || `Successfully imported ${validatedAssets.length} assets.`,
      importedCount: validatedAssets.length,
    };
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Import failed due to an unknown error.',
    };
  }
}

/**
 * Import data from JSON backup
 */
export async function importFromBackup(file: File): Promise<ImportResult> {
  try {
    const fileContent = await readFileContent(file);
    const backupData = JSON.parse(fileContent);

    if (!backupData.assets && !backupData.dictionary && !backupData.categories) {
      throw new Error('Invalid backup file format.');
    }

    // Import assets if present
    if (backupData.assets && Array.isArray(backupData.assets)) {
      const validatedAssets = await validateAndTransformAssets(backupData.assets);
      
      if (validatedAssets.length > 0) {
        await apiRequest('POST', '/api/import/assets', validatedAssets);
      }
    }

    // Note: In a full implementation, we would also import dictionary entries and categories
    // For now, we'll focus on assets as that's what the backend supports

    return {
      success: true,
      message: `Successfully restored data from backup.`,
      importedCount: backupData.assets?.length || 0,
    };
  } catch (error) {
    console.error('Backup restore failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Backup restore failed.',
    };
  }
}

/**
 * Read file content as text
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file content.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse CSV content into asset data
 */
function parseCSVContent(csvContent: string): AssetImportData[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row.');
  }

  // Parse header
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  // Parse data rows
  const assets: AssetImportData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Skipping.`);
      continue;
    }

    const asset: AssetImportData = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      if (value) {
        // Map common CSV headers to our asset properties
        const normalizedHeader = normalizeHeaderName(header);
        
        switch (normalizedHeader) {
          case 'name':
            asset.name = value;
            break;
          case 'description':
            asset.description = value;
            break;
          case 'serialnumber':
          case 'serial':
            asset.serialNumber = value;
            break;
          case 'model':
            asset.model = value;
            break;
          case 'manufacturer':
          case 'brand':
            asset.manufacturer = value;
            break;
          case 'purchasedate':
          case 'dateofpurchase':
            asset.purchaseDate = value;
            break;
          case 'purchaseprice':
          case 'price':
          case 'cost':
            const purchasePrice = parseFloat(value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(purchasePrice)) {
              asset.purchasePrice = Math.round(purchasePrice * 100); // Convert to cents
            }
            break;
          case 'currentvalue':
          case 'value':
            const currentValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(currentValue)) {
              asset.currentValue = Math.round(currentValue * 100); // Convert to cents
            }
            break;
          case 'location':
            asset.location = value;
            break;
          case 'assignedto':
          case 'assignee':
            asset.assignedTo = value;
            break;
          case 'status':
            asset.status = value.toLowerCase();
            break;
          case 'tags':
            asset.tags = value.split(';').map(tag => tag.trim()).filter(Boolean);
            break;
          case 'category':
            // We'll need to map category names to IDs later
            (asset as any).categoryName = value;
            break;
        }
      }
    });

    if (asset.name) {
      assets.push(asset);
    }
  }

  return assets;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current);
  
  return values;
}

/**
 * Parse JSON content into asset data
 */
function parseJSONContent(jsonContent: string): AssetImportData[] {
  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data.assets && Array.isArray(data.assets)) {
      return data.assets;
    } else {
      throw new Error('JSON file must contain an array of assets or an object with an "assets" property.');
    }
  } catch (error) {
    throw new Error('Invalid JSON format.');
  }
}

/**
 * Normalize header names for CSV parsing
 */
function normalizeHeaderName(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Validate and transform asset data before sending to backend
 */
async function validateAndTransformAssets(assetsData: AssetImportData[]): Promise<InsertAsset[]> {
  // Fetch categories to map category names to IDs
  const categoriesResponse = await fetch('/api/categories');
  const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
  
  const validAssets: InsertAsset[] = [];
  const errors: string[] = [];

  for (const [index, assetData] of assetsData.entries()) {
    try {
      // Validate required fields
      if (!assetData.name || assetData.name.trim() === '') {
        errors.push(`Row ${index + 1}: Asset name is required.`);
        continue;
      }

      // Transform the data
      const transformedAsset: InsertAsset = {
        name: assetData.name.trim(),
        description: assetData.description?.trim() || null,
        serialNumber: assetData.serialNumber?.trim() || null,
        model: assetData.model?.trim() || null,
        manufacturer: assetData.manufacturer?.trim() || null,
        location: assetData.location?.trim() || null,
        assignedTo: assetData.assignedTo?.trim() || null,
        status: validateStatus(assetData.status) || 'active',
        purchasePrice: assetData.purchasePrice || null,
        currentValue: assetData.currentValue || null,
        tags: assetData.tags || [],
        specifications: assetData.specifications || {},
      };

      // Handle purchase date
      if (assetData.purchaseDate) {
        const date = new Date(assetData.purchaseDate);
        if (!isNaN(date.getTime())) {
          transformedAsset.purchaseDate = date;
        }
      }

      // Handle category mapping
      if ((assetData as any).categoryName) {
        const category = categories.find((c: any) => 
          c.name.toLowerCase() === (assetData as any).categoryName.toLowerCase()
        );
        if (category) {
          transformedAsset.categoryId = category.id;
        }
      } else if (assetData.categoryId) {
        transformedAsset.categoryId = assetData.categoryId;
      }

      validAssets.push(transformedAsset);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  if (errors.length > 0) {
    console.warn('Import validation errors:', errors);
  }

  return validAssets;
}

/**
 * Validate asset status
 */
function validateStatus(status?: string): string | null {
  if (!status) return null;
  
  const validStatuses = ['active', 'inactive', 'maintenance', 'disposed'];
  const normalizedStatus = status.toLowerCase().trim();
  
  return validStatuses.includes(normalizedStatus) ? normalizedStatus : null;
}

/**
 * Generate import template CSV
 */
export function downloadImportTemplate(): void {
  const headers = [
    'name',
    'description',
    'category',
    'serialNumber',
    'model',
    'manufacturer',
    'purchaseDate',
    'purchasePrice',
    'currentValue',
    'location',
    'assignedTo',
    'status',
    'tags'
  ];

  const sampleData = [
    'MacBook Pro M3',
    'Professional laptop for development work',
    'Electronics',
    'MP2023001',
    'MacBook Pro 16"',
    'Apple',
    '2023-01-15',
    '3200.00',
    '2800.00',
    'Office - Room 201',
    'John Doe',
    'active',
    'laptop;development;apple'
  ];

  const csvContent = [
    headers.join(','),
    sampleData.map(value => `"${value}"`).join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'asset-import-template.csv';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
