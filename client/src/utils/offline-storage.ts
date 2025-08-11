// Offline storage utilities using IndexedDB

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
}

class OfflineStorage {
  private dbName = 're-tracker-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached API data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for offline actions
        if (!db.objectStoreNames.contains('pending-actions')) {
          const actionsStore = db.createObjectStore('pending-actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Cache API responses
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result || result.expires < Date.now()) {
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Store offline action
  async storeOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();

    const id = crypto.randomUUID();
    const offlineAction: OfflineAction = {
      id,
      ...action,
      timestamp: Date.now()
    };

    const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      const request = store.put(offlineAction);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending actions
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['pending-actions'], 'readonly');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove processed action
  async removeAction(id: string): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['pending-actions'], 'readwrite');
    const store = transaction.objectStore('pending-actions');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');

    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = cursor.value;
          if (entry.expires < now) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();