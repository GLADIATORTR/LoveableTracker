import { PropertyComparison } from "@/components/ui/property-comparison";

export default function PropertyComparisonPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
          Property Comparison
        </h1>
        <p className="text-muted-foreground text-lg">
          Compare your properties side-by-side with market benchmarks and get actionable insights.
        </p>
      </div>

      <PropertyComparison />
    </div>
  );
}