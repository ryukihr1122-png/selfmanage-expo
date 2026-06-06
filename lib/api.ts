/**
 * API client — Fastifyバックエンドとの通信
 */
import { API_BASE_URL } from "@/constants/api";
import { getToken, setToken, clearAllTokens } from "./storage";
import { setCachedMe, getCachedMe } from "./offline";

// ─── 型定義 ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  rewardXp: number;
  isBonus: boolean;
  isTutorial: boolean;
  batchSlot: string;
  chainGroupId: string | null;
  chainStep: number | null;
  isCompleted: boolean;
  latestEventAt: string | null;
}

export interface Stats {
  totalXp: number;
  level: number;
  streakDays: number;
  lastQualifiedDate: string | null;
  points: number;
  activeTitle: string | null;
}

export interface MeResponse {
  user: User;
  character: {
    id: string;
    name: string | null;
    appearance: Record<string, unknown>;
    params: Record<string, unknown>;
  } | null;
  stats: Stats;
  todayTasks: DailyTask[];
  online: string[];
}

export interface UserItem {
  userItemId: string;
  itemId: string;
  name: string;
  description: string | null;
  itemType: string;
  slot: string | null;
  iconEmoji: string;
  effectJson: Record<string, unknown>;
  quantity: number;
  isEquipped: boolean;
}

export interface OnboardingAnswers {
  wellnessHabits: string[];
  actionHabits: string[];
  knowledgeHabits: string[];
  purposeHabits: string[];
  [key: string]: unknown;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  itemType: string;
  slot: string | null;
  iconEmoji: string;
  effectJson: Record<string, unknown>;
  costPt: number;
  owned: boolean;
  equipped: boolean;
}

export interface FriendEntry {
  friendshipId: string;
  userId: string;
  displayName: string;
  level: number;
  streakDays: number;
  isOnline: boolean;
}

export interface HistoryDay {
  date: string;
  completedCount: number;
  xpEarned: number;
  ptEarned: number;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardXp: number;
  schedule: string; // "daily" | "weekdays" | "weekends" | "custom"
  customDays: number[]; // 0=Sun ... 6=Sat
  isActive: boolean;
  createdAt: string;
}

export interface LoginBonusResult {
  alreadyClaimed: boolean;
  ptAwarded: number;
  consecutiveDays: number;
  totalPoints: number;
}

// ─── HTTP クライアント ───────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    await clearAllTokens();
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

// ─── API メソッド ────────────────────────────────────────────────

export const api = {
  // Auth
  login: (email: string, password: string) =>
    post<{ token: string; user: User }>("/auth/login", { email, password }),

  register: (email: string, password: string, displayName: string) =>
    post<{ token: string; user: User }>("/auth/register", {
      email,
      password,
      displayName,
    }),

  // Me (with offline cache)
  getMe: async (): Promise<MeResponse> => {
    try {
      const data = await get<MeResponse>("/me");
      setCachedMe(data); // fire-and-forget cache
      return data;
    } catch (err) {
      // オフライン時はキャッシュから返す
      const cached = await getCachedMe<MeResponse>();
      if (cached) return cached;
      throw err;
    }
  },

  deleteAccount: () => del<{ message: string }>("/me"),

  completeTutorial: () =>
    post<{ titleKey: string; label: string }>("/me/complete-tutorial"),

  // Tasks
  getTodayTasks: () =>
    get<{ date: string; tasks: DailyTask[] }>(`/tasks?date=${todayJST()}`).then(
      (r) => r.tasks,
    ),

  completeTask: (taskId: string, date: string) =>
    post<{ event: { id: string; xpDelta: number; ptDelta: number; streakDays: number } }>(
      `/tasks/${taskId}/complete`,
      { performed_for_date: date },
    ),

  undoTask: (taskId: string) =>
    post<{ event: { id: string; xpDelta: number; undoOf: string } }>(
      `/tasks/${taskId}/undo`,
    ),

  getTaskHistory: (days = 14) =>
    get<{ history: HistoryDay[] }>(`/tasks/history?days=${days}`),

  bonusPurchase: () =>
    post<{ task: DailyTask; pointsRemaining: number; costPt: number }>(
      "/tasks/bonus-purchase",
    ),

  // Recurring Tasks (new)
  getRecurringTasks: () =>
    get<{ tasks: RecurringTask[] }>("/recurring-tasks"),

  createRecurringTask: (data: {
    title: string;
    description?: string;
    category: string;
    rewardXp: number;
    schedule: string;
    customDays?: number[];
  }) => post<{ task: RecurringTask }>("/recurring-tasks", data),

  updateRecurringTask: (id: string, data: Partial<RecurringTask>) =>
    put<{ task: RecurringTask }>(`/recurring-tasks/${id}`, data),

  deleteRecurringTask: (id: string) =>
    del<{ message: string }>(`/recurring-tasks/${id}`),

  // User tasks (one-off, user-created)
  createTask: (data: {
    title: string;
    description?: string;
    category: string;
    rewardXp: number;
    date?: string;
  }) => post<{ task: DailyTask }>("/tasks/create", data),

  // Recommend tasks
  getRecommendedTasks: () =>
    get<{ tasks: Array<{ id: string; title: string; description: string; rewardXp: number; tags: string[] }> }>(
      "/tasks/recommend",
    ),

  addRecommendedTask: (templateId: string) =>
    post<{ task: DailyTask }>("/tasks/recommend/add", { templateId }),

  // Ad reward task
  claimAdRewardTask: (adToken: string) =>
    post<{ task: DailyTask; remainingToday: number }>("/tasks/ad-reward", {
      adToken,
    }),

  // Login bonus
  claimLoginBonus: () =>
    post<LoginBonusResult>("/login-bonus"),

  // Onboarding
  getOnboarding: () =>
    get<{ id: string; answers: OnboardingAnswers; createdAt: string }>(
      "/onboarding",
    ),

  saveOnboarding: (answers: OnboardingAnswers) =>
    post<{ id: string; createdAt: string }>("/onboarding", { answers }),

  // Character
  getCharacter: () =>
    get<{ character: MeResponse["character"] }>("/character"),

  // Items
  getMyItems: () => get<{ items: UserItem[] }>("/items/mine"),

  equipItem: (userItemId: string) =>
    post<{ success: boolean }>(`/items/${userItemId}/equip`),

  unequipItem: (userItemId: string) =>
    post<{ success: boolean }>(`/items/${userItemId}/unequip`),

  // Shop
  getShopItems: () => get<{ items: ShopItem[] }>("/shop"),

  purchaseItem: (itemId: string) =>
    post<{ userItemId: string; pointsRemaining: number }>(`/shop/${itemId}/buy`),

  // Friends
  getFriends: () =>
    get<{ friends: FriendEntry[]; pendingReceived: FriendEntry[] }>("/friends"),

  searchUsers: (query: string) =>
    get<{ users: Array<{ id: string; displayName: string; level: number }> }>(
      `/friends/search?q=${encodeURIComponent(query)}`,
    ),

  sendFriendRequest: (userId: string) =>
    post<{ friendshipId: string }>("/friends/request", { addresseeId: userId }),

  acceptFriendRequest: (friendshipId: string) =>
    post<{ success: boolean }>(`/friends/${friendshipId}/accept`),

  rejectFriendRequest: (friendshipId: string) =>
    post<{ success: boolean }>(`/friends/${friendshipId}/reject`),

  shareTask: (friendUserId: string, taskId: string) =>
    post<{ success: boolean }>("/friends/share-task", {
      friendUserId,
      taskId,
    }),

  // Notifications
  getNotifications: () =>
    get<{ notifications: Array<{ id: string; title: string; body: string; type: string; isRead: boolean; metadata: Record<string, unknown>; createdAt: string }> }>(
      "/notifications",
    ),

  markNotificationRead: (id: string) =>
    post<{ success: boolean }>(`/notifications/${id}/read`),

  getUnreadCount: () =>
    get<{ count: number }>("/notifications/unread-count"),

  // Presence
  heartbeat: () => post<{ ok: boolean }>("/presence/heartbeat"),

  // Push notifications
  registerPushToken: (token: string) =>
    post<{ success: boolean }>("/push-token", { token }),
};

// ─── ヘルパー ────────────────────────────────────────────────────

function todayJST(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export { todayJST, ApiError };
