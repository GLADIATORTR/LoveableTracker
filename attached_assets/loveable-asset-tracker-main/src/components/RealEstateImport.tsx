import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Copy } from "lucide-react";
import { toast } from "sonner";
import { RealEstateInvestment } from "@/pages/Index";

interface RealEstateImportProps {
  onImport: (investments: Omit<RealEstateInvestment, "id">[]) => void;
}

export const RealEstateImport = ({ onImport }: RealEstateImportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedData, setPastedData] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().includes('csv') && !file.name.toLowerCase().includes('excel')) {
      toast.error("Please upload a CSV file or Excel file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processImportData(content);
    };
    reader.readAsText(file);
  };

  const processImportData = (data: string) => {
    try {
      const lines = data.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error("File must contain header row and at least one data row");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1);

      const investments: Omit<RealEstateInvestment, "id">[] = dataRows.map((row, index) => {
        const values = row.split(',').map(v => v.trim());
        
        // Create a mapping of headers to values
        const rowData: Record<string, string> = {};
        headers.forEach((header, i) => {
          rowData[header] = values[i] || '';
        });

        // Map common column names to our interface
        const investment: Omit<RealEstateInvestment, "id"> = {
          propertyName: rowData['property name'] || rowData['name'] || rowData['property'] || `Property ${index + 1}`,
          address: rowData['address'] || rowData['location'] || '',
          purchasePrice: parseFloat(rowData['purchase price'] || rowData['price'] || '0') || 0,
          currentValue: parseFloat(rowData['current value'] || rowData['value'] || rowData['purchase price'] || rowData['price'] || '0') || 0,
          netEquity: parseFloat(rowData['net equity'] || rowData['equity'] || '0') || 0,
          downPayment: parseFloat(rowData['down payment'] || rowData['downpayment'] || '0') || 0,
          loanAmount: parseFloat(rowData['loan amount'] || rowData['loan'] || '0') || 0,
          interestRate: parseFloat(rowData['interest rate'] || rowData['rate'] || '0') || 0,
          loanTerm: parseFloat(rowData['loan term'] || rowData['term'] || '360') || 360,
          monthlyMortgage: parseFloat(rowData['monthly mortgage'] || rowData['mortgage'] || '0') || 0,
          monthlyRent: parseFloat(rowData['monthly rent'] || rowData['rent'] || '0') || 0,
          monthlyExpenses: parseFloat(rowData['monthly expenses'] || rowData['expenses'] || '0') || 0,
          monthlyEscrow: parseFloat(rowData['monthly escrow'] || rowData['escrow'] || '0') || 0,
          avgAppreciationRate: parseFloat(rowData['appreciation rate'] || rowData['appreciation'] || '3.5') || 3.5,
          outstandingBalance: parseFloat(rowData['outstanding balance'] || rowData['balance'] || rowData['loan amount'] || rowData['loan'] || '0') || 0,
          currentTerm: parseFloat(rowData['current term'] || rowData['months owned'] || '0') || 0,
          propertyType: (rowData['property type'] || rowData['type'] || 'single-family') as "single-family" | "multi-family" | "condo" | "townhouse" | "commercial",
          purchaseDate: rowData['purchase date'] || rowData['date'] || new Date().toISOString().split('T')[0],
          notes: rowData['notes'] || rowData['description'] || '',
          group: rowData['group'] || rowData['portfolio'] || '',
          isInvestmentProperty: rowData['investment property']?.toLowerCase() !== 'false',
        };

        return investment;
      });

      onImport(investments);
      toast.success(`Successfully imported ${investments.length} properties`);
      setIsOpen(false);
      setPastedData("");
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Error processing import data. Please check the format.");
    }
  };

  const handlePasteImport = () => {
    if (!pastedData.trim()) {
      toast.error("Please paste some data first");
      return;
    }
    processImportData(pastedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Properties
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Real Estate Properties</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Upload CSV/Excel File</h3>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Expected columns: Property Name, Address, Purchase Price, Current Value, Monthly Rent, etc.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Paste CSV Data</h3>
            <Textarea
              placeholder="Paste your CSV data here (comma-separated values)..."
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              className="min-h-32"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handlePasteImport} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Import Pasted Data
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Format Guidelines:</p>
            <p>• First row should contain column headers</p>
            <p>• Common headers: Property Name, Address, Purchase Price, Current Value, Monthly Rent, Monthly Expenses, Loan Amount, Interest Rate, etc.</p>
            <p>• Numeric values should not contain currency symbols or commas</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};