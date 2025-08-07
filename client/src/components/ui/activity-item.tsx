import { cn } from "@/lib/utils";
import { LucideIcon, Plus, Edit, Check, AlertCircle } from "lucide-react";
import type { Activity } from "@shared/schema";

interface ActivityItemProps {
  activity: Activity;
  className?: string;
}

const activityIcons: Record<string, LucideIcon> = {
  created: Plus,
  updated: Edit,
  completed: Check,
  reviewed: Check,
  deleted: AlertCircle,
};

const activityColors: Record<string, string> = {
  created: "text-primary bg-primary/10",
  updated: "text-warning bg-warning/10",
  completed: "text-success bg-success/10",
  reviewed: "text-success bg-success/10",
  deleted: "text-destructive bg-destructive/10",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

export function ActivityItem({ activity, className }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] || Plus;
  const colorClass = activityColors[activity.type] || "text-primary bg-primary/10";

  return (
    <div className={cn(
      "flex items-start space-x-3 p-3 hover:bg-accent/50 rounded-lg transition-colors",
      className
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        colorClass
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(activity.createdAt!)}
        </p>
      </div>
    </div>
  );
}
