// IndexedDB utility with LocalStorage fallback

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

interface DBStore {
  name: string;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

const stores: DBStore[] = [
  { name: 'profile', keyPath: 'id' },
  { name: 'income', keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }] },
  { name: 'expenses', keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: 'category', keyPath: 'category' }] },
  { name: 'loans', keyPath: 'id' },
  { name: 'savingsGoals', keyPath: 'id' },
];

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, falling back to LocalStorage');
      reject(new Error('IndexedDB not available'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      stores.forEach((store) => {
        if (!database.objectStoreNames.contains(store.name)) {
          const objectStore = database.createObjectStore(store.name, {
            keyPath: store.keyPath,
          });

          if (store.indexes) {
            store.indexes.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique || false,
              });
            });
          }
        }
      });
    };
  });
};

export const getDB = async (): Promise<IDBDatabase> => {
  if (db) return db;
  return initDB();
};

// Generic CRUD operations
export const dbGet = async <T>(storeName: string, id: string): Promise<T | null> => {
  try {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Fallback to LocalStorage
    const data = localStorage.getItem(`${storeName}_${id}`);
    return data ? JSON.parse(data) : null;
  }
};

export const dbGetAll = async <T>(storeName: string): Promise<T[]> => {
  try {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Fallback to LocalStorage
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${storeName}_`));
    return keys.map((key) => JSON.parse(localStorage.getItem(key) || '{}'));
  }
};

export const dbPut = async <T>(storeName: string, data: T): Promise<T> => {
  try {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Fallback to LocalStorage
    const item = data as any;
    localStorage.setItem(`${storeName}_${item.id}`, JSON.stringify(data));
    return data;
  }
};

export const dbDelete = async (storeName: string, id: string): Promise<void> => {
  try {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Fallback to LocalStorage
    localStorage.removeItem(`${storeName}_${id}`);
  }
};

