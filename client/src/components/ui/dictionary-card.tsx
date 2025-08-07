import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Monitor, Armchair, Wrench } from "lucide-react";
import type { DictionaryEntryWithCategory } from "@shared/schema";

interface DictionaryCardProps {
  entry: DictionaryEntryWithCategory;
  onClick?: () => void;
  className?: string;
}

const categoryIcons = {
  Electronics: Monitor,
  Furniture: Armchair,
  Equipment: Wrench,
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

export function DictionaryCard({ entry, onClick, className }: DictionaryCardProps) {
  const categoryName = entry.category?.name || "Unknown";
  const Icon = categoryIcons[categoryName as keyof typeof categoryIcons] || Monitor;
  const categoryColor = entry.category?.color || "#3b82f6";

  return (
    <Card className={cn("dictionary-card", className)} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Icon 
                className="w-5 h-5"
                style={{ color: categoryColor }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{entry.name}</h3>
              <Badge 
                variant="secondary"
                className="text-xs"
                style={{ 
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                  borderColor: `${categoryColor}40`
                }}
              >
                {categoryName}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {entry.description}
        </p>

        <div className="space-y-2">
          {entry.type && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground font-medium">{entry.type}</span>
            </div>
          )}
          {entry.estimatedValue && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Value:</span>
              <span className="text-foreground font-medium">
                {formatCurrency(entry.estimatedValue)}
              </span>
            </div>
          )}
          {entry.expectedLifecycle && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lifecycle:</span>
              <span className="text-foreground font-medium">{entry.expectedLifecycle}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated {formatTimeAgo(entry.updatedAt!)}</span>
            <span>Used in {entry.usageCount} assets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
