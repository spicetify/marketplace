import { IDB_BLACKLIST_STORE, IDB_DB_NAME, IDB_DB_VERSION, IDB_MANIFEST_STORE, IDB_REPO_LIST_STORE, IDB_SNIPPETS_STORE } from "@constants";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error opening database", request.error);
      reject(request.error);
      dbPromise = null;
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (event.oldVersion < 1) {
        db.createObjectStore(IDB_REPO_LIST_STORE, { keyPath: "url" });
        db.createObjectStore(IDB_MANIFEST_STORE, { keyPath: "url" });
        db.createObjectStore(IDB_BLACKLIST_STORE, { keyPath: "url" });
        db.createObjectStore(IDB_SNIPPETS_STORE, { keyPath: "url" });
      }
    };
  });

  return dbPromise;
}

export async function getCachedData(storeName: string, key: string): Promise<any | null> {
  try {
    const db = await getDb();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ?? null);
      };
      request.onerror = () => {
        console.error("IndexedDB error getting data", request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error("Error accessing IndexedDB", error);
    return null;
  }
}

export async function setCachedData(storeName: string, key: string, data: any): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    const request = store.put({ url: key, data, timestamp: Date.now() }); // Store with timestamp

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error("IndexedDB error setting data", request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Error accessing IndexedDB", error);
  }
}

export async function clearAllCaches(): Promise<boolean> {
  try {
    const db = await getDb();
    const storeNames = [IDB_REPO_LIST_STORE, IDB_MANIFEST_STORE, IDB_BLACKLIST_STORE, IDB_SNIPPETS_STORE];

    await Promise.all(
      storeNames.map((storeName) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        return new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );

    console.log("All caches cleared.");
    return true;
  } catch (error) {
    console.error("Error clearing all IndexedDB caches", error);
    return false;
  }
}
