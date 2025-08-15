import React from "react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalProperties: number;
  totalPortfolioValue: number;
  totalInvestment: number;
  averageROI: number;
}

export default function SimpleDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Real Estate Financials Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Track your property investments and portfolio performance</p>
      </div>
      
      {/* Mobile-First Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Properties</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{stats?.totalProperties || 0}</p>
        </div>
        <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Portfolio Value</h3>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-600 break-all">
            ${stats?.totalPortfolioValue ? (stats.totalPortfolioValue / 100).toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Investment</h3>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-primary break-all">
            ${stats?.totalInvestment ? (stats.totalInvestment / 100).toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-card p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">ROI</h3>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-success">{stats?.averageROI || '0'}%</p>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Welcome to Real Estate Financials</h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Your comprehensive real estate investment management platform. 
          Track properties, analyze performance, and optimize your portfolio.
        </p>
        
        {/* Quick Actions - Mobile Friendly */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center">
            Add Property
          </button>
          <button className="flex-1 bg-emerald-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-center">
            View Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}