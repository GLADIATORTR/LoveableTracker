// Debug script for 12 Hillcrest calculations

// From your CSV data for 12 Hillcrest:
const data = {
  propertyName: "12 Hillcrest",
  purchasePrice: 675000, // dollars
  currentValue: 1250000, // dollars  
  interestRate: 3.75, // percent
  loanTerm: 360, // months
  currentTerm: 125, // months since loan start
  outstandingBalance: 338073, // dollars
  monthlyMortgage: 2030 // dollars
};

console.log("=== 12 Hillcrest Debug ===");
console.log("Current Market Value:", data.currentValue);
console.log("Purchase Price:", data.purchasePrice);
console.log("Current Term:", data.currentTerm, "months");
console.log("Remaining Term at Y0:", data.loanTerm - data.currentTerm, "months");
console.log("Interest Rate:", data.interestRate + "%");
console.log("Outstanding Balance Y0:", data.outstandingBalance);

// Calculate Y1 values
const appreciationRate = 0.035; // 3.5% from global settings
const monthlyInterestRate = data.interestRate / 100 / 12;

// Y1 calculations
const marketValueY1 = data.currentValue * (1 + appreciationRate);
const currentTermY1 = data.currentTerm + 12;
const remainingTermY1 = data.loanTerm - currentTermY1;

// Outstanding balance Y1 (after 12 more payments)
let outstandingBalanceY1;
if (remainingTermY1 > 0) {
  const factor = Math.pow(1 + monthlyInterestRate, remainingTermY1);
  outstandingBalanceY1 = data.monthlyMortgage * ((factor - 1) / (monthlyInterestRate * factor));
} else {
  outstandingBalanceY1 = 0;
}

const capitalGainsTaxY1 = (marketValueY1 - data.purchasePrice) * 0.25;

console.log("\n=== Y1 Calculations ===");
console.log("Market Value Y1:", marketValueY1.toLocaleString());
console.log("Current Term Y1:", currentTermY1, "months");
console.log("Remaining Term Y1:", remainingTermY1, "months");
console.log("Outstanding Balance Y1:", outstandingBalanceY1.toLocaleString());
console.log("Capital Gains Tax Y1:", capitalGainsTaxY1.toLocaleString());