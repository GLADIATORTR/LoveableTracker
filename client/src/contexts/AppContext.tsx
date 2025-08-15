import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useIsMobile } from "@/hooks/use-mobile";

type UserPreferences = {
  theme: "light" | "dark" | "system";
  density: "compact" | "standard" | "comfortable";
  notifications: boolean;
};

type AppContextType = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isMobile: boolean;
  userPreferences: UserPreferences;
  setUserPreferences: (preferences: UserPreferences) => void;
  user: {
    name: string;
    email: string;
    initials: string;
    jobTitle: string;
  };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const [userPreferences, setUserPreferences] = useLocalStorage<UserPreferences>("user-preferences", {
    theme: "system",
    density: "standard",
    notifications: true,
  });

  const user = {
    name: "John Doe",
    email: "john@company.com",
    initials: "JD",
    jobTitle: "Asset Manager",
  };

  return (
    <AppContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        isMobile,
        userPreferences,
        setUserPreferences,
        user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
