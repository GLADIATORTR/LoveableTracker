import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CountrySettings {
  realEstateAppreciationRate: number;
  inflationRate: number;
  sellingCosts: number;
  capitalGainsTax: number;
  currentMortgageRate: number;
}

interface GlobalSettings {
  selectedCountry: string;
  countrySettings: Record<string, CountrySettings>;
}

const DEFAULT_COUNTRY_SETTINGS: Record<string, CountrySettings> = {
  USA: {
    realEstateAppreciationRate: 3.5,
    inflationRate: 2.8,
    sellingCosts: 6.0,
    capitalGainsTax: 25.0,
    currentMortgageRate: 6.5,
  },
  Turkey: {
    realEstateAppreciationRate: 15.0,
    inflationRate: 45.0,
    sellingCosts: 8.0,
    capitalGainsTax: 20.0,
    currentMortgageRate: 35.0,
  },
  Canada: {
    realEstateAppreciationRate: 4.2,
    inflationRate: 3.1,
    sellingCosts: 5.5,
    capitalGainsTax: 50.0,
    currentMortgageRate: 5.8,
  },
  UK: {
    realEstateAppreciationRate: 2.8,
    inflationRate: 2.5,
    sellingCosts: 3.0,
    capitalGainsTax: 28.0,
    currentMortgageRate: 5.2,
  },
};

const COUNTRIES = Object.keys(DEFAULT_COUNTRY_SETTINGS);

export function GlobalSettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    selectedCountry: 'USA',
    countrySettings: DEFAULT_COUNTRY_SETTINGS,
  });
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('global-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsed,
          // Ensure all countries have default settings
          countrySettings: {
            ...DEFAULT_COUNTRY_SETTINGS,
            ...parsed.countrySettings,
          },
        }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    localStorage.setItem('global-settings', JSON.stringify(newSettings));
    
    // Also save to a global context or state manager if needed
    window.dispatchEvent(new CustomEvent('globalSettingsChanged', { 
      detail: newSettings 
    }));
  };

  const handleCountryChange = (country: string) => {
    const newSettings = {
      ...settings,
      selectedCountry: country,
    };
    saveSettings(newSettings);
  };

  const handleSettingChange = (field: keyof CountrySettings, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newSettings = {
      ...settings,
      countrySettings: {
        ...settings.countrySettings,
        [settings.selectedCountry]: {
          ...settings.countrySettings[settings.selectedCountry],
          [field]: numericValue,
        },
      },
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    const newSettings = {
      selectedCountry: settings.selectedCountry,
      countrySettings: {
        ...settings.countrySettings,
        [settings.selectedCountry]: DEFAULT_COUNTRY_SETTINGS[settings.selectedCountry],
      },
    };
    saveSettings(newSettings);
    
    toast({
      title: "Settings Reset",
      description: `${settings.selectedCountry} settings have been reset to defaults.`,
    });
  };

  const currentCountrySettings = settings.countrySettings[settings.selectedCountry];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Global Settings
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Global Settings
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            All values are USD-adjusted. Rates here reflect USD appreciation, inflation, 
            and costs even for non-U.S. properties.
          </p>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country-select">Select Country</Label>
            <Select 
              value={settings.selectedCountry} 
              onValueChange={handleCountryChange}
            >
              <SelectTrigger id="country-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country-Specific Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">{settings.selectedCountry} Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appreciation-rate">
                  Real Estate Appreciation Rate (%)
                </Label>
                <Input
                  id="appreciation-rate"
                  type="number"
                  step="0.1"
                  value={currentCountrySettings.realEstateAppreciationRate}
                  onChange={(e) => handleSettingChange('realEstateAppreciationRate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inflation-rate">
                  Inflation Rate (%)
                </Label>
                <Input
                  id="inflation-rate"
                  type="number"
                  step="0.1"
                  value={currentCountrySettings.inflationRate}
                  onChange={(e) => handleSettingChange('inflationRate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling-costs">
                  Selling Costs (%)
                </Label>
                <Input
                  id="selling-costs"
                  type="number"
                  step="0.1"
                  value={currentCountrySettings.sellingCosts}
                  onChange={(e) => handleSettingChange('sellingCosts', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capital-gains-tax">
                  Capital Gains Tax (%)
                </Label>
                <Input
                  id="capital-gains-tax"
                  type="number"
                  step="0.1"
                  value={currentCountrySettings.capitalGainsTax}
                  onChange={(e) => handleSettingChange('capitalGainsTax', e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="mortgage-rate">
                  Current Mortgage Rate (%)
                </Label>
                <Input
                  id="mortgage-rate"
                  type="number"
                  step="0.1"
                  value={currentCountrySettings.currentMortgageRate}
                  onChange={(e) => handleSettingChange('currentMortgageRate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Button onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}