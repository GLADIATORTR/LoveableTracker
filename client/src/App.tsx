import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimpleThemeProvider } from "@/components/ui/simple-theme-provider";
import { AppContextProvider } from "@/contexts/AppContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Dashboard from "@/pages/SimpleDashboard";
import Scenarios from "@/pages/Scenarios";
import Investments from "@/pages/Investments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Dictionary from "@/pages/Dictionary";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projections" component={Scenarios} />
      <Route path="/investments" component={Investments} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/dictionary" component={Dictionary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex bg-white">
        <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Real Estate Financials</h1>
          <nav className="space-y-2">
            <a href="#" className="block text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600">Investments</a>
            <a href="#" className="block text-gray-700 hover:text-blue-600">Reports</a>
          </nav>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <Router />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
