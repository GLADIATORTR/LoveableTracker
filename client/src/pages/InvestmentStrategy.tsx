import { InvestmentStrategyGenerator } from "@/components/ui/investment-strategy-generator";

export default function InvestmentStrategyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
          Investment Strategy Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Get personalized investment recommendations tailored to your goals, risk tolerance, and current portfolio.
        </p>
      </div>

      <InvestmentStrategyGenerator />
    </div>
  );
}