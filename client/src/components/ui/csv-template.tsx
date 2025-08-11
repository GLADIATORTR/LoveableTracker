import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CSVTemplate() {
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'Property Name',
      'Address', 
      'Investment Property Type',
      'Country',
      'Purchase Price',
      'Current Value',
      'Monthly Rent',
      'Monthly Expenses',
      'Purchase Date',
      'Down Payment',
      'Loan Amount',
      'Interest Rate',
      'Loan Term',
      'Outstanding Balance',
      'Monthly Mortgage'
    ];

    const sampleData = [
      [
        'Sample Property',
        '123 Main Street',
        'single-family',
        'USA',
        '500000',
        '550000',
        '3000',
        '1200',
        '01/15/2023',
        '100000',
        '400000',
        '4.5',
        '30',
        '380000',
        '2000'
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investment_properties_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded. Fill it with your property data and import it back.",
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={downloadTemplate}>
      <Download className="w-4 h-4 mr-2" />
      Download Template
    </Button>
  );
}