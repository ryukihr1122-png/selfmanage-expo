/**
 * ローカル SQLite スキーマ定義 & マイグレーション
 *
 * PRAGMA user_version でバージョン管理。
 * アプリ起動時に migrateIfNeeded() を呼ぶ。
 */

import type { SQLiteDatabase } from "expo-sqlite";

export const CURRENT_DB_VERSION = 1;

/**
 * マイグレーション実行
 */
export async function migrateIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= CURRENT_DB_VERSION) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    if (currentVersion < 1) {
      await applyV1(txn);
    }
    // if (currentVersion < 2) { await applyV2(txn); }
  });

  await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
}

// ─── V1: 初期スキーマ ─────────────────────────────────────────

async function applyV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- ─── プロフィール（シングルトン） ───
    CREATE TABLE IF NOT EXISTS profile (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL DEFAULT '冒険者',
      total_xp    INTEGER NOT NULL DEFAULT 0,
      level       INTEGER NOT NULL DEFAULT 1,
      points      INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_qualified_date TEXT,
      active_title TEXT,
      appearance_json TEXT NOT NULL DEFAULT '{}',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    INSERT OR IGNORE INTO profile (id) VALUES (1);

    -- ─── オンボーディング回答 ───
    CREATE TABLE IF NOT EXISTS onboarding (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      answers_json TEXT NOT NULL DEFAULT '{}',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    INSERT OR IGNORE INTO onboarding (id) VALUES (1);

    -- ─── 繰り返しタスク（習慣） ───
    CREATE TABLE IF NOT EXISTS recurring_tasks (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title       TEXT NOT NULL,
      description TEXT,
      category    TEXT NOT NULL DEFAULT 'wellness',
      reward_xp   INTEGER NOT NULL DEFAULT 10,
      schedule    TEXT NOT NULL DEFAULT 'daily',
      custom_days TEXT NOT NULL DEFAULT '[]',
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─── デイリータスク ───
    CREATE TABLE IF NOT EXISTS daily_tasks (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      task_date   TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      category    TEXT NOT NULL DEFAULT 'wellness',
      reward_xp   INTEGER NOT NULL DEFAULT 10,
      is_completed INTEGER NOT NULL DEFAULT 0,
      is_bonus    INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      source      TEXT NOT NULL DEFAULT 'recurring',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(task_date, title)
    );

    CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);

    -- ─── タスク完了イベントログ ───
    CREATE TABLE IF NOT EXISTS task_events (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      daily_task_id TEXT NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
      event_type  TEXT NOT NULL,
      xp_delta    INTEGER NOT NULL DEFAULT 0,
      pt_delta    INTEGER NOT NULL DEFAULT 0,
      logged_at   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_task_events_task ON task_events(daily_task_id);

    -- ─── ログインボーナス ───
    CREATE TABLE IF NOT EXISTS login_bonuses (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      claimed_date TEXT NOT NULL UNIQUE,
      consecutive_days INTEGER NOT NULL,
      pt_awarded  INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─── 広告リワードログ ───
    CREATE TABLE IF NOT EXISTS ad_reward_logs (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      reward_date TEXT NOT NULL,
      daily_task_id TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_ad_reward_date ON ad_reward_logs(reward_date);

    -- ─── デイリーチャレンジ ───
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      challenge_date TEXT NOT NULL UNIQUE,
      challenge_type TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      bonus_xp    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─── アイテムマスター（アプリ内蔵） ───
    CREATE TABLE IF NOT EXISTS items (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      item_type   TEXT NOT NULL,
      slot        TEXT,
      icon_emoji  TEXT NOT NULL,
      effect_json TEXT NOT NULL DEFAULT '{}',
      cost_pt     INTEGER NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    -- ─── 所持アイテム ───
    CREATE TABLE IF NOT EXISTS user_items (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      item_id     TEXT NOT NULL REFERENCES items(id),
      quantity    INTEGER NOT NULL DEFAULT 1,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      acquired_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(item_id)
    );

    -- ─── 称号 ───
    CREATE TABLE IF NOT EXISTS user_titles (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title_key   TEXT NOT NULL UNIQUE,
      is_active   INTEGER NOT NULL DEFAULT 0,
      earned_at   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─── Ptイベントログ ───
    CREATE TABLE IF NOT EXISTS pt_events (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      pt_delta    INTEGER NOT NULL,
      reason      TEXT NOT NULL,
      ref_id      TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);

  // 初期アイテムマスターデータを挿入
  await seedItems(db);
}

// ─── アイテムマスターシードデータ ──────────────────────────────

async function seedItems(db: SQLiteDatabase): Promise<void> {
  const items = [
    { id: "weapon_wooden_sword", name: "木の剣", description: "初心者の武器", item_type: "equipment", slot: "weapon", icon_emoji: "🗡️", effect_json: '{"xpBonus":0.05}', cost_pt: 50, sort_order: 1 },
    { id: "weapon_iron_sword", name: "鉄の剣", description: "頼れる相棒", item_type: "equipment", slot: "weapon", icon_emoji: "⚔️", effect_json: '{"xpBonus":0.1}', cost_pt: 150, sort_order: 2 },
    { id: "weapon_flame_sword", name: "炎の剣", description: "情熱が宿る剣", item_type: "equipment", slot: "weapon", icon_emoji: "🔥", effect_json: '{"xpBonus":0.15}', cost_pt: 400, sort_order: 3 },
    { id: "armor_leather", name: "革の鎧", description: "基本的な防具", item_type: "equipment", slot: "armor", icon_emoji: "🛡️", effect_json: '{"streakShield":1}', cost_pt: 80, sort_order: 10 },
    { id: "armor_iron", name: "鉄の鎧", description: "堅牢な鎧", item_type: "equipment", slot: "armor", icon_emoji: "🏛️", effect_json: '{"streakShield":2}', cost_pt: 250, sort_order: 11 },
    { id: "acc_ring_focus", name: "集中の指輪", description: "EXP+10%", item_type: "equipment", slot: "accessory", icon_emoji: "💍", effect_json: '{"xpBonus":0.1}', cost_pt: 200, sort_order: 20 },
    { id: "acc_amulet_luck", name: "幸運のアミュレット", description: "ボーナスタスク出現率UP", item_type: "equipment", slot: "accessory", icon_emoji: "🔮", effect_json: '{"bonusChance":0.1}', cost_pt: 300, sort_order: 21 },
    { id: "consumable_xp_potion", name: "経験値ポーション", description: "次のタスク完了時 EXP2倍", item_type: "consumable", slot: null, icon_emoji: "🧪", effect_json: '{"xpMultiplier":2,"duration":1}', cost_pt: 30, sort_order: 50 },
    { id: "consumable_streak_shield", name: "ストリークの盾", description: "1日ストリークを保護", item_type: "consumable", slot: null, icon_emoji: "🛡️", effect_json: '{"streakProtect":1}', cost_pt: 60, sort_order: 51 },
  ];

  for (const item of items) {
    await db.runAsync(
      `INSERT OR IGNORE INTO items (id, name, description, item_type, slot, icon_emoji, effect_json, cost_pt, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id, item.name, item.description, item.item_type, item.slot, item.icon_emoji, item.effect_json, item.cost_pt, item.sort_order,
    );
  }
}
