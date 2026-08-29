import Dexie, { type EntityTable } from "dexie";

const DATABASE_NAME = "spicetify-marketplace";
const MARKETPLACE_KEY_PREFIX = "marketplace:";
const HYDRATION_RETRY_DELAYS_MS = [150, 400, 1000];

type StoredRecord = {
  key: string;
  value: string;
};

const cache = new Map<string, string>();
const persistedCache = new Map<string, string>();
const cacheRevisions = new Map<string, number>();
let database: Dexie | null = null;
let settings: EntityTable<StoredRecord, "key"> | null = null;
let databaseUnavailable = false;
let hydrationPromise: Promise<void> | null = null;
let mutationQueue: Promise<void> = Promise.resolve();
let mutationRevision = 0;
let hydrated = false;

function getSettingsTable() {
  if (databaseUnavailable || !window.indexedDB) return null;
  if (settings) return settings;

  database = new Dexie(DATABASE_NAME);
  database.version(1).stores({ settings: "key" });
  settings = database.table<StoredRecord, "key">("settings") as EntityTable<StoredRecord, "key">;
  return settings;
}

function resetDatabase() {
  database?.close();
  database = null;
  settings = null;
}

function disableDatabase() {
  resetDatabase();
  databaseUnavailable = true;
}

function enqueue(operation: () => Promise<void>) {
  const result = mutationQueue.then(operation);
  mutationQueue = result.catch(() => undefined);
  return result;
}

function changedKeys(previous: Map<string, string>, next: Map<string, string>) {
  return new Set([
    ...Array.from(previous.keys()).filter((key) => !next.has(key)),
    ...Array.from(next.entries())
      .filter(([key, value]) => previous.get(key) !== value)
      .map(([key]) => key)
  ]);
}

function replaceMap(target: Map<string, string>, source: Map<string, string>) {
  target.clear();
  for (const [key, value] of source) target.set(key, value);
}

function reconcileCache(previous: Map<string, string>, next: Map<string, string>, revision: number) {
  for (const key of changedKeys(previous, next)) {
    if ((cacheRevisions.get(key) ?? 0) > revision) continue;
    if (next.has(key)) cache.set(key, next.get(key) as string);
    else cache.delete(key);
    cacheRevisions.set(key, revision);
  }
}

async function persistChanges(previous: Map<string, string>, next: Map<string, string>) {
  const table = getSettingsTable();
  if (!table || !database) return;

  const updates = Array.from(next.entries())
    .filter(([key, value]) => previous.get(key) !== value)
    .map(([key, value]) => ({ key, value }));
  const removals = Array.from(previous.keys()).filter((key) => !next.has(key));
  if (updates.length === 0 && removals.length === 0) return;

  await database.transaction("rw", table, async () => {
    if (updates.length > 0) await table.bulkPut(updates);
    if (removals.length > 0) await table.bulkDelete(removals);
  });
}

function mutateStorage(mutate: (draft: Map<string, string>) => void, optimistic = false) {
  const revision = ++mutationRevision;
  let optimisticPrevious: Map<string, string> | null = null;
  let optimisticNext: Map<string, string> | null = null;

  if (optimistic) {
    optimisticPrevious = new Map(cache);
    optimisticNext = new Map(optimisticPrevious);
    mutate(optimisticNext);
    reconcileCache(optimisticPrevious, optimisticNext, revision);
  }

  const operation = enqueue(async () => {
    await hydrateMarketplaceStorage();
    const previous = new Map(persistedCache);
    const next = new Map(previous);
    mutate(next);
    await persistChanges(previous, next);
    replaceMap(persistedCache, next);
    reconcileCache(previous, next, revision);
  });

  if (!optimistic || !optimisticPrevious || !optimisticNext) return operation;

  return operation.catch((error) => {
    reconcileCache(optimisticNext as Map<string, string>, persistedCache, revision);
    throw error;
  });
}

async function loadIndexedDBCache() {
  const table = getSettingsTable();
  if (!table) return;

  const records = await table.toArray();
  for (const { key, value } of records) {
    cache.set(key, value);
    persistedCache.set(key, value);
  }
}

async function migrateLocalStorage() {
  const records: StoredRecord[] = [];
  for (let index = 0; index < window.localStorage.length; index++) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(MARKETPLACE_KEY_PREFIX) || cache.has(key)) continue;

    const value = window.localStorage.getItem(key);
    if (value !== null) records.push({ key, value });
  }
  if (records.length === 0) return;

  const table = getSettingsTable();
  if (table) {
    try {
      await table.bulkPut(records);
    } catch (error) {
      console.warn("Marketplace localStorage migration could not be persisted", error);
      disableDatabase();
    }
  }

  for (const { key, value } of records) {
    cache.set(key, value);
    persistedCache.set(key, value);
  }
}

export async function hydrateMarketplaceStorage() {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        await loadIndexedDBCache();
        break;
      } catch (error) {
        if (attempt >= HYDRATION_RETRY_DELAYS_MS.length) throw error;
        console.warn(`Marketplace IndexedDB cache could not be read, retrying (${attempt + 1}/${HYDRATION_RETRY_DELAYS_MS.length})`, error);
        resetDatabase();
        await new Promise((resolve) => setTimeout(resolve, HYDRATION_RETRY_DELAYS_MS[attempt]));
      }
    }

    await migrateLocalStorage();
    hydrated = true;
  })();

  try {
    await hydrationPromise;
  } catch (error) {
    hydrationPromise = null;
    throw error;
  }
}

export const marketplaceStorage = {
  getItem(key: string) {
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string) {
    void mutateStorage((draft) => draft.set(key, value), true).catch((error) => console.warn("Marketplace item persistence failed", error));
  },

  async setItemAsync(key: string, value: string) {
    await mutateStorage((draft) => draft.set(key, value));
  },

  removeItem(key: string) {
    void mutateStorage((draft) => draft.delete(key), true).catch((error) => console.warn("Marketplace item removal failed", error));
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
