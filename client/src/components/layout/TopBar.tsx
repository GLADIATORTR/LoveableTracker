import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GlobalSettings } from "@/components/ui/global-settings";
import { Search, Bell, Download, Plus, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useAppContext } from "@/contexts/AppContext";

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
  const { isMobile, mobileMenuOpen, setMobileMenuOpen } = useAppContext();

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
    <header className="bg-white/95 border-b border-border/50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Mobile Menu Button & Title */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-accent"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          {/* Title & Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="font-semibold text-base sm:text-lg text-primary truncate">
              {currentTitle}
            </span>
            <span className="hidden sm:inline text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-mono border border-emerald-200">
              AA107
            </span>
            {location !== "/" && location !== "/dashboard" && (
              <>
                <span className="hidden sm:inline text-muted-foreground/50">›</span>
                <span className="hidden sm:inline text-muted-foreground">Overview</span>
              </>
            )}
          </div>
        </div>

        {/* Actions - Responsive Layout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search - Hidden on mobile, shown on tablet+ */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64 pl-10 focus-ring"
            />
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-muted-foreground hover:text-foreground p-2"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotifications}
              className="text-muted-foreground hover:text-foreground p-2"
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

          {/* Dictionary - Hidden on mobile */}
          <Link href="/dictionary">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex text-primary hover:bg-primary/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Dictionary</span>
            </Button>
          </Link>

          {/* Global Settings - Hidden on mobile */}
          <div className="hidden sm:block">
            <GlobalSettings />
          </div>
          
          {/* Export - Hidden on mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="hidden sm:flex text-primary hover:bg-primary/10"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Export</span>
          </Button>

          {/* Add Asset - Primary CTA, always visible */}
          <Button
            size="sm"
            onClick={handleAddAsset}
            className="bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Asset</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
