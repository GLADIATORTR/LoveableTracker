import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Smartphone, X } from "lucide-react";
import { pwaManager } from "@/utils/pwa";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallStatus = () => {
      const appInfo = pwaManager.getAppInfo();
      setCanInstall(appInfo.canInstall);
      setIsInstalled(appInfo.isInstalled);
      
      // Show prompt if app can be installed and hasn't been dismissed recently
      if (appInfo.canInstall && !appInfo.isInstalled) {
        const dismissedTime = localStorage.getItem('install-prompt-dismissed');
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (!dismissedTime || now - parseInt(dismissedTime) > dayInMs * 7) {
          setShowPrompt(true);
        }
      }
    };

    checkInstallStatus();

    // Check periodically for install prompt availability
    const interval = setInterval(checkInstallStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    const success = await pwaManager.install();
    if (success) {
      setShowPrompt(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Install RE Tracker
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">
              Install Real Estate Investment Tracker for quick access and offline functionality.
            </p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Access your investments offline
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Faster loading times
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Native app-like experience
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Works on mobile and desktop
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}