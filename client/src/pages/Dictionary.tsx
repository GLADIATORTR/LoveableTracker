import { Search } from "lucide-react";

export default function Dictionary() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Asset Dictionary</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive database of asset definitions, categories, and specifications.
        </p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Dictionary Coming Soon</h3>
        <p className="text-muted-foreground">
          The asset dictionary feature is currently under development. 
          Check back soon for comprehensive definitions and specifications.
        </p>
      </div>
    </div>
  );
}
