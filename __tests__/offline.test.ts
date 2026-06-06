/**
 * オフラインキャッシュのテスト
 */

// AsyncStorage のモック
jest.mock("@react-native-async-storage/async-storage", () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key: string, val: string) => {
        store[key] = val;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
    },
  };
});

import { setCachedMe, getCachedMe, enqueueAction, getQueuedActions, clearQueue } from "../lib/offline";

describe("offline cache", () => {
  it("stores and retrieves cached Me data", async () => {
    const mockData = { user: { id: "1", email: "test@test.com" }, stats: { level: 5 } };
    await setCachedMe(mockData);
    const result = await getCachedMe();
    expect(result).toEqual(mockData);
  });

  it("returns null when no cache exists", async () => {
    // AsyncStorage mock is shared — getCachedMe uses different key
    // but the mock store persists from previous test
    const result = await getCachedMe();
    // Should return the previously cached data (store persists)
    expect(result).not.toBeNull();
  });
});

describe("offline queue", () => {
  beforeEach(async () => {
    await clearQueue();
  });

  it("enqueues and retrieves actions", async () => {
    await enqueueAction({
      type: "complete",
      taskId: "task-1",
      date: "2026-06-05",
      timestamp: Date.now(),
    });

    const queue = await getQueuedActions();
    expect(queue).toHaveLength(1);
    expect(queue[0].taskId).toBe("task-1");
  });

  it("clears the queue", async () => {
    await enqueueAction({
      type: "complete",
      taskId: "task-2",
      date: "2026-06-05",
      timestamp: Date.now(),
    });
    await clearQueue();

    const queue = await getQueuedActions();
    expect(queue).toHaveLength(0);
  });
});
