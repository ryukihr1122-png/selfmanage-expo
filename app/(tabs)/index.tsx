/**
 * ダッシュボード（v2 キャラクター育成版）
 *
 * - プレイヤーステータス（Lv, XP, ストリーク, Pt）
 * - キャラカード一覧（各キャラの進捗）
 * - 今日のエネルギーバー（残タスク数）
 * - 今日のタスク（キャラ別グループ）
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  getProfile,
  type Profile,
} from "@/db/repository";
import {
  getUserCharacters,
  getTodayTasksV2,
  completeTaskV2,
  undoTaskV2,
  getPlayerUnlockStatus,
  type UserCharacter,
  type DailyTaskV2,
  type PlayerUnlockStatus,
} from "@/db/character-repository";
import { useApp } from "@/contexts/AppContext";
import { RPGBox } from "@/components/RPGBox";
import { XPPopup } from "@/components/XPPopup";
import { haptic } from "@/lib/haptics";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

// ステージ→絵文字
const STAGE_EMOJI: Record<number, string> = {
  0: "🥚",
  1: "🐣",
  2: "🐥",
  3: "🐉",
  4: "✨",
};

export default function DashboardScreen() {
  const router = useRouter();
  const { refreshProfile } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chars, setChars] = useState<UserCharacter[]>([]);
  const [tasks, setTasks] = useState<DailyTaskV2[]>([]);
  const [unlockStatus, setUnlockStatus] = useState<PlayerUnlockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<{
    xp: number; levelUp: boolean; newLevel: number;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c, t, u] = await Promise.all([
        getProfile(),
        getUserCharacters(),
        getTodayTasksV2(),
        getPlayerUnlockStatus(),
      ]);
      setProfile(p);
      setChars(c);
      setTasks(t);
      setUnlockStatus(u);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // タブに戻った時にリロード
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleComplete = useCallback(async (taskId: string) => {
    if (pendingTaskId) return;
    setPendingTaskId(taskId);
    try {
      const res = await completeTaskV2(taskId);

      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t,
      ));

      // リロードして最新レベルを取る
      const newProfile = await getProfile();
      const didLevelUp = res.playerLevelUp;
      setXpPopup({ xp: res.earnedXp, levelUp: didLevelUp, newLevel: newProfile.level });

      if (didLevelUp) haptic.levelUp(); else haptic.complete();

      // リロード
      const [p, c, u] = await Promise.all([
        getProfile(),
        getUserCharacters(),
        getPlayerUnlockStatus(),
      ]);
      setProfile(p);
      setChars(c);
      setUnlockStatus(u);
      refreshProfile();
    } catch {
      // ignore
    } finally {
      setPendingTaskId(null);
    }
  }, [pendingTaskId, profile, refreshProfile]);

  const handleUndo = useCallback(async (taskId: string) => {
    if (pendingTaskId) return;
    setPendingTaskId(taskId);
    try {
      await undoTaskV2(taskId);
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: false, completedAt: null } : t,
      ));

      const [p, c] = await Promise.all([getProfile(), getUserCharacters()]);
      setProfile(p);
      setChars(c);
      refreshProfile();
    } catch {
      // ignore
    } finally {
      setPendingTaskId(null);
    }
  }, [pendingTaskId, refreshProfile]);

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const energyPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const xpPct = Math.round(((profile.totalXp % 100) / 100) * 100);

  // キャラ別タスクグループ
  const tasksByChar = chars.map((char) => ({
    char,
    tasks: tasks.filter((t) => t.userCharacterId === char.id),
  }));

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
        }
      >
        {/* プレイヤーステータス */}
        <RPGBox style={{ padding: 16 }}>
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{profile.displayName}</Text>
              <View style={styles.levelRow}>
                <Text style={styles.levelLabel}>Lv.{profile.level}</Text>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${xpPct}%`, backgroundColor: Colors.gold }]} />
                </View>
                <Text style={styles.xpText}>{profile.totalXp % 100}/100</Text>
              </View>
            </View>
            <View style={styles.playerStats}>
              <View style={styles.statChip}>
                <Text>{profile.streakDays >= 3 ? "🔥" : "💧"}</Text>
                <Text style={styles.statValue}>{profile.streakDays}日</Text>
              </View>
              <View style={styles.statChip}>
                <Text>💰</Text>
                <Text style={styles.statGold}>{profile.points} Pt</Text>
              </View>
            </View>
          </View>
        </RPGBox>

        {/* エネルギーバー（今日の進捗） */}
        <RPGBox style={{ padding: 14 }}>
          <View style={styles.energyHeader}>
            <Text style={styles.energyLabel}>⚡ 今日のエネルギー</Text>
            <Text style={styles.energyCount}>{completedCount}/{totalCount}</Text>
          </View>
          <View style={styles.energyBarBg}>
            <View
              style={[
                styles.energyBarFill,
                {
                  width: `${energyPct}%`,
                  backgroundColor: energyPct >= 100 ? Colors.green : Colors.gold,
                },
              ]}
            />
          </View>
          {energyPct >= 100 && (
            <Text style={styles.energyComplete}>🎉 全タスク完了！お疲れさま！</Text>
          )}
        </RPGBox>

        {/* キャラカード一覧 */}
        <View style={styles.charSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤝 仲間たち</Text>
            <View style={styles.sectionLine} />
            {unlockStatus && (
              <Text style={styles.charCountLabel}>
                {chars.length}/{unlockStatus.maxCharacters}
              </Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
          >
            {chars.map((char) => {
              const charTasks = tasks.filter((t) => t.userCharacterId === char.id);
              const charDone = charTasks.filter((t) => t.isCompleted).length;
              const charTotal = charTasks.length;
              const charXpPct = char.level > 0
                ? Math.round(((char.currentXp - char.level * (char.level - 1) * 5) / (char.level * 10)) * 100)
                : Math.round((char.currentXp / 10) * 100);
              const stageEmoji = STAGE_EMOJI[char.stage] ?? "🥚";

              return (
                <TouchableOpacity
                  key={char.id}
                  style={styles.charCard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.charEmoji}>{stageEmoji}</Text>
                  <Text style={styles.charName} numberOfLines={1}>
                    {char.nickname ?? char.characterName}
                  </Text>
                  <Text style={styles.charLevel}>Lv.{char.level}</Text>
                  <View style={styles.charXpBar}>
                    <View style={[styles.xpBarFill, { width: `${Math.min(100, Math.max(0, charXpPct))}%`, backgroundColor: Colors.gold }]} />
                  </View>
                  <Text style={styles.charProgress}>
                    {charDone}/{charTotal} 完了
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* 新しい仲間を追加 */}
            {unlockStatus && chars.length < unlockStatus.maxCharacters && (
              <TouchableOpacity
                style={[styles.charCard, styles.charCardAdd]}
                onPress={() => router.push("/(tabs)/stats")}
                activeOpacity={0.7}
              >
                <Text style={styles.addCharIcon}>+</Text>
                <Text style={styles.addCharLabel}>仲間を{"\n"}追加</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* キャラ別タスクリスト */}
        {tasksByChar.map(({ char, tasks: charTasks }) => {
          if (charTasks.length === 0) return null;
          const stageEmoji = STAGE_EMOJI[char.stage] ?? "🥚";

          return (
            <View key={char.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {stageEmoji} {char.nickname ?? char.characterName}のタスク
                </Text>
                <View style={styles.sectionLine} />
              </View>

              <View style={{ gap: 8 }}>
                {charTasks.map((task) => (
                  <TaskCardV2
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onUndo={handleUndo}
                    isPending={pendingTaskId === task.id}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {tasks.length === 0 && (
          <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={styles.emptyText}>今日のタスクはまだありません</Text>
          </RPGBox>
        )}
      </ScrollView>

      <XPPopup
        xpGained={xpPopup?.xp ?? 0}
        levelUp={xpPopup?.levelUp}
        newLevel={xpPopup?.newLevel}
        visible={xpPopup !== null}
        onDone={() => setXpPopup(null)}
      />
    </View>
  );
}

// ─── タスクカード v2 ──────────────────────────────────────────────

function TaskCardV2({ task, onComplete, onUndo, isPending }: {
  task: DailyTaskV2;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <RPGBox
      variant={task.isCompleted ? "green" : task.source === "ad_bonus" ? "gold" : "default"}
      style={{ opacity: task.isCompleted ? 0.72 : 1, padding: 14 }}
    >
      <View style={styles.taskRow}>
        <TouchableOpacity
          onPress={() => (task.isCompleted ? onUndo(task.id) : onComplete(task.id))}
          disabled={isPending}
          style={[styles.checkbox, {
            borderColor: task.isCompleted ? Colors.green : Colors.border,
            backgroundColor: task.isCompleted ? Colors.green : "transparent",
          }]}
        >
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, task.isCompleted && styles.taskTitleDone]}>
            {task.title}
          </Text>
          <Text style={styles.taskLevelLabel}>{task.levelLabel}</Text>
        </View>
        <Text style={{
          fontSize: FontSize.xs,
          fontWeight: "700",
          color: task.isCompleted ? Colors.green : Colors.gold,
        }}>
          +{task.rewardXp} EXP
        </Text>
      </View>
    </RPGBox>
  );
}

// ─── スタイル ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  // Player status
  playerRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  playerInfo: { flex: 1, gap: 6 },
  playerName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold, width: 42 },
  xpBarBg: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 99, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 99 },
  xpText: { fontSize: FontSize.xs, color: Colors.dim, width: 42, textAlign: "right" },
  playerStats: { gap: 6 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: FontSize.sm, color: Colors.dim },
  statGold: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },

  // Energy bar
  energyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  energyLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  energyCount: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  energyBarBg: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: "hidden" },
  energyBarFill: { height: "100%", borderRadius: 5 },
  energyComplete: { fontSize: FontSize.xs, color: Colors.green, fontWeight: "600", textAlign: "center", marginTop: 6 },

  // Character cards
  charSection: { gap: 10 },
  charCard: {
    width: 110,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  charCardAdd: {
    justifyContent: "center",
    borderStyle: "dashed",
    borderColor: Colors.dim,
  },
  charEmoji: { fontSize: 36 },
  charName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  charLevel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.gold },
  charXpBar: { width: "100%", height: 4, backgroundColor: Colors.border, borderRadius: 99, overflow: "hidden" },
  charProgress: { fontSize: 10, color: Colors.dim },
  addCharIcon: { fontSize: 32, color: Colors.dim, fontWeight: "300" },
  addCharLabel: { fontSize: FontSize.xs, color: Colors.dim, textAlign: "center" },
  charCountLabel: { fontSize: FontSize.xs, color: Colors.dim },

  // Section
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.borderGold },

  // Task card
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 5, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: "700" },
  taskTitle: { fontSize: FontSize.base, color: Colors.text, lineHeight: 20 },
  taskTitleDone: { color: Colors.dim, textDecorationLine: "line-through" },
  taskLevelLabel: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 2 },

  emptyText: { fontSize: FontSize.sm, color: Colors.dim, marginTop: 8 },
});
