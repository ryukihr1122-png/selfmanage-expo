/**
 * ローカル SQLite リポジトリ
 *
 * 旧 lib/api.ts のサーバー呼び出しをすべて置き換える。
 * 全データがデバイス内 SQLite で完結する。
 */

import * as SQLite from "expo-sqlite";
import { migrateIfNeeded } from "./schema";

// ─── 型定義 ──────────────────────────────────────────────────────

export interface Profile {
  displayName: string;
  totalXp: number;
  level: number;
  points: number;
  streakDays: number;
  lastQualifiedDate: string | null;
  activeTitle: string | null;
}

export interface DailyTask {
  id: string;
  taskDate: string;
  title: string;
  description: string | null;
  category: string;
  rewardXp: number;
  isCompleted: boolean;
  isBonus: boolean;
  completedAt: string | null;
  source: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rewardXp: number;
  schedule: string;
  customDays: number[];
  isActive: boolean;
  createdAt: string;
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

export interface LoginBonusResult {
  alreadyClaimed: boolean;
  ptAwarded: number;
  consecutiveDays: number;
  totalPoints: number;
}

export interface HistoryDay {
  date: string;
  completedCount: number;
  xpEarned: number;
  ptEarned: number;
}

export interface OnboardingAnswers {
  wellnessHabits: string[];
  actionHabits: string[];
  knowledgeHabits: string[];
  purposeHabits: string[];
  [key: string]: unknown;
}

// ─── DB初期化 ─────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("selfmanage.db");
  await migrateIfNeeded(_db);
  return _db;
}

// ─── ヘルパー ─────────────────────────────────────────────────────

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── プロフィール ─────────────────────────────────────────────────

export async function getProfile(): Promise<Profile> {
  const db = await getDB();
  const row = await db.getFirstAsync<{
    display_name: string;
    total_xp: number;
    level: number;
    points: number;
    streak_days: number;
    last_qualified_date: string | null;
    active_title: string | null;
  }>("SELECT * FROM profile WHERE id = 1");

  return {
    displayName: row?.display_name ?? "冒険者",
    totalXp: row?.total_xp ?? 0,
    level: row?.level ?? 1,
    points: row?.points ?? 0,
    streakDays: row?.streak_days ?? 0,
    lastQualifiedDate: row?.last_qualified_date ?? null,
    activeTitle: row?.active_title ?? null,
  };
}

export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  const db = await getDB();
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];

  if (updates.displayName !== undefined) { sets.push("display_name = ?"); vals.push(updates.displayName); }
  if (updates.totalXp !== undefined) { sets.push("total_xp = ?"); vals.push(updates.totalXp); }
  if (updates.level !== undefined) { sets.push("level = ?"); vals.push(updates.level); }
  if (updates.points !== undefined) { sets.push("points = ?"); vals.push(updates.points); }
  if (updates.streakDays !== undefined) { sets.push("streak_days = ?"); vals.push(updates.streakDays); }
  if (updates.lastQualifiedDate !== undefined) { sets.push("last_qualified_date = ?"); vals.push(updates.lastQualifiedDate); }
  if (updates.activeTitle !== undefined) { sets.push("active_title = ?"); vals.push(updates.activeTitle); }

  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now','localtime')");

  await db.runAsync(`UPDATE profile SET ${sets.join(", ")} WHERE id = 1`, ...vals);
}

// ─── オンボーディング ─────────────────────────────────────────────

export async function getOnboarding(): Promise<OnboardingAnswers> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ answers_json: string }>(
    "SELECT answers_json FROM onboarding WHERE id = 1",
  );
  return row ? JSON.parse(row.answers_json) : { wellnessHabits: [], actionHabits: [], knowledgeHabits: [], purposeHabits: [] };
}

export async function saveOnboarding(answers: OnboardingAnswers): Promise<void> {
  const db = await getDB();

  await db.withExclusiveTransactionAsync(async (txn) => {
    // オンボーディング保存
    await txn.runAsync(
      "UPDATE onboarding SET answers_json = ?, updated_at = datetime('now','localtime') WHERE id = 1",
      JSON.stringify(answers),
    );

    // 既存の繰り返しタスクをクリア → 再登録
    await txn.runAsync("DELETE FROM recurring_tasks");

    const categoryMap: Record<string, string> = {
      wellnessHabits: "wellness",
      actionHabits: "action",
      knowledgeHabits: "knowledge",
      purposeHabits: "purpose",
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      const habits = answers[key];
      if (Array.isArray(habits)) {
        for (const title of habits) {
          if (typeof title === "string" && title.trim()) {
            await txn.runAsync(
              `INSERT INTO recurring_tasks (id, title, category, reward_xp, schedule)
               VALUES (?, ?, ?, 10, 'daily')`,
              generateId(), title.trim(), category,
            );
          }
        }
      }
    }
  });

  // 今日のタスクを即時展開
  await expandTodayTasks();
}

// ─── 繰り返しタスク ───────────────────────────────────────────────

export async function getRecurringTasks(): Promise<RecurringTask[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; title: string; description: string | null;
    category: string; reward_xp: number; schedule: string;
    custom_days: string; is_active: number; created_at: string;
  }>("SELECT * FROM recurring_tasks WHERE is_active = 1 ORDER BY created_at");

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    rewardXp: r.reward_xp,
    schedule: r.schedule,
    customDays: JSON.parse(r.custom_days),
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  }));
}

export async function createRecurringTask(data: {
  title: string;
  description?: string;
  category: string;
  rewardXp: number;
  schedule: string;
  customDays?: number[];
}): Promise<RecurringTask> {
  const db = await getDB();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO recurring_tasks (id, title, description, category, reward_xp, schedule, custom_days)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.title, data.description ?? null, data.category, data.rewardXp, data.schedule, JSON.stringify(data.customDays ?? []),
  );
  // 今日のタスクにも追加
  await expandTodayTasks();
  return { id, ...data, description: data.description ?? null, customDays: data.customDays ?? [], isActive: true, createdAt: todayLocal() };
}

export async function deleteRecurringTask(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM recurring_tasks WHERE id = ?", id);
}

// ─── デイリータスク展開 ───────────────────────────────────────────

export async function expandTodayTasks(): Promise<void> {
  const db = await getDB();
  const today = todayLocal();
  const dayOfWeek = new Date().getDay(); // 0=Sun

  const recurring = await db.getAllAsync<{
    id: string; title: string; description: string | null;
    category: string; reward_xp: number; schedule: string;
    custom_days: string;
  }>("SELECT * FROM recurring_tasks WHERE is_active = 1");

  for (const rt of recurring) {
    if (!shouldRunToday(rt.schedule, JSON.parse(rt.custom_days), dayOfWeek)) continue;

    await db.runAsync(
      `INSERT OR IGNORE INTO daily_tasks (id, task_date, title, description, category, reward_xp, source)
       VALUES (?, ?, ?, ?, ?, ?, 'recurring')`,
      generateId(), today, rt.title, rt.description, rt.category, rt.reward_xp,
    );
  }

  // デイリーチャレンジ生成
  await generateDailyChallenge(today);
}

function shouldRunToday(schedule: string, customDays: number[], dayOfWeek: number): boolean {
  switch (schedule) {
    case "daily": return true;
    case "weekdays": return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends": return dayOfWeek === 0 || dayOfWeek === 6;
    case "custom": return customDays.includes(dayOfWeek);
    default: return true;
  }
}

// ─── デイリータスク CRUD ──────────────────────────────────────────

export async function getTodayTasks(): Promise<DailyTask[]> {
  const db = await getDB();
  const today = todayLocal();
  const rows = await db.getAllAsync<{
    id: string; task_date: string; title: string; description: string | null;
    category: string; reward_xp: number; is_completed: number; is_bonus: number;
    completed_at: string | null; source: string;
  }>("SELECT * FROM daily_tasks WHERE task_date = ? ORDER BY is_bonus, created_at", today);

  return rows.map((r) => ({
    id: r.id,
    taskDate: r.task_date,
    title: r.title,
    description: r.description,
    category: r.category,
    rewardXp: r.reward_xp,
    isCompleted: r.is_completed === 1,
    isBonus: r.is_bonus === 1,
    completedAt: r.completed_at,
    source: r.source,
  }));
}

export async function createTask(data: {
  title: string;
  description?: string;
  category: string;
  rewardXp: number;
}): Promise<DailyTask> {
  const db = await getDB();
  const id = generateId();
  const today = todayLocal();
  await db.runAsync(
    `INSERT INTO daily_tasks (id, task_date, title, description, category, reward_xp, source)
     VALUES (?, ?, ?, ?, ?, ?, 'user')`,
    id, today, data.title, data.description ?? null, data.category, data.rewardXp,
  );
  return {
    id, taskDate: today, title: data.title, description: data.description ?? null,
    category: data.category, rewardXp: data.rewardXp, isCompleted: false, isBonus: false,
    completedAt: null, source: "user",
  };
}

export async function completeTask(taskId: string): Promise<{ xpDelta: number; ptDelta: number; streakDays: number }> {
  const db = await getDB();
  const now = new Date().toISOString();

  const task = await db.getFirstAsync<{ reward_xp: number; is_completed: number }>(
    "SELECT reward_xp, is_completed FROM daily_tasks WHERE id = ?", taskId,
  );
  if (!task || task.is_completed === 1) throw new Error("タスクが見つかりません");

  const xpDelta = task.reward_xp;
  const ptDelta = Math.ceil(xpDelta * 0.3); // XPの30%をPtに

  await db.withExclusiveTransactionAsync(async (txn) => {
    // タスク完了
    await txn.runAsync(
      "UPDATE daily_tasks SET is_completed = 1, completed_at = ? WHERE id = ?",
      now, taskId,
    );
    // イベントログ
    await txn.runAsync(
      "INSERT INTO task_events (id, daily_task_id, event_type, xp_delta, pt_delta) VALUES (?, ?, 'COMPLETE', ?, ?)",
      generateId(), taskId, xpDelta, ptDelta,
    );
    // Ptログ
    await txn.runAsync(
      "INSERT INTO pt_events (id, pt_delta, reason, ref_id) VALUES (?, ?, 'task_earn', ?)",
      generateId(), ptDelta, taskId,
    );
    // プロフィール更新
    await txn.runAsync(
      `UPDATE profile SET
         total_xp = total_xp + ?,
         level = (total_xp + ?) / 100 + 1,
         points = points + ?,
         updated_at = datetime('now','localtime')
       WHERE id = 1`,
      xpDelta, xpDelta, ptDelta,
    );
  });

  // ストリーク更新
  const streakDays = await updateStreak();

  return { xpDelta, ptDelta, streakDays };
}

export async function undoTask(taskId: string): Promise<{ xpDelta: number }> {
  const db = await getDB();
  const task = await db.getFirstAsync<{ reward_xp: number; is_completed: number }>(
    "SELECT reward_xp, is_completed FROM daily_tasks WHERE id = ?", taskId,
  );
  if (!task || task.is_completed === 0) throw new Error("タスクが見つかりません");

  const xpDelta = -task.reward_xp;
  const ptDelta = -Math.ceil(task.reward_xp * 0.3);

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      "UPDATE daily_tasks SET is_completed = 0, completed_at = NULL WHERE id = ?",
      taskId,
    );
    await txn.runAsync(
      "INSERT INTO task_events (id, daily_task_id, event_type, xp_delta, pt_delta) VALUES (?, ?, 'UNDO_COMPLETE', ?, ?)",
      generateId(), taskId, xpDelta, ptDelta,
    );
    await txn.runAsync(
      `UPDATE profile SET
         total_xp = MAX(0, total_xp + ?),
         level = MAX(1, (MAX(0, total_xp + ?)) / 100 + 1),
         points = MAX(0, points + ?),
         updated_at = datetime('now','localtime')
       WHERE id = 1`,
      xpDelta, xpDelta, ptDelta,
    );
  });

  return { xpDelta };
}

// ─── ストリーク ───────────────────────────────────────────────────

async function updateStreak(): Promise<number> {
  const db = await getDB();
  const today = todayLocal();
  const profile = await db.getFirstAsync<{
    streak_days: number; last_qualified_date: string | null;
  }>("SELECT streak_days, last_qualified_date FROM profile WHERE id = 1");

  if (!profile) return 0;

  // 今日のタスク達成率チェック（50%以上で「達成日」）
  const stats = await db.getFirstAsync<{ total: number; completed: number }>(
    "SELECT COUNT(*) as total, SUM(is_completed) as completed FROM daily_tasks WHERE task_date = ?",
    today,
  );

  const rate = (stats?.total ?? 0) > 0 ? (stats?.completed ?? 0) / stats!.total : 0;
  if (rate < 0.5) return profile.streak_days;

  let newStreak = profile.streak_days;
  const lastDate = profile.last_qualified_date;

  if (lastDate === today) {
    // 今日すでにカウント済み
    return newStreak;
  }

  if (lastDate) {
    const lastD = new Date(lastDate);
    const todayD = new Date(today);
    const diffDays = Math.floor((todayD.getTime() - lastD.getTime()) / (86400000));

    if (diffDays === 1) {
      newStreak += 1; // 連続
    } else {
      newStreak = 1; // リセット
    }
  } else {
    newStreak = 1; // 初回
  }

  await db.runAsync(
    "UPDATE profile SET streak_days = ?, last_qualified_date = ?, updated_at = datetime('now','localtime') WHERE id = 1",
    newStreak, today,
  );

  return newStreak;
}

// ─── タスク履歴 ───────────────────────────────────────────────────

export async function getTaskHistory(days: number = 14): Promise<HistoryDay[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    task_date: string; completed_count: number; xp_earned: number; pt_earned: number;
  }>(`
    SELECT
      task_date,
      SUM(is_completed) as completed_count,
      COALESCE((SELECT SUM(xp_delta) FROM task_events WHERE daily_task_id IN
        (SELECT id FROM daily_tasks dt2 WHERE dt2.task_date = daily_tasks.task_date) AND event_type = 'COMPLETE'), 0) as xp_earned,
      COALESCE((SELECT SUM(pt_delta) FROM task_events WHERE daily_task_id IN
        (SELECT id FROM daily_tasks dt2 WHERE dt2.task_date = daily_tasks.task_date) AND event_type = 'COMPLETE'), 0) as pt_earned
    FROM daily_tasks
    GROUP BY task_date
    ORDER BY task_date DESC
    LIMIT ?
  `, days);

  return rows.map((r) => ({
    date: r.task_date,
    completedCount: r.completed_count,
    xpEarned: r.xp_earned,
    ptEarned: r.pt_earned,
  }));
}

// ─── ログインボーナス ─────────────────────────────────────────────

export async function claimLoginBonus(): Promise<LoginBonusResult> {
  const db = await getDB();
  const today = todayLocal();

  // 既に取得済みか
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM login_bonuses WHERE claimed_date = ?", today,
  );
  if (existing) {
    const profile = await getProfile();
    return { alreadyClaimed: true, ptAwarded: 0, consecutiveDays: profile.streakDays, totalPoints: profile.points };
  }

  // 昨日のレコードから連続日数を計算
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const prev = await db.getFirstAsync<{ consecutive_days: number }>(
    "SELECT consecutive_days FROM login_bonuses WHERE claimed_date = ?", yesterdayStr,
  );
  const consecutiveDays = (prev?.consecutive_days ?? 0) + 1;

  // Pt計算
  let ptAwarded: number;
  if (consecutiveDays >= 30) ptAwarded = 200;
  else if (consecutiveDays >= 14) ptAwarded = 50;
  else if (consecutiveDays >= 7) ptAwarded = 25;
  else if (consecutiveDays >= 3) ptAwarded = 12;
  else if (consecutiveDays >= 2) ptAwarded = 8;
  else ptAwarded = 5;

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      "INSERT INTO login_bonuses (id, claimed_date, consecutive_days, pt_awarded) VALUES (?, ?, ?, ?)",
      generateId(), today, consecutiveDays, ptAwarded,
    );
    await txn.runAsync(
      "INSERT INTO pt_events (id, pt_delta, reason) VALUES (?, ?, 'login_bonus')",
      generateId(), ptAwarded,
    );
    await txn.runAsync(
      "UPDATE profile SET points = points + ?, updated_at = datetime('now','localtime') WHERE id = 1",
      ptAwarded,
    );
  });

  const profile = await getProfile();
  return { alreadyClaimed: false, ptAwarded, consecutiveDays, totalPoints: profile.points };
}

// ─── 広告リワード ─────────────────────────────────────────────────

const BONUS_TASKS = [
  { title: "深呼吸を5回する", category: "wellness", xp: 15 },
  { title: "窓の外を1分眺める", category: "wellness", xp: 10 },
  { title: "好きな音楽を1曲聴く", category: "purpose", xp: 10 },
  { title: "机の上を片付ける", category: "action", xp: 15 },
  { title: "水をコップ1杯飲む", category: "wellness", xp: 10 },
  { title: "今日学んだことを1つ書く", category: "knowledge", xp: 15 },
  { title: "姿勢を正す", category: "wellness", xp: 10 },
  { title: "5分間瞑想する", category: "wellness", xp: 20 },
  { title: "今日の目標を確認する", category: "purpose", xp: 10 },
  { title: "ニュース記事を1本読む", category: "knowledge", xp: 15 },
];

export async function claimAdRewardTask(): Promise<{ task: DailyTask; remainingToday: number }> {
  const db = await getDB();
  const today = todayLocal();

  // 1日3回上限チェック
  const countRow = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM ad_reward_logs WHERE reward_date = ?", today,
  );
  const used = countRow?.cnt ?? 0;
  if (used >= 3) throw new Error("本日の広告視聴上限に達しました");

  // ランダムタスク選択
  const bonus = BONUS_TASKS[Math.floor(Math.random() * BONUS_TASKS.length)];
  const taskId = generateId();
  const bonusXp = Math.round(bonus.xp * 1.5); // 広告ボーナスは1.5倍

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO daily_tasks (id, task_date, title, category, reward_xp, is_bonus, source)
       VALUES (?, ?, ?, ?, ?, 1, 'ad_reward')`,
      taskId, today, bonus.title, bonus.category, bonusXp,
    );
    await txn.runAsync(
      "INSERT INTO ad_reward_logs (id, reward_date, daily_task_id) VALUES (?, ?, ?)",
      generateId(), today, taskId,
    );
  });

  const task: DailyTask = {
    id: taskId, taskDate: today, title: bonus.title, description: null,
    category: bonus.category, rewardXp: bonusXp, isCompleted: false, isBonus: true,
    completedAt: null, source: "ad_reward",
  };

  return { task, remainingToday: 3 - used - 1 };
}

export async function getAdRewardRemaining(): Promise<number> {
  const db = await getDB();
  const today = todayLocal();
  const row = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM ad_reward_logs WHERE reward_date = ?", today,
  );
  return 3 - (row?.cnt ?? 0);
}

// ─── デイリーチャレンジ ───────────────────────────────────────────

const CHALLENGE_TYPES = ["complete_3", "all_categories", "streak_keep", "bonus_complete"] as const;

async function generateDailyChallenge(date: string): Promise<void> {
  const db = await getDB();
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM daily_challenges WHERE challenge_date = ?", date,
  );
  if (existing) return;

  const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
  await db.runAsync(
    "INSERT INTO daily_challenges (id, challenge_date, challenge_type, bonus_xp) VALUES (?, ?, ?, 25)",
    generateId(), date, type,
  );
}

export async function getDailyChallenge(): Promise<{ challengeType: string; isCompleted: boolean; bonusXp: number } | null> {
  const db = await getDB();
  const today = todayLocal();
  const row = await db.getFirstAsync<{
    challenge_type: string; is_completed: number; bonus_xp: number;
  }>("SELECT challenge_type, is_completed, bonus_xp FROM daily_challenges WHERE challenge_date = ?", today);
  if (!row) return null;
  return { challengeType: row.challenge_type, isCompleted: row.is_completed === 1, bonusXp: row.bonus_xp };
}

// ─── ショップ ─────────────────────────────────────────────────────

export async function getShopItems(): Promise<ShopItem[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; name: string; description: string | null; item_type: string;
    slot: string | null; icon_emoji: string; effect_json: string; cost_pt: number;
    user_item_id: string | null; is_equipped: number | null;
  }>(`
    SELECT i.*, ui.id as user_item_id, ui.is_equipped
    FROM items i
    LEFT JOIN user_items ui ON ui.item_id = i.id
    ORDER BY i.sort_order
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    itemType: r.item_type,
    slot: r.slot,
    iconEmoji: r.icon_emoji,
    effectJson: JSON.parse(r.effect_json),
    costPt: r.cost_pt,
    owned: r.user_item_id !== null,
    equipped: r.is_equipped === 1,
  }));
}

export async function purchaseItem(itemId: string): Promise<{ pointsRemaining: number }> {
  const db = await getDB();

  const item = await db.getFirstAsync<{ cost_pt: number }>(
    "SELECT cost_pt FROM items WHERE id = ?", itemId,
  );
  if (!item) throw new Error("アイテムが見つかりません");

  const profile = await getProfile();
  if (profile.points < item.cost_pt) throw new Error("ポイントが足りません");

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      "INSERT OR IGNORE INTO user_items (id, item_id) VALUES (?, ?)",
      generateId(), itemId,
    );
    await txn.runAsync(
      "UPDATE profile SET points = points - ?, updated_at = datetime('now','localtime') WHERE id = 1",
      item.cost_pt,
    );
    await txn.runAsync(
      "INSERT INTO pt_events (id, pt_delta, reason, ref_id) VALUES (?, ?, 'item_purchase', ?)",
      generateId(), -item.cost_pt, itemId,
    );
  });

  const updated = await getProfile();
  return { pointsRemaining: updated.points };
}

// ─── アイテム・装備 ───────────────────────────────────────────────

export async function getMyItems(): Promise<UserItem[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    ui_id: string; item_id: string; name: string; description: string | null;
    item_type: string; slot: string | null; icon_emoji: string; effect_json: string;
    quantity: number; is_equipped: number;
  }>(`
    SELECT ui.id as ui_id, i.id as item_id, i.name, i.description, i.item_type,
           i.slot, i.icon_emoji, i.effect_json, ui.quantity, ui.is_equipped
    FROM user_items ui
    JOIN items i ON i.id = ui.item_id
    ORDER BY i.sort_order
  `);

  return rows.map((r) => ({
    userItemId: r.ui_id,
    itemId: r.item_id,
    name: r.name,
    description: r.description,
    itemType: r.item_type,
    slot: r.slot,
    iconEmoji: r.icon_emoji,
    effectJson: JSON.parse(r.effect_json),
    quantity: r.quantity,
    isEquipped: r.is_equipped === 1,
  }));
}

export async function equipItem(userItemId: string): Promise<void> {
  const db = await getDB();
  const item = await db.getFirstAsync<{ item_id: string }>(
    "SELECT item_id FROM user_items WHERE id = ?", userItemId,
  );
  if (!item) throw new Error("アイテムが見つかりません");

  const master = await db.getFirstAsync<{ slot: string | null }>(
    "SELECT slot FROM items WHERE id = ?", item.item_id,
  );
  if (!master?.slot) throw new Error("装備できないアイテムです");

  // 同スロットの既存装備を外す
  await db.runAsync(
    `UPDATE user_items SET is_equipped = 0
     WHERE is_equipped = 1 AND item_id IN (SELECT id FROM items WHERE slot = ?)`,
    master.slot,
  );
  // 装備
  await db.runAsync("UPDATE user_items SET is_equipped = 1 WHERE id = ?", userItemId);
}

export async function unequipItem(userItemId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("UPDATE user_items SET is_equipped = 0 WHERE id = ?", userItemId);
}

// ─── データエクスポート/インポート（バックアップ用） ─────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  profile: Profile;
  onboarding: OnboardingAnswers;
  recurringTasks: RecurringTask[];
  dailyTasks: DailyTask[];
  loginBonuses: Array<{ claimedDate: string; consecutiveDays: number; ptAwarded: number }>;
  userItems: Array<{ itemId: string; quantity: number; isEquipped: boolean }>;
  userTitles: Array<{ titleKey: string; isActive: boolean }>;
}

export async function exportAllData(): Promise<BackupData> {
  const db = await getDB();
  const profile = await getProfile();
  const onboarding = await getOnboarding();
  const recurring = await getRecurringTasks();
  const tasks = await db.getAllAsync<{
    id: string; task_date: string; title: string; description: string | null;
    category: string; reward_xp: number; is_completed: number; is_bonus: number;
    completed_at: string | null; source: string;
  }>("SELECT * FROM daily_tasks ORDER BY task_date DESC LIMIT 365");
  const bonuses = await db.getAllAsync<{
    claimed_date: string; consecutive_days: number; pt_awarded: number;
  }>("SELECT claimed_date, consecutive_days, pt_awarded FROM login_bonuses ORDER BY claimed_date DESC");
  const items = await db.getAllAsync<{
    item_id: string; quantity: number; is_equipped: number;
  }>("SELECT item_id, quantity, is_equipped FROM user_items");
  const titles = await db.getAllAsync<{
    title_key: string; is_active: number;
  }>("SELECT title_key, is_active FROM user_titles");

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    onboarding,
    recurringTasks: recurring,
    dailyTasks: tasks.map((t) => ({
      id: t.id, taskDate: t.task_date, title: t.title, description: t.description,
      category: t.category, rewardXp: t.reward_xp, isCompleted: t.is_completed === 1,
      isBonus: t.is_bonus === 1, completedAt: t.completed_at, source: t.source,
    })),
    loginBonuses: bonuses.map((b) => ({
      claimedDate: b.claimed_date, consecutiveDays: b.consecutive_days, ptAwarded: b.pt_awarded,
    })),
    userItems: items.map((i) => ({
      itemId: i.item_id, quantity: i.quantity, isEquipped: i.is_equipped === 1,
    })),
    userTitles: titles.map((t) => ({
      titleKey: t.title_key, isActive: t.is_active === 1,
    })),
  };
}

export async function importAllData(backup: BackupData): Promise<void> {
  const db = await getDB();

  await db.withExclusiveTransactionAsync(async (txn) => {
    // 全テーブルクリア
    await txn.execAsync(`
      DELETE FROM task_events;
      DELETE FROM daily_tasks;
      DELETE FROM recurring_tasks;
      DELETE FROM login_bonuses;
      DELETE FROM ad_reward_logs;
      DELETE FROM daily_challenges;
      DELETE FROM user_items;
      DELETE FROM user_titles;
      DELETE FROM pt_events;
    `);

    // プロフィール復元
    await txn.runAsync(
      `UPDATE profile SET
         display_name = ?, total_xp = ?, level = ?, points = ?,
         streak_days = ?, last_qualified_date = ?, active_title = ?,
         updated_at = datetime('now','localtime')
       WHERE id = 1`,
      backup.profile.displayName, backup.profile.totalXp, backup.profile.level,
      backup.profile.points, backup.profile.streakDays,
      backup.profile.lastQualifiedDate, backup.profile.activeTitle,
    );

    // オンボーディング復元
    await txn.runAsync(
      "UPDATE onboarding SET answers_json = ?, updated_at = datetime('now','localtime') WHERE id = 1",
      JSON.stringify(backup.onboarding),
    );

    // 繰り返しタスク復元
    for (const rt of backup.recurringTasks) {
      await txn.runAsync(
        `INSERT INTO recurring_tasks (id, title, description, category, reward_xp, schedule, custom_days, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rt.id, rt.title, rt.description, rt.category, rt.rewardXp,
        rt.schedule, JSON.stringify(rt.customDays), rt.isActive ? 1 : 0, rt.createdAt,
      );
    }

    // デイリータスク復元
    for (const t of backup.dailyTasks) {
      await txn.runAsync(
        `INSERT OR IGNORE INTO daily_tasks (id, task_date, title, description, category, reward_xp, is_completed, is_bonus, completed_at, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t.id, t.taskDate, t.title, t.description, t.category, t.rewardXp,
        t.isCompleted ? 1 : 0, t.isBonus ? 1 : 0, t.completedAt, t.source,
      );
    }

    // ログインボーナス復元
    for (const b of backup.loginBonuses) {
      await txn.runAsync(
        "INSERT OR IGNORE INTO login_bonuses (id, claimed_date, consecutive_days, pt_awarded) VALUES (?, ?, ?, ?)",
        generateId(), b.claimedDate, b.consecutiveDays, b.ptAwarded,
      );
    }

    // 所持アイテム復元
    for (const i of backup.userItems) {
      await txn.runAsync(
        "INSERT OR IGNORE INTO user_items (id, item_id, quantity, is_equipped) VALUES (?, ?, ?, ?)",
        generateId(), i.itemId, i.quantity, i.isEquipped ? 1 : 0,
      );
    }

    // 称号復元
    for (const t of backup.userTitles) {
      await txn.runAsync(
        "INSERT OR IGNORE INTO user_titles (id, title_key, is_active) VALUES (?, ?, ?)",
        generateId(), t.titleKey, t.isActive ? 1 : 0,
      );
    }
  });
}
