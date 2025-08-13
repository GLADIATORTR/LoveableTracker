import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-primary",
  className 
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-0 bg-gradient-to-br from-card via-card to-card/95 shadow-lg group cursor-pointer",
      className
    )}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
      
      {/* Decorative blur elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -translate-y-4 translate-x-4 group-hover:bg-primary/15 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary-600/10 rounded-full blur-xl translate-y-2 -translate-x-2" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-3 group-hover:text-primary/90 transition-colors duration-300">
              {value}
            </p>
            {change && (
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1",
                  change.trend === "up" && "bg-success/10 text-success border border-success/20",
                  change.trend === "down" && "bg-destructive/10 text-destructive border border-destructive/20",
                  change.trend === "neutral" && "bg-muted text-muted-foreground"
                )}>
                  {change.trend === "up" && <span className="text-xs">↗</span>}
                  {change.trend === "down" && <span className="text-xs">↘</span>}
                  <span>{change.value}</span>
                </span>
                <span className="text-xs text-muted-foreground">{change.period}</span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
            iconColor === "text-primary" && "bg-gradient-to-br from-primary to-primary-600",
            iconColor === "text-success" && "bg-gradient-to-br from-green-500 to-green-600",
            iconColor === "text-warning" && "bg-gradient-to-br from-yellow-500 to-orange-500",
            iconColor === "text-destructive" && "bg-gradient-to-br from-red-500 to-red-600"
          )}>
            <Icon className="w-7 h-7 text-white drop-shadow-sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
