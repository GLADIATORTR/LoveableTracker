// PWA utilities for offline support and installation

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private onlineListeners: Array<() => void> = [];
  private offlineListeners: Array<() => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.onlineListeners.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      this.offlineListeners.forEach(callback => callback());
    });
  }

  // Check if the app can be installed
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Show the install prompt
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // Check if the app is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Check online status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add online/offline event listeners
  onOnline(callback: () => void) {
    this.onlineListeners.push(callback);
  }

  onOffline(callback: () => void) {
    this.offlineListeners.push(callback);
  }

  // Remove event listeners
  removeOnlineListener(callback: () => void) {
    this.onlineListeners = this.onlineListeners.filter(cb => cb !== callback);
  }

  removeOfflineListener(callback: () => void) {
    this.offlineListeners = this.offlineListeners.filter(cb => cb !== callback);
  }

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      isOnline: this.isOnline(),
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationSupported: 'Notification' in window,
    };
  }
}

export const pwaManager = new PWAManager();