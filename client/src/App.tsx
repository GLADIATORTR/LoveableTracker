import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimpleThemeProvider } from "@/components/ui/simple-theme-provider";
import { AppContextProvider, useAppContext } from "@/contexts/AppContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import Investments from "@/pages/Investments";
import Reports from "@/pages/Reports";
import Charts from "@/pages/Charts";
import Settings from "@/pages/Settings";
import Dictionary from "@/pages/Dictionary";
import PropertyComparison from "@/pages/PropertyComparison";
import EconomicData from "@/pages/EconomicData";
import NotFound from "@/pages/not-found";

// Mobile Sidebar Overlay Component
function MobileSidebarOverlay() {
  const { mobileMenuOpen, setMobileMenuOpen, isMobile } = useAppContext();

  if (!isMobile || !mobileMenuOpen) return null;

  return (
    <>
      {/* Overlay Background */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Mobile Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 z-50 lg:hidden transform transition-transform duration-300 ease-out">
        <Sidebar />
      </div>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />

      <Route path="/investments" component={Investments} />
      <Route path="/reports" component={Reports} />
      <Route path="/charts" component={Charts} />
      <Route path="/comparison" component={PropertyComparison} />
      <Route path="/economic-data" component={EconomicData} />
      <Route path="/settings" component={Settings} />
      <Route path="/dictionary" component={Dictionary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleThemeProvider>
        <TooltipProvider>
          <AppContextProvider>
            <div className="h-screen flex flex-col bg-background">
              {/* Mobile-First Layout */}
              <div className="flex-1 flex">
                {/* Sidebar - Hidden on mobile, sidebar on desktop */}
                <div className="hidden lg:flex">
                  <Sidebar />
                </div>
                
                {/* Mobile Sidebar Overlay */}
                <MobileSidebarOverlay />
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <TopBar />
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
                    <div className="max-w-7xl mx-auto">
                      <Router />
                    </div>
                  </main>
                </div>
              </div>
              
              {/* Mobile Bottom Navigation */}
              <MobileBottomNav />
            </div>
            <Toaster />
          </AppContextProvider>
        </TooltipProvider>
      </SimpleThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
