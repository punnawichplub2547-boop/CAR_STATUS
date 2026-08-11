import type { OrientationBatch } from '../types';

const BATCHES_LOCAL_STORAGE_KEY = 'car_orientation_batches_v1';

export function loadOrientationBatchesFromLocalStorage(): OrientationBatch[] {
  try {
    const saved = localStorage.getItem(BATCHES_LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load orientation batches:', err);
  }
  return [];
}

export function saveOrientationBatchesToLocalStorage(batches: OrientationBatch[]): void {
  try {
    localStorage.setItem(BATCHES_LOCAL_STORAGE_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Failed to save orientation batches:', err);
  }
}

export function saveOrientationBatch(batch: Omit<OrientationBatch, 'id' | 'createdAt'>): OrientationBatch {
  const batches = loadOrientationBatchesFromLocalStorage();
  const newBatch: OrientationBatch = {
    ...batch,
    id: `BATCH-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newBatch, ...batches];
  saveOrientationBatchesToLocalStorage(updated);
  return newBatch;
}

export function deleteOrientationBatch(batchId: string): OrientationBatch[] {
  const batches = loadOrientationBatchesFromLocalStorage();
  const updated = batches.filter((b) => b.id !== batchId);
  saveOrientationBatchesToLocalStorage(updated);
  return updated;
}
