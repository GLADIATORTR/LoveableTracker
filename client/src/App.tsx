import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppContextProvider } from "@/contexts/AppContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import Investments from "@/pages/Investments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { useEffect } from "react";
import { offlineStorage } from "@/utils/offline-storage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projections" component={Scenarios} />
      <Route path="/investments" component={Investments} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize offline storage on app load
  useEffect(() => {
    offlineStorage.init().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContextProvider>
            <Toaster />
            <InstallPrompt />
            <OfflineIndicator />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
