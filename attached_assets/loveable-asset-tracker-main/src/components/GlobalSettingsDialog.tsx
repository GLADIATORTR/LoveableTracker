import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { RealEstateInvestment } from '@/pages/Index';

interface GlobalSettingsDialogProps {
  investments: RealEstateInvestment[];
}

export const GlobalSettingsDialog = ({ investments }: GlobalSettingsDialogProps) => {
  const { settings, updateSettings } = useGlobalSettings();
  const [selectedCountry, setSelectedCountry] = useState<string>('USA');
  const [tempSettings, setTempSettings] = useState(settings);
  const [open, setOpen] = useState(false);

  // Get unique countries from investments
  const usedCountries = Array.from(new Set(investments.map(inv => inv.country || 'USA')));

  const handleChange = (field: keyof typeof settings, value: string) => {
    setTempSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleApply = () => {
    updateSettings(tempSettings);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setOpen(false);
  };

  const getCurrentCountrySettings = () => {
    if (selectedCountry === 'Turkey') {
      return {
        appreciation: tempSettings.realEstateAppreciationRateTurkey,
        inflation: tempSettings.inflationRateTurkey,
        selling: tempSettings.sellingCostsTurkey,
        tax: tempSettings.capitalGainsTaxTurkey,
        mortgage: tempSettings.currentMortgageRateTurkey
      };
    } else {
      return {
        appreciation: tempSettings.realEstateAppreciationRate,
        inflation: tempSettings.inflationRate,
        selling: tempSettings.sellingCosts,
        tax: tempSettings.capitalGainsTax,
        mortgage: tempSettings.currentMortgageRate
      };
    }
  };

  const updateCountrySettings = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (selectedCountry === 'Turkey') {
      const countryField = `${field}Turkey` as keyof typeof tempSettings;
      setTempSettings(prev => ({ ...prev, [countryField]: numValue }));
    } else {
      setTempSettings(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const countrySettings = getCurrentCountrySettings();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Global Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Global Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="country-select">Select Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {usedCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <h3 className="text-lg font-semibold">{selectedCountry} Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appreciation">Real Estate Appreciation Rate (%)</Label>
                <Input
                  id="appreciation"
                  type="number"
                  step="0.1"
                  value={countrySettings.appreciation}
                  onChange={(e) => updateCountrySettings('realEstateAppreciationRate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inflation">Inflation Rate (%)</Label>
                <Input
                  id="inflation"
                  type="number"
                  step="0.1"
                  value={countrySettings.inflation}
                  onChange={(e) => updateCountrySettings('inflationRate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="selling">Selling Costs (%)</Label>
                <Input
                  id="selling"
                  type="number"
                  step="0.1"
                  value={countrySettings.selling}
                  onChange={(e) => updateCountrySettings('sellingCosts', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tax">Capital Gains Tax (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.1"
                  value={countrySettings.tax}
                  onChange={(e) => updateCountrySettings('capitalGainsTax', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mortgage">Current Mortgage Rate (%)</Label>
                <Input
                  id="mortgage"
                  type="number"
                  step="0.1"
                  value={countrySettings.mortgage}
                  onChange={(e) => updateCountrySettings('currentMortgageRate', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};