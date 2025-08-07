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
    <Card className={cn("stats-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <p className="text-sm mt-1">
                <span className={cn(
                  "font-medium",
                  change.trend === "up" && "text-success",
                  change.trend === "down" && "text-destructive",
                  change.trend === "neutral" && "text-muted-foreground"
                )}>
                  {change.trend === "up" && "↗"} 
                  {change.trend === "down" && "↘"} 
                  {change.value}
                </span>
                <span className="text-muted-foreground ml-1">{change.period}</span>
              </p>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconColor === "text-primary" && "bg-primary/10",
            iconColor === "text-success" && "bg-success/10",
            iconColor === "text-warning" && "bg-warning/10",
            iconColor === "text-destructive" && "bg-destructive/10"
          )}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
