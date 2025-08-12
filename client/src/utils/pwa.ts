// Progressive Web App utilities and service worker management

interface AppInfo {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

class PWAManager {
  private beforeInstallPrompt: any = null;
  private onlineCallbacks: (() => void)[] = [];
  private offlineCallbacks: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.beforeInstallPrompt = e;
    });

    // Listen for network changes
    window.addEventListener('online', () => {
      this.onlineCallbacks.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      this.offlineCallbacks.forEach(callback => callback());
    });
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available, prompt user to refresh
              if (confirm('New version available. Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }

  getAppInfo(): AppInfo {
    return {
      canInstall: !!this.beforeInstallPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    };
  }

  async install(): Promise<boolean> {
    if (!this.beforeInstallPrompt) {
      return false;
    }

    try {
      const choiceResult = await this.beforeInstallPrompt.prompt();
      const accepted = choiceResult.outcome === 'accepted';
      
      if (accepted) {
        this.beforeInstallPrompt = null;
      }
      
      return accepted;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }

  // Network status management
  onOnline(callback: () => void) {
    this.onlineCallbacks.push(callback);
  }

  onOffline(callback: () => void) {
    this.offlineCallbacks.push(callback);
  }

  removeOnlineListener(callback: () => void) {
    const index = this.onlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.onlineCallbacks.splice(index, 1);
    }
  }

  removeOfflineListener(callback: () => void) {
    const index = this.offlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.offlineCallbacks.splice(index, 1);
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const pwaManager = new PWAManager();