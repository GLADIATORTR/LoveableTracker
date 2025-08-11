import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";

interface CSVImportProps {
  onSuccess?: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
  data?: any[];
}

export function CSVImport({ onSuccess }: CSVImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importInvestments = useMutation({
    mutationFn: async (csvData: string) => {
      const response = await fetch("/api/investments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Import failed');
      }
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.success} investments.`,
        });
        onSuccess?.();
      }
      
      if (result.errors.length > 0) {
        toast({
          title: "Import Warnings",
          description: `${result.errors.length} rows had errors.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      importInvestments.mutate(csvData);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `Property Name,Address,Investment Property Type,Country,Purchase Price,Current Value,Monthly Rent,Monthly Expenses,Purchase Date,Down Payment,Loan Amount,Interest Rate,Loan Term,Outstanding Balance,Monthly Mortgage
Sample Property,123 Main Street,Condo,USA,300000,350000,2500,800,01/15/2023,60000,240000,4.5,30,220000,1800
Another Property,456 Oak Avenue,Single Family,USA,200000,220000,1800,600,03/10/2022,40000,160000,3.8,30,150000,1200`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'investment-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully.",
    });
  };

  const reset = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <DialogHeader>
          <DialogTitle>Import Investments from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 1: Download Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Download our CSV template to ensure your data is formatted correctly.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 2: Upload Your CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    {file.name} selected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {importResult.success > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Successfully imported {importResult.success} investments.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p>Errors encountered:</p>
                          <ul className="list-disc list-inside text-xs">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>... and {importResult.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {importResult && (
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
            )}
            <Button 
              onClick={handleImport} 
              disabled={!file || importInvestments.isPending}
            >
              {importInvestments.isPending ? "Importing..." : "Import Investments"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}