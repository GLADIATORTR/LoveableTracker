import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function SimpleDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Real Estate Financials Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalProperties || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.totalPortfolioValue ? (stats.totalPortfolioValue / 100).toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Investment</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${stats?.totalInvestment ? (stats.totalInvestment / 100).toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">ROI</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.averageROI || '0'}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Welcome to Real Estate Financials</h2>
        <p className="text-gray-600">
          Your comprehensive real estate investment management platform. 
          Track properties, analyze performance, and optimize your portfolio.
        </p>
      </div>
    </div>
  );
}