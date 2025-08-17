import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useTheme } from "@/components/ui/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "@/components/ui/modal";
import { exportData } from "@/lib/export";
import { importAssets } from "@/lib/import";
import { 
  User, 
  Palette, 
  Bell, 
  Database, 
  Shield, 
  Download, 
  Upload, 
  Trash2,
  Save,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { userPreferences, setUserPreferences, user } = useAppContext();
  
  const [activeSection, setActiveSection] = useState("profile");
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle,
  });

  const settingsSections = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & Storage", icon: Database },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleExportData = async () => {
    try {
      await exportData();
      toast({
        title: "Export Started",
        description: "Your data export is being prepared and will download shortly.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importAssets(file);
      toast({
        title: "Import Successful",
        description: "Your asset data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing your data. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/user-data', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear data');
      
      toast({
        title: "Data Cleared",
        description: "All your property data has been permanently deleted.",
      });
      setShowClearModal(false);
      
      // Refresh the page to reflect the empty state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "There was an error clearing your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const updatePreferences = (updates: Partial<typeof userPreferences>) => {
    setUserPreferences({ ...userPreferences, ...updates });
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved.",
    });
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, preferences, and application settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Profile Settings */}
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveProfile} className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeSection === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Theme Preference</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose how the application looks on your device.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Light", description: "Light mode" },
                      { value: "dark", label: "Dark", description: "Dark mode" },
                      { value: "system", label: "System", description: "Follow system" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          theme === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="density" className="text-base font-medium">Display Density</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Adjust the spacing and size of interface elements.
                  </p>
                  <Select 
                    value={userPreferences.density} 
                    onValueChange={(value: "compact" | "standard" | "comfortable") => 
                      updatePreferences({ density: value })
                    }
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about asset updates and system alerts.
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.notifications}
                    onCheckedChange={(checked) => updatePreferences({ notifications: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <div className="space-y-3">
                    {[
                      { id: "asset_updates", label: "Asset Updates", description: "When assets are added, modified, or deleted" },
                      { id: "maintenance_alerts", label: "Maintenance Alerts", description: "Upcoming maintenance schedules" },
                      { id: "value_changes", label: "Value Changes", description: "Significant changes in asset values" },
                      { id: "reports", label: "Weekly Reports", description: "Summary reports sent weekly" },
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{notification.label}</div>
                          <div className="text-xs text-muted-foreground">{notification.description}</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Management */}
          {activeSection === "data" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Export Data */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your asset data as JSON file
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Import Data */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium">Import Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload asset data from CSV or JSON file
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-file"
                    />
                    <Label htmlFor="import-file" asChild>
                      <Button variant="outline" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Storage Info */}
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Storage Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assets stored:</span>
                      <Badge variant="secondary">2,847 records</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dictionary entries:</span>
                      <Badge variant="secondary">247 definitions</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories:</span>
                      <Badge variant="secondary">4 categories</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage type:</span>
                      <Badge variant="outline">In-Memory</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                      <p className="text-sm text-destructive/80 mb-3">
                        Permanently delete all asset records. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setShowClearModal(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Session Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage your active sessions and login security.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current session</span>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Last login</span>
                      <span className="text-muted-foreground">Today at 9:23 AM</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Data Privacy</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Control how your data is used and shared.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Analytics data collection</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Crash reporting</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance monitoring</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Data"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
            <div>
              <p className="font-medium text-destructive">This action cannot be undone</p>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently delete all assets, dictionary entries, and associated data.
                Make sure you have exported any data you want to keep.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearAllData}
              disabled={isClearing}
            >
              {isClearing ? (
                <>Processing...</>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Everything
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
