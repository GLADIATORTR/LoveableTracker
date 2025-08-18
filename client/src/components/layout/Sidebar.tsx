import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { useTheme } from "@/components/ui/simple-theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalSettings } from "@/components/ui/global-settings";
import { 
  LayoutDashboard, 
  Calculator, 
  Home, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Lightbulb,
  Table,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Investments", href: "/investments", icon: Home },
  { name: "Property Rankings", href: "/rankings", icon: Table },
  { name: "TimeSeries Projections", href: "/reports", icon: BarChart3 },
  { name: "Charts", href: "/charts", icon: TrendingUp },
  { name: "Compare Properties", href: "/comparison", icon: Calculator },
  { name: "Economic Data", href: "/economic-data", icon: Activity },
  { name: "Investment Strategy", href: "/strategy", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed, user, isMobile, setMobileMenuOpen } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-xl h-full",
      sidebarCollapsed && !isMobile ? "w-16" : "w-64",
      isMobile && "w-80 max-w-[80vw]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border/30">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">
                Real Estate
              </span>
              <span className="text-xs text-emerald-500 -mt-1 font-medium">
                Financials
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent hover:border-sidebar-border/30"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent hover:border-sidebar-border/30"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;
          
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group cursor-pointer relative border",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg border-blue-500/30"
                        : "text-sidebar-foreground/90 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:border-sidebar-border/50 border-transparent",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-200 relative z-10 flex-shrink-0",
                      isActive 
                        ? "!text-white" 
                        : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground group-hover:scale-105"
                    )} />
                    {!sidebarCollapsed && (
                      <span className={cn(
                        "font-medium transition-all duration-200 relative z-10 whitespace-nowrap select-none",
                        isActive ? "!text-white font-semibold" : "text-sidebar-foreground/90 group-hover:text-sidebar-foreground"
                      )}>
                        {item.name}
                      </span>
                    )}
                    
                    {/* Mobile: Close menu after navigation */}
                    {isMobile && (
                      <div onClick={() => setMobileMenuOpen(false)} className="absolute inset-0" />
                    )}
                    
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute right-2 w-1 h-8 bg-gradient-to-b from-primary to-primary-600 rounded-full" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">{item.name}</TooltipContent>
              )}
            </Tooltip>
          );
        })}
        
        {/* Global Settings in sidebar */}
        {!sidebarCollapsed && (
          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              GLOBAL SETTINGS
            </div>
            <GlobalSettings />
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer",
              sidebarCollapsed && "justify-center"
            )}>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
