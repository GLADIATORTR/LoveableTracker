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
      'Monthly Mortgage',
      'Current Term'
    ];

    const sampleData = [
      [
        'Sample Property',
        '123 Main Street, Apt 2B',
        'Condo',
        'USA',
        '300000',
        '350000',
        '2500',
        '800',
        '01/15/2023',
        '60000',
        '240000',
        '4.5',
        '30',
        '220000',
        '1800',
        '24'
      ],
      [
        'Another Property',
        '456 Oak Avenue, Unit 5',
        'Single Family',
        'USA',
        '200000',
        '220000',
        '1800',
        '600',
        '03/10/2022',
        '40000',
        '160000',
        '3.8',
        '30',
        '150000',
        '1200',
        '36'
      ],
      [
        'Turkish Property',
        'Besiktas, Levent, Merkez',
        'Condo',
        'Turkey',
        '100000',
        '120000',
        '1000',
        '500',
        '06/01/2021',
        '20000',
        '80000',
        '5.2',
        '25',
        '75000',
        '800',
        '48'
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