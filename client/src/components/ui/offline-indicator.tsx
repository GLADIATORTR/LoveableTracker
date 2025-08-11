import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, Cloud, CloudOff } from "lucide-react";
import { pwaManager } from "@/utils/pwa";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    pwaManager.onOnline(handleOnline);
    pwaManager.onOffline(handleOffline);

    return () => {
      pwaManager.removeOnlineListener(handleOnline);
      pwaManager.removeOfflineListener(handleOffline);
    };
  }, []);

  return (
    <>
      {/* Status Badge */}
      <Badge 
        variant={isOnline ? "default" : "destructive"} 
        className="fixed top-4 right-4 z-50 flex items-center gap-1"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>

      {/* Offline Alert */}
      {showOfflineAlert && (
        <Alert className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto border-orange-200 bg-orange-50 text-orange-800">
          <CloudOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Changes will be saved locally and synced when you reconnect.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}