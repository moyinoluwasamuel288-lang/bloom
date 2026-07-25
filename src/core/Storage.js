export class LocalStorageEngine {
  constructor(dbName = 'BloomDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('unsupported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cycles')) {
          db.createObjectStore('cycles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('dailyLogs')) {
          db.createObjectStore('dailyLogs', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('garden')) {
          db.createObjectStore('garden', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onerror = (event) => reject(new Error(`IndexedDB Error: ${event.target.errorCode}`));
      request.onblocked = () => reject(new Error('IndexedDB blocked — close other tabs of this app'));
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result.map(r => r.data));
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async set(storeName, key, value) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put({ id: key, date: key, key, data: value, updatedAt: Date.now() });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (err) { reject(err); }
    });
  }

  async exportAllData() {
    const cycles = await this.getAll('cycles');
    const dailyLogs = await this.getAll('dailyLogs');
    const settings = await this.getAll('settings');
    const garden = await this.getAll('garden');

    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      cycles,
      dailyLogs,
      settings,
      garden
    }, null, 2);
  }

  async clearAll() {
    return new Promise((resolve, reject) => {
      const stores = ['cycles', 'dailyLogs', 'settings', 'garden'];
      const tx = this.db.transaction(stores, 'readwrite');
      stores.forEach(s => tx.objectStore(s).clear());
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
}
