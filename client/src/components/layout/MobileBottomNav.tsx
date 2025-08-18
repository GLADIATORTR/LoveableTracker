import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calculator, 
  Home, 
  BarChart3, 
  Lightbulb,
} from "lucide-react";

const mobileNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/investments", icon: Home },
  { name: "Compare", href: "/comparison", icon: Calculator },
  { name: "Strategy", href: "/strategy", icon: Lightbulb },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-border/50 shadow-lg">
      <nav className="flex justify-around items-center py-2 px-4">
        {mobileNavigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
                <Icon className={cn(
                  "w-5 h-5 mb-1 transition-all duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}