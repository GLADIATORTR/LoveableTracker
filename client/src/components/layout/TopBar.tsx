import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GlobalSettings } from "@/components/ui/global-settings";
import { Search, Bell, Download, Plus } from "lucide-react";
import { useState } from "react";

const routeTitles = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/dictionary": "Dictionary",
  "/assets": "Assets",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function TopBar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const currentTitle = routeTitles[location as keyof typeof routeTitles] || "Asset Tracker";

  const handleExport = () => {
    // Create download link for export
    const link = document.createElement('a');
    link.href = '/api/export';
    link.download = 'asset-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Started",
      description: "Your data export is being prepared and will download shortly.",
    });
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "You have 3 new asset reviews pending.",
    });
  };

  const handleAddAsset = () => {
    // This would typically open a modal or navigate to an add form
    toast({
      title: "Add Asset",
      description: "Asset creation form would open here.",
    });
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{currentTitle}</span>
          {location !== "/" && location !== "/dashboard" && (
            <>
              <span>›</span>
              <span>Overview</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 focus-ring"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotifications}
              className="text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-3 h-3 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </div>

          {/* Global Settings */}
          <GlobalSettings />
          
          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="text-primary hover:bg-primary/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {/* Add Asset */}
          <Button
            size="sm"
            onClick={handleAddAsset}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>
    </header>
  );
}
