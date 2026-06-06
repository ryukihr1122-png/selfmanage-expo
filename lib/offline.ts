/**
 * オフラインキャッシュ & キュー
 *
 * - MeResponse をキャッシュし、オフライン時に返す
 * - 完了操作をキューに溜め、復帰時に一括送信
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "selfmanage_cache_me";
const QUEUE_KEY = "selfmanage_offline_queue";

// ─── キャッシュ ──────────────────────────────────────────────────

export async function setCachedMe(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function getCachedMe<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ─── オフラインキュー ─────────────────────────────────────────────

interface QueuedAction {
  type: "complete" | "undo";
  taskId: string;
  date: string;
  timestamp: number;
}

export async function enqueueAction(action: QueuedAction): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedAction[] = raw ? JSON.parse(raw) : [];
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}
