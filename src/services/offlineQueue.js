import { openDB } from 'idb';

const DB_NAME = 'l99-offline';
const DB_VERSION = 1;
const STORE_QUEUE = 'offline-queue';
const STORE_RESULTS = 'cached-results';

/**
 * Initialize IndexedDB for offline queue and cached results.
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queue = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        queue.createIndex('synced', 'synced');
        queue.createIndex('created_at', 'created_at');
      }
      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
      }
    },
  });
}

/**
 * Add an offline scan to the queue for later sync.
 */
export async function addToQueue(scanData) {
  const db = await getDB();
  const entry = {
    ...scanData,
    synced: false,
    is_offline: true,
    created_at: new Date().toISOString(),
  };
  const id = await db.add(STORE_QUEUE, entry);
  return { ...entry, id };
}

/**
 * Get all unsynced items from the queue.
 */
export async function getUnsyncedItems() {
  const db = await getDB();
  const tx = db.transaction(STORE_QUEUE, 'readonly');
  const index = tx.store.index('synced');
  const items = await index.getAll(IDBKeyRange.only(false));
  return items;
}

/**
 * Mark a queue item as synced.
 */
export async function markSynced(id) {
  const db = await getDB();
  const item = await db.get(STORE_QUEUE, id);
  if (item) {
    item.synced = true;
    item.synced_at = new Date().toISOString();
    await db.put(STORE_QUEUE, item);
  }
}

/**
 * Get queue count.
 */
export async function getQueueCount() {
  const db = await getDB();
  const index = db.transaction(STORE_QUEUE).store.index('synced');
  return await index.count(IDBKeyRange.only(false));
}

/**
 * Cache a scan result locally.
 */
export async function cacheResult(id, result) {
  const db = await getDB();
  await db.put(STORE_RESULTS, { id, ...result, cached_at: new Date().toISOString() });
}

/**
 * Get a cached result.
 */
export async function getCachedResult(id) {
  const db = await getDB();
  return await db.get(STORE_RESULTS, id);
}

/**
 * Sync all unsynced items to Supabase.
 * Called when connectivity is restored.
 */
export async function syncQueue(syncFunction) {
  const unsynced = await getUnsyncedItems();
  let synced = 0;
  let failed = 0;

  for (const item of unsynced) {
    try {
      await syncFunction(item);
      await markSynced(item.id);
      synced++;
    } catch (err) {
      console.warn('Failed to sync item:', item.id, err);
      failed++;
    }
  }

  return { synced, failed, total: unsynced.length };
}

/**
 * Clear all synced items from the queue.
 */
export async function clearSynced() {
  const db = await getDB();
  const tx = db.transaction(STORE_QUEUE, 'readonly');
  const index = tx.store.index('synced');
  const keys = await index.getAllKeys(IDBKeyRange.only(true));
  
  if (keys.length > 0) {
    const txDelete = db.transaction(STORE_QUEUE, 'readwrite');
    await Promise.all(keys.map(key => txDelete.store.delete(key)));
    await txDelete.done;
  }
}
