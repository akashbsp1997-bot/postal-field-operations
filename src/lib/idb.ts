import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "tensa_postal_beat";
const DB_VERSION = 1;

export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: "insert" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

let dbInstance: IDBPDatabase | null = null;

async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("sync_queue")) {
        const store = db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
        store.createIndex("timestamp", "timestamp");
        store.createIndex("table", "table");
      }
      if (!db.objectStoreNames.contains("houses")) {
        db.createObjectStore("houses", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("businesses")) {
        db.createObjectStore("businesses", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("articles")) {
        db.createObjectStore("articles", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("followups")) {
        db.createObjectStore("followups", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("deliveries")) {
        db.createObjectStore("deliveries", { keyPath: "id" });
      }
    },
  });
  return dbInstance;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "retries">) {
  const db = await getDB();
  return db.add("sync_queue", { ...item, retries: 0 });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("sync_queue");
}

export async function removeSyncQueueItem(id: number) {
  const db = await getDB();
  return db.delete("sync_queue", id);
}

export async function incrementRetry(id: number) {
  const db = await getDB();
  const item = await db.get("sync_queue", id);
  if (item) {
    item.retries += 1;
    await db.put("sync_queue", item);
  }
}

export async function cacheOfflineData(storeName: string, items: Array<{ id: string }>) {
  const db = await getDB();
  const validStores = ["houses", "businesses", "articles", "followups", "deliveries"];
  if (!validStores.includes(storeName)) return;
  const tx = db.transaction(storeName, "readwrite");
  await Promise.all([...items.map(item => tx.store.put(item)), tx.done]);
}

export async function getOfflineData<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  const validStores = ["houses", "businesses", "articles", "followups", "deliveries"];
  if (!validStores.includes(storeName)) return [];
  return db.getAll(storeName) as Promise<T[]>;
}

export async function isOnline(): Promise<boolean> {
  return navigator.onLine;
}
