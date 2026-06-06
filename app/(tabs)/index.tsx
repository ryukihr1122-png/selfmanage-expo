/**
 * ダッシュボード（ホーム画面）
 * - WAKPカード
 * - 統計バー（レベル・ストリーク・Pt）
 * - 装備・称号バー
 * - 今日のタスクリスト
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
import { useRouter } from "expo-router";
import { api, todayJST } from "@/lib/api";
import type { MeResponse, DailyTask, OnboardingAnswers, UserItem } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { XPPopup } from "@/components/XPPopup";
import { haptic } from "@/lib/haptics";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

// ─── WAKPカテゴリ定義 ───────────────────────────────────────────

const COMPANIONS = [
  { key: "W", habitsKey: "wellnessHabits", icon: "💧", color: "#4caf50", label: "ウェルネス" },
  { key: "A", habitsKey: "actionHabits", icon: "🔥", color: "#e53935", label: "アクション" },
  { key: "K", habitsKey: "knowledgeHabits", icon: "📚", color: "#1e88e5", label: "ナレッジ" },
  { key: "P", habitsKey: "purposeHabits", icon: "🌟", color: "#f9a825", label: "パーパス" },
] as const;

type CompanionKey = (typeof COMPANIONS)[number]["key"];

// ─── タスクカード ─────────────────────────────────────────────────

function TaskCard({
  task,
  onComplete,
  onUndo,
  isPending,
}: {
  task: DailyTask;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <RPGBox
      variant={task.isCompleted ? "green" : task.isBonus ? "gold" : "default"}
      style={{ opacity: task.isCompleted ? 0.72 : 1, padding: 14 }}
    >
      <View style={styles.taskRow}>
        {/* チェックボタン */}
        <TouchableOpacity
          onPress={() => (task.isCompleted ? onUndo(task.id) : onComplete(task.id))}
          disabled={isPending}
          style={[
            styles.checkbox,
            {
              borderColor: task.isCompleted
                ? Colors.green
                : task.isBonus
                  ? Colors.borderGold
                  : Colors.border,
              backgroundColor: task.isCompleted ? Colors.green : "transparent",
            },
          ]}
        >
          {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* テキスト */}
        <View style={styles.taskContent}>
          <View style={styles.taskTitleRow}>
            <Text
              style={[
                styles.taskTitle,
                task.isCompleted && styles.taskTitleDone,
              ]}
            >
              {task.title}
            </Text>
            {task.isBonus && (
              <View style={[styles.badge, { borderColor: Colors.borderGold }]}>
                <Text style={[styles.badgeText, { color: Colors.gold }]}>ボーナス</Text>
              </View>
            )}
            {task.chainStep !== null && task.chainStep > 1 && (
              <View style={[styles.badge, { borderColor: "#7c3aed" }]}>
                <Text style={[styles.badgeText, { color: "#7c3aed" }]}>
                  連鎖×{task.chainStep}
                </Text>
              </View>
            )}
          </View>
          {task.description && (
            <Text style={styles.taskDesc}>{task.description}</Text>
          )}
        </View>

        {/* EXP */}
        <Text
          style={[
            styles.taskXp,
            { color: task.isCompleted ? Colors.green : Colors.gold },
          ]}
        >
          +{task.rewardXp}
        </Text>
      </View>
    </RPGBox>
  );
}

// ─── メイン ────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);
  const [habits, setHabits] = useState<Partial<OnboardingAnswers> | null>(null);
  const [equippedItems, setEquippedItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<{
    xp: number;
    levelUp: boolean;
    newLevel: number;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [me, onboarding, inv] = await Promise.all([
        api.getMe(),
        api.getOnboarding().catch(() => null),
        api.getMyItems().catch(() => ({ items: [] as UserItem[] })),
      ]);
      setData(me);
      if (onboarding) setHabits(onboarding.answers);
      setEquippedItems(inv.items.filter((i) => i.isEquipped));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込み失敗");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = useCallback(
    async (taskId: string) => {
      if (pendingTaskId) return;
      setPendingTaskId(taskId);
      try {
        const res = await api.completeTask(taskId, todayJST());
        const xpDelta = res.event.xpDelta;
        const oldLevel = data?.stats.level ?? 1;
        const newTotalXp = (data?.stats.totalXp ?? 0) + xpDelta;
        const newLevel = Math.floor(newTotalXp / 100) + 1;
        const didLevelUp = newLevel > oldLevel;

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              totalXp: newTotalXp,
              level: newLevel,
              streakDays: res.event.streakDays,
            },
            todayTasks: prev.todayTasks.map((t) =>
              t.id === taskId
                ? { ...t, isCompleted: true, latestEventAt: new Date().toISOString() }
                : t,
            ),
          };
        });
        setXpPopup({ xp: xpDelta, levelUp: didLevelUp, newLevel });
        if (didLevelUp) {
          haptic.levelUp();
        } else {
          haptic.complete();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "操作に失敗");
      } finally {
        setPendingTaskId(null);
      }
    },
    [pendingTaskId],
  );

  const handleUndo = useCallback(
    async (taskId: string) => {
      if (pendingTaskId) return;
      setPendingTaskId(taskId);
      try {
        const res = await api.undoTask(taskId);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              totalXp: Math.max(0, prev.stats.totalXp + res.event.xpDelta),
              level: Math.floor(Math.max(0, prev.stats.totalXp + res.event.xpDelta) / 100) + 1,
            },
            todayTasks: prev.todayTasks.map((t) =>
              t.id === taskId ? { ...t, isCompleted: false, latestEventAt: null } : t,
            ),
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "操作に失敗");
      } finally {
        setPendingTaskId(null);
      }
    },
    [pendingTaskId],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "データ取得に失敗"}</Text>
      </View>
    );
  }

  const { stats, todayTasks } = data;
  const completedCount = todayTasks.filter((t) => t.isCompleted).length;
  const normalTasks = todayTasks.filter((t) => !t.isBonus);
  const bonusTasks = todayTasks.filter((t) => t.isBonus);
  const xpPct = Math.round(((stats.totalXp % 100) / 100) * 100);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.gold}
          />
        }
      >
        {/* WAKPカード */}
        <View style={styles.companionGrid}>
          {COMPANIONS.map((c) => {
            const cHabits =
              (habits?.[c.habitsKey as keyof OnboardingAnswers] as string[] | undefined) ?? [];
            const companionXp = Math.floor(stats.totalXp / 4);
            const level = Math.floor(companionXp / 25) + 1;
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.companionCard,
                  {
                    borderColor: c.color,
                    opacity: cHabits.length > 0 ? 1 : 0.5,
                  },
                ]}
                onPress={() => router.push("/onboarding")}
              >
                <Text style={styles.companionIcon}>{c.icon}</Text>
                <Text style={[styles.companionLabel, { color: c.color }]}>
                  {c.key} — {c.label}
                </Text>
                <Text style={[styles.companionLevel, { color: c.color }]}>
                  Lv.{level}
                </Text>
                <View style={styles.xpBarBg}>
                  <View
                    style={[
                      styles.xpBarFill,
                      {
                        width: `${Math.round(((companionXp % 25) / 25) * 100)}%`,
                        backgroundColor: c.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.companionHabits, { color: c.color }]}>
                  {cHabits.length > 0 ? `${cHabits.length} 習慣` : "未設定"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 統計バー */}
        <RPGBox style={{ padding: 12 }}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Lv.{stats.level}</Text>
              <View style={styles.xpBarBgWide}>
                <View
                  style={[styles.xpBarFill, { width: `${xpPct}%`, backgroundColor: Colors.gold }]}
                />
              </View>
              <Text style={styles.statDim}>
                {stats.totalXp % 100}/100
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text>{stats.streakDays >= 3 ? "🔥" : "💧"}</Text>
              <Text style={stats.streakDays >= 3 ? styles.statGold : styles.statDim}>
                {stats.streakDays}日
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text>✅</Text>
              <Text style={styles.statDim}>
                {completedCount}/{todayTasks.length}
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text>💰</Text>
              <Text style={styles.statGold}>{stats.points ?? 0} Pt</Text>
            </View>
          </View>
        </RPGBox>

        {/* 装備バー */}
        <TouchableOpacity onPress={() => router.push("/character")}>
          <RPGBox style={{ padding: 12 }}>
            <View style={styles.equipRow}>
              {equippedItems.length > 0 ? (
                equippedItems.map((item) => (
                  <Text key={item.userItemId} style={styles.equipItem}>
                    {item.iconEmoji} {item.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.statDim}>装備・称号は未設定</Text>
              )}
              <Text style={styles.profileLink}>👤 プロフィール →</Text>
            </View>
          </RPGBox>
        </TouchableOpacity>

        {/* タスクリスト */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 今日のタスク</Text>
            <View style={styles.sectionLine} />
          </View>

          {todayTasks.length === 0 ? (
            <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={styles.statDim}>今日のタスクはまだありません</Text>
              <Text style={[styles.statDim, { fontSize: FontSize.xs }]}>
                タスクタブから追加しましょう
              </Text>
            </RPGBox>
          ) : (
            <View style={{ gap: 8 }}>
              {normalTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onUndo={handleUndo}
                  isPending={pendingTaskId === task.id}
                />
              ))}
              {bonusTasks.length > 0 && (
                <>
                  <View style={styles.bonusDivider}>
                    <View style={styles.bonusDividerLine} />
                    <Text style={styles.bonusDividerText}>ボーナス</Text>
                    <View style={styles.bonusDividerLine} />
                  </View>
                  {bonusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onUndo={handleUndo}
                      isPending={pendingTaskId === task.id}
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* EXPポップアップ（アニメーション付き） */}
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

// ─── スタイル ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  errorText: { fontSize: FontSize.base, color: Colors.red },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  // WAKP
  companionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  companionCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  companionIcon: { fontSize: 28 },
  companionLabel: { fontSize: FontSize.xs, fontWeight: "600" },
  companionLevel: { fontSize: FontSize.sm, fontWeight: "700" },
  companionHabits: { fontSize: FontSize.xs },

  // XPバー
  xpBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  xpBarBgWide: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  xpBarFill: { height: "100%", borderRadius: 99 },

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  statItem: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 100 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  statLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  statGold: { fontSize: FontSize.sm, color: Colors.gold },
  statDim: { fontSize: FontSize.sm, color: Colors.dim },

  // Equip
  equipRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  equipItem: { fontSize: FontSize.sm, color: Colors.dim },
  profileLink: { fontSize: FontSize.sm, color: Colors.dim, marginLeft: "auto" },

  // Section
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.borderGold },

  // Task
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: "700" },
  taskContent: { flex: 1 },
  taskTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  taskTitle: { fontSize: FontSize.base, color: Colors.text, lineHeight: 20 },
  taskTitleDone: { color: Colors.dim, textDecorationLine: "line-through" },
  taskDesc: { fontSize: FontSize.sm, color: Colors.dim, marginTop: 4 },
  taskXp: { fontSize: FontSize.xs, fontWeight: "700" },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 9, fontWeight: "600" },

  // Bonus divider
  bonusDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  bonusDividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderGold },
  bonusDividerText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: "600" },

});
