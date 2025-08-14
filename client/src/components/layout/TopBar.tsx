import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GlobalSettings } from "@/components/ui/global-settings";
import { Search, Bell, Download, Plus, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const routeTitles = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/dictionary": "Asset Dictionary",
  "/investments": "Investments",
  "/reports": "TimeSeries Projections",
  "/settings": "Settings",
};

export default function TopBar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const currentTitle = routeTitles[location as keyof typeof routeTitles] || "Real Estate Financials";

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
    // Navigate to investments page where user can add new properties
    navigate("/investments");
    toast({
      title: "Add Property",
      description: "Redirecting to investments page to add new property.",
    });
  };

  return (
    <header className="bg-white/95 border-b border-border/50 px-6 py-4 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="font-semibold text-lg text-primary">
            {currentTitle}
          </span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-mono border border-emerald-200">
            v4851
          </span>
          {location !== "/" && location !== "/dashboard" && (
            <>
              <span className="text-muted-foreground/50">›</span>
              <span className="text-muted-foreground">Overview</span>
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

          {/* Dictionary */}
          <Link href="/dictionary">
            <Button
              variant="outline"
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Dictionary
            </Button>
          </Link>

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
