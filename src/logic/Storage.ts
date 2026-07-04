const DATABASE_NAME = "spicetify-marketplace";
const DATABASE_VERSION = 1;
const STORE_NAME = "settings";
const MARKETPLACE_KEY_PREFIX = "marketplace:";

type StoredRecord = {
  key: string;
  value: string;
};

const cache = new Map<string, string>();
let databasePromise: Promise<IDBDatabase | null> | null = null;
let hydrationPromise: Promise<void> | null = null;
let hydrated = false;

function shouldMigrateLocalStorageKey(key: string) {
  return key.startsWith(MARKETPLACE_KEY_PREFIX);
}

function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "key" });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn("Marketplace IndexedDB storage unavailable", request.error);
      resolve(null);
    };
    request.onblocked = () => resolve(null);
  });

  return databasePromise;
}

async function runStoreRequest<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | undefined): Promise<T | undefined> {
  const database = await openDatabase();
  if (!database) return undefined;

  return new Promise((resolve) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    let result: T | undefined;
    let settled = false;

    const settle = (value: T | undefined) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    transaction.oncomplete = () => settle(result);
    transaction.onerror = () => {
      console.warn("Marketplace IndexedDB transaction failed", transaction.error);
      settle(undefined);
    };
    transaction.onabort = () => {
      console.warn("Marketplace IndexedDB transaction aborted", transaction.error);
      settle(undefined);
    };

    if (!request) return;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => {
      console.warn("Marketplace IndexedDB request failed", request.error);
      settle(undefined);
    };
  });
}

async function persistItem(key: string, value: string) {
  await runStoreRequest("readwrite", (store) => store.put({ key, value }));
}

async function removePersistedItem(key: string) {
  await runStoreRequest("readwrite", (store) => store.delete(key));
}

async function loadIndexedDBCache() {
  const records = await runStoreRequest<StoredRecord[]>("readonly", (store) => store.getAll());
  if (!records) return;

  for (const record of records) {
    cache.set(record.key, record.value);
  }
}

async function migrateLocalStorage() {
  try {
    const migrated: Promise<void>[] = [];

    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (!key || !shouldMigrateLocalStorageKey(key) || cache.has(key)) continue;

      const value = window.localStorage.getItem(key);
      if (value === null) continue;

      cache.set(key, value);
      migrated.push(persistItem(key, value));
    }

    await Promise.all(migrated);
  } catch (error) {
    console.warn("Marketplace localStorage migration failed", error);
  }
}

export async function hydrateMarketplaceStorage() {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    await loadIndexedDBCache();
    await migrateLocalStorage();
    hydrated = true;
  })();

  return hydrationPromise;
}

export const marketplaceStorage = {
  getItem(key: string) {
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string) {
    cache.set(key, value);
    void persistItem(key, value);
  },

  async setItemAsync(key: string, value: string) {
    cache.set(key, value);
    await persistItem(key, value);
  },

  removeItem(key: string) {
    cache.delete(key);
    void removePersistedItem(key);
  },

  async removeItemAsync(key: string) {
    cache.delete(key);
    await removePersistedItem(key);
  },

  keys() {
    return Array.from(cache.keys());
  },

  entries() {
    return Object.fromEntries(cache.entries()) as Record<string, string>;
  }
};
