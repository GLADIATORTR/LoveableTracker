import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

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
  gradient?: "primary" | "success" | "warning" | "info" | "purple" | "cyan";
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-primary",
  className,
  gradient = "primary"
}: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const gradientClasses = {
    primary: "from-violet-500 to-purple-600",
    success: "from-emerald-500 to-teal-600", 
    warning: "from-amber-500 to-orange-600",
    info: "from-sky-500 to-blue-600",
    purple: "from-purple-500 to-indigo-600",
    cyan: "from-cyan-500 to-teal-500"
  };

  const backgroundGradients = {
    primary: "from-violet-500/5 via-purple-500/3 to-violet-600/5",
    success: "from-emerald-500/5 via-teal-500/3 to-emerald-600/5",
    warning: "from-amber-500/5 via-orange-500/3 to-amber-600/5", 
    info: "from-sky-500/5 via-blue-500/3 to-sky-600/5",
    purple: "from-purple-500/5 via-indigo-500/3 to-purple-600/5",
    cyan: "from-cyan-500/5 via-teal-500/3 to-cyan-600/5"
  };

  const iconBackgrounds = {
    primary: "from-violet-500 to-purple-600",
    success: "from-emerald-500 to-teal-600",
    warning: "from-amber-500 to-orange-600",
    info: "from-sky-500 to-blue-600", 
    purple: "from-purple-500 to-indigo-600",
    cyan: "from-cyan-500 to-teal-500"
  };
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-500 border-0 shadow-lg group cursor-pointer",
        "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]",
        "active:scale-[0.98] active:shadow-xl",
        "transform-gpu will-change-transform",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => setClickCount(c => c + 1)}
      style={{
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card))/95% 100%)`,
      }}
    >
      {/* Animated background gradient overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30 transition-all duration-500",
          backgroundGradients[gradient],
          isHovered && "opacity-50 scale-105",
          isPressed && "opacity-60"
        )}
      />
      
      {/* Dynamic border gradient */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-300",
          "bg-gradient-to-br p-[1px]",
          gradientClasses[gradient],
          isHovered ? "opacity-40" : "opacity-20"
        )}
      >
        <div className="w-full h-full bg-card rounded-lg" />
      </div>
      
      {/* Floating orb decorations with physics */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all duration-700",
          "bg-gradient-to-br opacity-20",
          gradientClasses[gradient],
          isHovered && "scale-125 opacity-30 -translate-y-2 translate-x-2",
          "-translate-y-6 translate-x-6"
        )}
      />
      <div 
        className={cn(
          "absolute bottom-0 left-0 w-20 h-20 rounded-full blur-xl transition-all duration-500",
          "bg-gradient-to-tr opacity-15",
          gradientClasses[gradient],
          isHovered && "scale-110 opacity-25",
          "translate-y-4 -translate-x-4"
        )}
      />
      
      {/* Shimmer effect */}
      <div 
        className={cn(
          "absolute inset-0 -translate-x-full transition-transform duration-1000",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          isHovered && "translate-x-full"
        )}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title with micro-animation */}
            <p className={cn(
              "text-sm font-medium text-muted-foreground mb-2 transition-all duration-300",
              isHovered && "text-muted-foreground/80 transform translate-x-1"
            )}>
              {title}
            </p>
            
            {/* Value with enhanced typography */}
            <p className={cn(
              "text-3xl font-bold mb-3 transition-all duration-500",
              "bg-gradient-to-r bg-clip-text text-transparent",
              isHovered 
                ? `from-${gradient === 'primary' ? 'violet' : gradient === 'success' ? 'emerald' : gradient === 'warning' ? 'amber' : gradient === 'info' ? 'sky' : gradient === 'purple' ? 'purple' : 'cyan'}-600 to-${gradient === 'primary' ? 'purple' : gradient === 'success' ? 'teal' : gradient === 'warning' ? 'orange' : gradient === 'info' ? 'blue' : gradient === 'purple' ? 'indigo' : 'teal'}-700`
                : "from-foreground to-foreground",
              isPressed && "scale-95"
            )}>
              {value}
            </p>
            
            {/* Enhanced change indicator */}
            {change && (
              <div className={cn(
                "flex items-center space-x-2 transition-all duration-300",
                isHovered && "transform translate-x-1"
              )}>
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5",
                  "backdrop-blur-sm transition-all duration-300 border",
                  change.trend === "up" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/10 shadow-lg",
                  change.trend === "down" && "bg-red-500/10 text-red-600 border-red-500/20 shadow-red-500/10 shadow-lg", 
                  change.trend === "neutral" && "bg-slate-500/10 text-slate-600 border-slate-500/20",
                  isHovered && "scale-105 shadow-xl"
                )}>
                  <span className={cn(
                    "transition-transform duration-300",
                    isHovered && change.trend === "up" && "animate-bounce",
                    isHovered && change.trend === "down" && "animate-pulse"
                  )}>
                    {change.trend === "up" && "↗"}
                    {change.trend === "down" && "↘"}
                    {change.trend === "neutral" && "→"}
                  </span>
                  <span>{change.value}</span>
                </span>
                <span className="text-xs text-muted-foreground">{change.period}</span>
              </div>
            )}
          </div>
          
          {/* Enhanced icon with advanced gradients */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
            "bg-gradient-to-br relative overflow-hidden",
            iconBackgrounds[gradient],
            isHovered && "scale-110 rotate-3 shadow-2xl",
            isPressed && "scale-95 rotate-1",
            "before:absolute before:inset-0 before:bg-white/20 before:rounded-2xl before:opacity-0",
            "hover:before:opacity-100 before:transition-opacity before:duration-300"
          )}>
            {/* Icon glow effect */}
            <div className={cn(
              "absolute inset-2 rounded-xl transition-all duration-300",
              "bg-gradient-to-br opacity-0",
              gradientClasses[gradient],
              isHovered && "opacity-20 blur-sm scale-110"
            )} />
            
            <Icon className={cn(
              "w-8 h-8 text-white drop-shadow-lg relative z-10 transition-all duration-300",
              isHovered && "drop-shadow-2xl scale-110",
              isPressed && "scale-90"
            )} />
          </div>
        </div>
      </CardContent>
      
      {/* Pulse effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-1000 pointer-events-none",
          "bg-gradient-to-br opacity-0",
          gradientClasses[gradient],
          isHovered && "opacity-5 animate-pulse"
        )}
      />
      
      {/* Click ripple effect */}
      {clickCount > 0 && (
        <div 
          key={clickCount}
          className={cn(
            "absolute inset-0 rounded-lg pointer-events-none",
            "bg-gradient-to-br animate-ping opacity-20",
            gradientClasses[gradient]
          )}
          style={{
            animationDuration: "0.6s",
            animationIterationCount: 1
          }}
        />
      )}
      
      {/* Floating particles on hover */}
      {isHovered && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className={cn(
                "absolute w-1 h-1 rounded-full opacity-60 pointer-events-none",
                "bg-gradient-to-r animate-float",
                gradientClasses[gradient]
              )}
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 10}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            />
          ))}
        </>
      )}
    </Card>
  );
}
