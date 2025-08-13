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
import Dashboard from "@/pages/Dashboard";
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
      <SimpleThemeProvider>
        <TooltipProvider>
          <AppContextProvider>
            <Toaster />
            <div className="h-screen flex bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-background">
                  <div className="p-6">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </AppContextProvider>
        </TooltipProvider>
      </SimpleThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
