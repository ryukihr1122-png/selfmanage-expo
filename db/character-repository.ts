/**
 * キャラクター育成システム用リポジトリ
 *
 * v2で追加されたテーブルに対するCRUD操作。
 */

import { getDB, generateId, todayLocal, type Profile } from "./repository";

// ─── 型定義 ──────────────────────────────────────────────────────

export interface Genre {
  id: string;
  name: string;
  description: string | null;
  iconEmoji: string;
  themeColor: string;
  sortOrder: number;
}

export interface CharacterDef {
  id: string;
  genreId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export interface UserCharacter {
  id: string;
  characterId: string;
  genreId: string;
  nickname: string | null;
  currentXp: number;
  level: number;
  stage: number;
  stageName: string;
  skinId: string | null;
  isActive: boolean;
  // joined data
  characterName: string;
  genreName: string;
  iconEmoji: string;
  themeColor: string;
}

export interface GenreTask {
  id: string;
  genreId: string;
  title: string;
  description: string | null;
  baseXp: number;
  sortOrder: number;
}

export interface TaskLevel {
  id: string;
  genreTaskId: string;
  level: number;
  label: string;
  description: string | null;
  xpMultiplier: number;
  requiredCompletions: number;
}

export interface UserTask {
  id: string;
  userCharacterId: string;
  genreTaskId: string;
  currentLevel: number;
  totalCompletions: number;
  isActive: boolean;
  // joined data
  taskTitle: string;
  currentLevelLabel: string;
  currentLevelDescription: string | null;
  rewardXp: number;
  nextLevelCompletions: number | null; // null = max level
  canUpgrade: boolean;
}

export interface DailyTaskV2 {
  id: string;
  userTaskId: string;
  userCharacterId: string;
  taskDate: string;
  title: string;
  levelLabel: string;
  rewardXp: number;
  isCompleted: boolean;
  completedAt: string | null;
  source: string;
  // joined
  characterName: string;
  iconEmoji: string;
  themeColor: string;
}

export interface PlayerUnlockStatus {
  currentLevel: number;
  maxCharacters: number;
  maxTasksPerChar: number;
  currentCharacterCount: number;
  canAddCharacter: boolean;
  nextCharacterUnlockLevel: number | null;
  nextTaskUnlockLevel: number | null;
}

export interface CompleteTaskResult {
  earnedXp: number;
  earnedPt: number;
  characterLevelUp: boolean;
  characterNewStage: string | null;
  playerLevelUp: boolean;
  playerNewUnlock: string | null;
  taskCanUpgrade: boolean;
}

// ─── ジャンル ─────────────────────────────────────────────────────

export async function getGenres(): Promise<Genre[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; name: string; description: string | null;
    icon_emoji: string; theme_color: string; sort_order: number;
  }>("SELECT * FROM genres ORDER BY sort_order");
  return rows.map((r) => ({
    id: r.id, name: r.name, description: r.description,
    iconEmoji: r.icon_emoji, themeColor: r.theme_color, sortOrder: r.sort_order,
  }));
}

// ─── キャラクターマスター ─────────────────────────────────────────

export async function getCharacterDefs(): Promise<CharacterDef[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; genre_id: string; name: string;
    description: string | null; is_default: number;
  }>("SELECT * FROM characters ORDER BY sort_order");
  return rows.map((r) => ({
    id: r.id, genreId: r.genre_id, name: r.name,
    description: r.description, isDefault: r.is_default === 1,
  }));
}

// ─── ユーザーキャラクター ─────────────────────────────────────────

export async function getUserCharacters(): Promise<UserCharacter[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; character_id: string; genre_id: string;
    nickname: string | null; current_xp: number; level: number;
    stage: number; skin_id: string | null; is_active: number;
    character_name: string; genre_name: string;
    icon_emoji: string; theme_color: string; stage_name: string;
  }>(`
    SELECT uc.*, c.name AS character_name, g.name AS genre_name,
           g.icon_emoji, g.theme_color,
           COALESCE(cs.stage_name, 'タマゴ') AS stage_name
    FROM user_characters uc
    JOIN characters c ON c.id = uc.character_id
    JOIN genres g ON g.id = uc.genre_id
    LEFT JOIN character_stages cs ON cs.stage = uc.stage
    WHERE uc.is_active = 1
    ORDER BY uc.unlocked_at
  `);
  return rows.map((r) => ({
    id: r.id, characterId: r.character_id, genreId: r.genre_id,
    nickname: r.nickname, currentXp: r.current_xp, level: r.level,
    stage: r.stage, stageName: r.stage_name, skinId: r.skin_id,
    isActive: r.is_active === 1,
    characterName: r.character_name, genreName: r.genre_name,
    iconEmoji: r.icon_emoji, themeColor: r.theme_color,
  }));
}

export async function unlockCharacter(
  characterId: string,
  genreId: string,
  nickname?: string,
): Promise<UserCharacter> {
  const db = await getDB();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO user_characters (id, character_id, genre_id, nickname)
     VALUES (?, ?, ?, ?)`,
    id, characterId, genreId, nickname ?? null,
  );
  const chars = await getUserCharacters();
  return chars.find((c) => c.id === id)!;
}

// ─── ジャンルタスク ───────────────────────────────────────────────

export async function getGenreTasks(genreId: string): Promise<GenreTask[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; genre_id: string; title: string;
    description: string | null; base_xp: number; sort_order: number;
  }>("SELECT * FROM genre_tasks WHERE genre_id = ? ORDER BY sort_order", genreId);
  return rows.map((r) => ({
    id: r.id, genreId: r.genre_id, title: r.title,
    description: r.description, baseXp: r.base_xp, sortOrder: r.sort_order,
  }));
}

export async function getTaskLevels(genreTaskId: string): Promise<TaskLevel[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; genre_task_id: string; level: number; label: string;
    description: string | null; xp_multiplier: number; required_completions: number;
  }>("SELECT * FROM task_levels WHERE genre_task_id = ? ORDER BY level", genreTaskId);
  return rows.map((r) => ({
    id: r.id, genreTaskId: r.genre_task_id, level: r.level,
    label: r.label, description: r.description,
    xpMultiplier: r.xp_multiplier, requiredCompletions: r.required_completions,
  }));
}

// ─── ユーザータスク（キャラに紐づく日課） ─────────────────────────

export async function getUserTasks(userCharacterId: string): Promise<UserTask[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; user_character_id: string; genre_task_id: string;
    current_level: number; total_completions: number; is_active: number;
    task_title: string; level_label: string; level_description: string | null;
    base_xp: number; xp_multiplier: number;
    next_required: number | null;
  }>(`
    SELECT ut.*,
           gt.title AS task_title,
           tl.label AS level_label,
           tl.description AS level_description,
           gt.base_xp,
           tl.xp_multiplier,
           tl_next.required_completions AS next_required
    FROM user_tasks ut
    JOIN genre_tasks gt ON gt.id = ut.genre_task_id
    JOIN task_levels tl ON tl.genre_task_id = ut.genre_task_id AND tl.level = ut.current_level
    LEFT JOIN task_levels tl_next ON tl_next.genre_task_id = ut.genre_task_id AND tl_next.level = ut.current_level + 1
    WHERE ut.user_character_id = ? AND ut.is_active = 1
    ORDER BY gt.sort_order
  `, userCharacterId);
  return rows.map((r) => ({
    id: r.id,
    userCharacterId: r.user_character_id,
    genreTaskId: r.genre_task_id,
    currentLevel: r.current_level,
    totalCompletions: r.total_completions,
    isActive: r.is_active === 1,
    taskTitle: r.task_title,
    currentLevelLabel: r.level_label,
    currentLevelDescription: r.level_description,
    rewardXp: Math.round(r.base_xp * r.xp_multiplier),
    nextLevelCompletions: r.next_required,
    canUpgrade: r.next_required !== null && r.total_completions >= r.next_required,
  }));
}

export async function addUserTask(
  userCharacterId: string,
  genreTaskId: string,
): Promise<void> {
  const db = await getDB();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO user_tasks (id, user_character_id, genre_task_id, current_level)
     VALUES (?, ?, ?, 1)`,
    id, userCharacterId, genreTaskId,
  );
}

export async function removeUserTask(userTaskId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    "UPDATE user_tasks SET is_active = 0 WHERE id = ?",
    userTaskId,
  );
}

export async function upgradeTaskLevel(userTaskId: string): Promise<boolean> {
  const db = await getDB();
  const ut = await db.getFirstAsync<{
    current_level: number; total_completions: number; genre_task_id: string;
  }>("SELECT current_level, total_completions, genre_task_id FROM user_tasks WHERE id = ?", userTaskId);
  if (!ut) return false;

  const nextLevel = ut.current_level + 1;
  const nextDef = await db.getFirstAsync<{ required_completions: number }>(
    "SELECT required_completions FROM task_levels WHERE genre_task_id = ? AND level = ?",
    ut.genre_task_id, nextLevel,
  );
  if (!nextDef) return false; // max level
  if (ut.total_completions < nextDef.required_completions) return false;

  await db.runAsync(
    "UPDATE user_tasks SET current_level = ? WHERE id = ?",
    nextLevel, userTaskId,
  );
  return true;
}

// ─── デイリータスク展開 ──────────────────────────────────────────

export async function expandTodayTasksV2(): Promise<void> {
  const db = await getDB();
  const today = todayLocal();

  // アクティブなユーザータスクをすべて取得
  const userTasks = await db.getAllAsync<{
    ut_id: string; user_character_id: string; genre_task_id: string;
    current_level: number; task_title: string; level_label: string;
    base_xp: number; xp_multiplier: number;
  }>(`
    SELECT ut.id AS ut_id, ut.user_character_id, ut.genre_task_id,
           ut.current_level, gt.title AS task_title,
           tl.label AS level_label, gt.base_xp, tl.xp_multiplier
    FROM user_tasks ut
    JOIN user_characters uc ON uc.id = ut.user_character_id
    JOIN genre_tasks gt ON gt.id = ut.genre_task_id
    JOIN task_levels tl ON tl.genre_task_id = ut.genre_task_id AND tl.level = ut.current_level
    WHERE ut.is_active = 1 AND uc.is_active = 1
  `);

  for (const ut of userTasks) {
    const existing = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM daily_tasks_v2 WHERE user_task_id = ? AND task_date = ?",
      ut.ut_id, today,
    );
    if (existing) continue;

    const rewardXp = Math.round(ut.base_xp * ut.xp_multiplier);
    await db.runAsync(
      `INSERT INTO daily_tasks_v2 (id, user_task_id, user_character_id, task_date, title, level_label, reward_xp, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'routine')`,
      generateId(), ut.ut_id, ut.user_character_id, today,
      ut.task_title, ut.level_label, rewardXp,
    );
  }
}

// ─── 今日のタスク取得 ────────────────────────────────────────────

export async function getTodayTasksV2(): Promise<DailyTaskV2[]> {
  const db = await getDB();
  const today = todayLocal();
  const rows = await db.getAllAsync<{
    id: string; user_task_id: string; user_character_id: string;
    task_date: string; title: string; level_label: string;
    reward_xp: number; is_completed: number; completed_at: string | null;
    source: string; character_name: string; icon_emoji: string; theme_color: string;
  }>(`
    SELECT dt.*, c.name AS character_name, g.icon_emoji, g.theme_color
    FROM daily_tasks_v2 dt
    JOIN user_characters uc ON uc.id = dt.user_character_id
    JOIN characters c ON c.id = uc.character_id
    JOIN genres g ON g.id = uc.genre_id
    WHERE dt.task_date = ?
    ORDER BY g.sort_order, dt.title
  `, today);
  return rows.map((r) => ({
    id: r.id, userTaskId: r.user_task_id, userCharacterId: r.user_character_id,
    taskDate: r.task_date, title: r.title, levelLabel: r.level_label,
    rewardXp: r.reward_xp, isCompleted: r.is_completed === 1,
    completedAt: r.completed_at, source: r.source,
    characterName: r.character_name, iconEmoji: r.icon_emoji, themeColor: r.theme_color,
  }));
}

// ─── タスク完了 ──────────────────────────────────────────────────

export async function completeTaskV2(dailyTaskId: string): Promise<CompleteTaskResult> {
  const db = await getDB();

  // 1. デイリータスクを完了に
  const dt = await db.getFirstAsync<{
    user_task_id: string; user_character_id: string; reward_xp: number; is_completed: number;
  }>("SELECT user_task_id, user_character_id, reward_xp, is_completed FROM daily_tasks_v2 WHERE id = ?", dailyTaskId);
  if (!dt || dt.is_completed) {
    return { earnedXp: 0, earnedPt: 0, characterLevelUp: false, characterNewStage: null, playerLevelUp: false, playerNewUnlock: null, taskCanUpgrade: false };
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  await db.runAsync(
    "UPDATE daily_tasks_v2 SET is_completed = 1, completed_at = ? WHERE id = ?",
    now, dailyTaskId,
  );

  const earnedXp = dt.reward_xp;
  const earnedPt = Math.floor(earnedXp * 0.5);

  // 2. キャラEXP加算
  const charBefore = await db.getFirstAsync<{ level: number; stage: number; current_xp: number }>(
    "SELECT level, stage, current_xp FROM user_characters WHERE id = ?", dt.user_character_id,
  );
  const newCharXp = (charBefore?.current_xp ?? 0) + earnedXp;
  const newCharLevel = Math.floor(newCharXp / 100);

  // 成長段階判定
  const stageRow = await db.getFirstAsync<{ stage: number; stage_name: string }>(
    "SELECT stage, stage_name FROM character_stages WHERE min_level <= ? ORDER BY min_level DESC LIMIT 1",
    newCharLevel,
  );
  const newStage = stageRow?.stage ?? 0;

  await db.runAsync(
    "UPDATE user_characters SET current_xp = ?, level = ?, stage = ? WHERE id = ?",
    newCharXp, newCharLevel, newStage, dt.user_character_id,
  );

  const characterLevelUp = newCharLevel > (charBefore?.level ?? 0);
  const characterNewStage = newStage > (charBefore?.stage ?? 0) ? (stageRow?.stage_name ?? null) : null;

  // 3. 本人EXP + Pt加算
  const profileBefore = await db.getFirstAsync<{ level: number; total_xp: number }>(
    "SELECT level, total_xp FROM profile WHERE id = 1",
  );
  const newTotalXp = (profileBefore?.total_xp ?? 0) + earnedXp;
  const newPlayerLevel = Math.floor(newTotalXp / 100);

  await db.runAsync(
    "UPDATE profile SET total_xp = ?, level = ?, points = points + ? WHERE id = 1",
    newTotalXp, newPlayerLevel, earnedPt,
  );

  const playerLevelUp = newPlayerLevel > (profileBefore?.level ?? 1);

  // 4. プレイヤーレベル解放チェック
  let playerNewUnlock: string | null = null;
  if (playerLevelUp) {
    const unlock = await db.getFirstAsync<{ unlock_label: string | null }>(
      "SELECT unlock_label FROM player_unlocks WHERE player_level = ?",
      newPlayerLevel,
    );
    playerNewUnlock = unlock?.unlock_label ?? null;
  }

  // 5. タスク完了カウント加算
  await db.runAsync(
    "UPDATE user_tasks SET total_completions = total_completions + 1 WHERE id = ?",
    dt.user_task_id,
  );

  // 6. タスクレベルアップ可能チェック
  const utAfter = await db.getFirstAsync<{ current_level: number; total_completions: number; genre_task_id: string }>(
    "SELECT current_level, total_completions, genre_task_id FROM user_tasks WHERE id = ?",
    dt.user_task_id,
  );
  let taskCanUpgrade = false;
  if (utAfter) {
    const nextDef = await db.getFirstAsync<{ required_completions: number }>(
      "SELECT required_completions FROM task_levels WHERE genre_task_id = ? AND level = ?",
      utAfter.genre_task_id, utAfter.current_level + 1,
    );
    taskCanUpgrade = nextDef !== null && utAfter.total_completions >= nextDef.required_completions;
  }

  // 7. ストリーク更新
  await updateStreak(db);

  return {
    earnedXp, earnedPt,
    characterLevelUp, characterNewStage,
    playerLevelUp, playerNewUnlock,
    taskCanUpgrade,
  };
}

// ─── タスク取消 ──────────────────────────────────────────────────

export async function undoTaskV2(dailyTaskId: string): Promise<void> {
  const db = await getDB();
  const dt = await db.getFirstAsync<{
    user_task_id: string; user_character_id: string; reward_xp: number; is_completed: number;
  }>("SELECT user_task_id, user_character_id, reward_xp, is_completed FROM daily_tasks_v2 WHERE id = ?", dailyTaskId);
  if (!dt || !dt.is_completed) return;

  const earnedXp = dt.reward_xp;
  const earnedPt = Math.floor(earnedXp * 0.5);

  // 完了フラグ戻す
  await db.runAsync("UPDATE daily_tasks_v2 SET is_completed = 0, completed_at = NULL WHERE id = ?", dailyTaskId);

  // キャラEXP減算
  await db.runAsync(
    "UPDATE user_characters SET current_xp = MAX(0, current_xp - ?), level = MAX(0, CAST((MAX(0, current_xp - ?) / 100) AS INTEGER)) WHERE id = ?",
    earnedXp, earnedXp, dt.user_character_id,
  );
  // stage再計算
  const charAfter = await db.getFirstAsync<{ level: number }>(
    "SELECT level FROM user_characters WHERE id = ?", dt.user_character_id,
  );
  if (charAfter) {
    const stageRow = await db.getFirstAsync<{ stage: number }>(
      "SELECT stage FROM character_stages WHERE min_level <= ? ORDER BY min_level DESC LIMIT 1",
      charAfter.level,
    );
    await db.runAsync("UPDATE user_characters SET stage = ? WHERE id = ?", stageRow?.stage ?? 0, dt.user_character_id);
  }

  // 本人EXP + Pt減算
  await db.runAsync(
    "UPDATE profile SET total_xp = MAX(0, total_xp - ?), level = MAX(1, CAST((MAX(0, total_xp - ?) / 100) AS INTEGER)), points = MAX(0, points - ?) WHERE id = 1",
    earnedXp, earnedXp, earnedPt,
  );

  // タスク完了カウント減算
  await db.runAsync(
    "UPDATE user_tasks SET total_completions = MAX(0, total_completions - 1) WHERE id = ?",
    dt.user_task_id,
  );
}

// ─── プレイヤー解放状況 ──────────────────────────────────────────

export async function getPlayerUnlockStatus(): Promise<PlayerUnlockStatus> {
  const db = await getDB();

  const profile = await db.getFirstAsync<{ level: number }>(
    "SELECT level FROM profile WHERE id = 1",
  );
  const currentLevel = profile?.level ?? 1;

  // 現在のレベルで有効な最大の解放条件
  const current = await db.getFirstAsync<{ max_characters: number; max_tasks_per_char: number }>(
    "SELECT max_characters, max_tasks_per_char FROM player_unlocks WHERE player_level <= ? ORDER BY player_level DESC LIMIT 1",
    currentLevel,
  );

  // 現在のキャラ数
  const charCount = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM user_characters WHERE is_active = 1",
  );

  // 次のキャラ解放レベル
  const nextCharUnlock = await db.getFirstAsync<{ player_level: number }>(
    "SELECT player_level FROM player_unlocks WHERE max_characters > ? AND player_level > ? ORDER BY player_level LIMIT 1",
    current?.max_characters ?? 1, currentLevel,
  );

  // 次のタスク枠解放レベル
  const nextTaskUnlock = await db.getFirstAsync<{ player_level: number }>(
    "SELECT player_level FROM player_unlocks WHERE max_tasks_per_char > ? AND player_level > ? ORDER BY player_level LIMIT 1",
    current?.max_tasks_per_char ?? 3, currentLevel,
  );

  return {
    currentLevel,
    maxCharacters: current?.max_characters ?? 1,
    maxTasksPerChar: current?.max_tasks_per_char ?? 3,
    currentCharacterCount: charCount?.cnt ?? 0,
    canAddCharacter: (charCount?.cnt ?? 0) < (current?.max_characters ?? 1),
    nextCharacterUnlockLevel: nextCharUnlock?.player_level ?? null,
    nextTaskUnlockLevel: nextTaskUnlock?.player_level ?? null,
  };
}

// ─── ストリーク更新（内部） ──────────────────────────────────────

async function updateStreak(db: import("expo-sqlite").SQLiteDatabase): Promise<void> {
  const today = todayLocal();

  // 今日の全タスクが完了しているか
  const stats = await db.getFirstAsync<{ total: number; completed: number }>(
    "SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed FROM daily_tasks_v2 WHERE task_date = ?",
    today,
  );

  if (!stats || stats.total === 0) return;

  // 全タスク完了 → ストリーク更新
  if (stats.completed >= stats.total) {
    const profile = await db.getFirstAsync<{ last_qualified_date: string | null; streak_days: number }>(
      "SELECT last_qualified_date, streak_days FROM profile WHERE id = 1",
    );

    if (profile?.last_qualified_date === today) return; // already counted

    // 昨日が前回のqualified dateなら連続
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const newStreak = profile?.last_qualified_date === yesterdayStr
      ? (profile?.streak_days ?? 0) + 1
      : 1;

    await db.runAsync(
      "UPDATE profile SET streak_days = ?, last_qualified_date = ? WHERE id = 1",
      newStreak, today,
    );
  }
}

// ─── 広告タスク（v2対応） ────────────────────────────────────────

export async function claimAdRewardTaskV2(userCharacterId: string): Promise<{ task: DailyTaskV2; remainingToday: number }> {
  const db = await getDB();
  const today = todayLocal();

  // 回数チェック
  const countRow = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM ad_reward_logs WHERE reward_date = ?", today,
  );
  const count = countRow?.cnt ?? 0;
  if (count >= 3) throw new Error("本日の広告視聴上限に達しました");

  // ボーナスタスク作成
  const taskId = generateId();
  await db.runAsync(
    `INSERT INTO daily_tasks_v2 (id, user_task_id, user_character_id, task_date, title, level_label, reward_xp, source)
     VALUES (?, 'ad_bonus', ?, ?, '🎬 ボーナスタスク', 'ボーナス', 15, 'ad_reward')`,
    taskId, userCharacterId, today,
  );

  await db.runAsync(
    "INSERT INTO ad_reward_logs (id, reward_date, daily_task_id) VALUES (?, ?, ?)",
    generateId(), today, taskId,
  );

  const tasks = await getTodayTasksV2();
  const task = tasks.find((t) => t.id === taskId)!;
  return { task, remainingToday: 3 - count - 1 };
}
