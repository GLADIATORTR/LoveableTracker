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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Investments", href: "/investments", icon: Home },
  { name: "TimeSeries Projections", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed, user } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-2xl",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border/50">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
                Real Estate
              </span>
              <span className="text-xs text-sidebar-foreground/70 -mt-1">
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
                className="text-sidebar-foreground hover:bg-accent"
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
                className="text-sidebar-foreground hover:bg-accent"
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
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group cursor-pointer relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-primary-600/20 text-primary border border-primary/30 shadow-lg"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground hover:scale-[1.02] hover:shadow-md",
                    sidebarCollapsed && "justify-center px-2"
                  )}>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary-600/5 rounded-xl" />
                    )}
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-300 relative z-10",
                      isActive 
                        ? "text-primary scale-110 drop-shadow-sm" 
                        : "group-hover:scale-105 group-hover:text-sidebar-foreground"
                    )} />
                    {!sidebarCollapsed && (
                      <span className={cn(
                        "font-medium transition-all duration-300 relative z-10",
                        isActive ? "text-primary font-semibold" : "group-hover:text-sidebar-foreground"
                      )}>
                        {item.name}
                      </span>
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
