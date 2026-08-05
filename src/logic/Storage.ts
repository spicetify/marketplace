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
let mutationQueue: Promise<void> = Promise.resolve();
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
  if (!database) throw new Error("Marketplace IndexedDB storage is unavailable");

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    let result: T | undefined;
    let settled = false;

    const settle = (value: T | undefined) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const fail = (message: string, error: DOMException | null) => {
      if (settled) return;
      settled = true;
      console.warn(message, error);
      reject(error ?? new Error(message));
    };

    transaction.oncomplete = () => settle(result);
    transaction.onerror = () => fail("Marketplace IndexedDB transaction failed", transaction.error);
    transaction.onabort = () => fail("Marketplace IndexedDB transaction aborted", transaction.error);

    if (!request) return;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => fail("Marketplace IndexedDB request failed", request.error);
  });
}

async function persistChanges(previous: Map<string, string>, next: Map<string, string>) {
  const updates = Array.from(next.entries()).filter(([key, value]) => previous.get(key) !== value);
  const removals = Array.from(previous.keys()).filter((key) => !next.has(key));
  if (updates.length === 0 && removals.length === 0) return;

  const database = await openDatabase();
  if (!database) throw new Error("Marketplace IndexedDB storage is unavailable");

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    let settled = false;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      reject(transaction.error ?? new Error(message));
    };

    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    transaction.onerror = () => fail("Marketplace IndexedDB transaction failed");
    transaction.onabort = () => fail("Marketplace IndexedDB transaction aborted");

    for (const [key, value] of updates) store.put({ key, value });
    for (const key of removals) store.delete(key);
  });
}

function mutateStorage(mutate: (draft: Map<string, string>) => void) {
  const operation = mutationQueue.then(async () => {
    const previous = new Map(cache);
    const next = new Map(previous);
    mutate(next);
    await persistChanges(previous, next);

    for (const key of previous.keys()) {
      if (!next.has(key)) cache.delete(key);
    }
    for (const [key, value] of next) cache.set(key, value);
  });
  mutationQueue = operation.catch(() => undefined);
  return operation;
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
    try {
      await loadIndexedDBCache();
      await migrateLocalStorage();
      hydrated = true;
    } catch (error) {
      console.warn("Marketplace storage hydration failed", error);
      hydrationPromise = null;
    }
  })();

  return hydrationPromise;
}

export const marketplaceStorage = {
  getItem(key: string) {
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string) {
    cache.set(key, value);
    void persistItem(key, value).catch((error) => console.warn("Marketplace item persistence failed", error));
  },

  async setItemAsync(key: string, value: string) {
    await mutateStorage((draft) => draft.set(key, value));
  },

  removeItem(key: string) {
    cache.delete(key);
    void removePersistedItem(key).catch((error) => console.warn("Marketplace item removal failed", error));
  },

  async removeItemAsync(key: string) {
    await mutateStorage((draft) => draft.delete(key));
  },

  async mutateAsync(mutate: (draft: Map<string, string>) => void) {
    await mutateStorage(mutate);
  },

  keys() {
    return Array.from(cache.keys());
  },

  entries() {
    return Object.fromEntries(cache.entries()) as Record<string, string>;
  }
};
