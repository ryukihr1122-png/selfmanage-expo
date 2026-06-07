/**
 * タスク管理画面（ローカルファースト版）
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import {
  getTodayTasks,
  getRecurringTasks,
  getTaskHistory,
  createRecurringTask,
  createTask,
  completeTask,
  undoTask,
  deleteRecurringTask,
  claimAdRewardTask,
  getAdRewardRemaining,
  type DailyTask,
  type RecurringTask,
  type HistoryDay,
} from "@/db/repository";
import { showRewardedAd } from "@/lib/admob";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { RPGInput } from "@/components/RPGInput";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

// ─── カテゴリ選択 ─────────────────────────────────────────────

const CATEGORIES = [
  { key: "wellness", icon: "💧", label: "ウェルネス", color: "#4caf50" },
  { key: "action", icon: "🔥", label: "アクション", color: "#e53935" },
  { key: "knowledge", icon: "📚", label: "ナレッジ", color: "#1e88e5" },
  { key: "purpose", icon: "🌟", label: "パーパス", color: "#f9a825" },
] as const;

const SCHEDULES = [
  { key: "daily", label: "毎日" },
  { key: "weekdays", label: "平日のみ" },
  { key: "weekends", label: "週末のみ" },
] as const;

const XP_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

// ─── タスク作成モーダル ─────────────────────────────────────────

function CreateTaskModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("wellness");
  const [rewardXp, setRewardXp] = useState(10);
  const [isRecurring, setIsRecurring] = useState(false);
  const [schedule, setSchedule] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("タスク名を入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isRecurring) {
        await createRecurringTask({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          rewardXp,
          schedule,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          rewardXp,
        });
      }
      setTitle("");
      setDescription("");
      setCategory("wellness");
      setRewardXp(10);
      setIsRecurring(false);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🆕 タスクを作成</Text>

          <RPGInput
            label="タスク名"
            placeholder="例: 朝のストレッチ 10分"
            value={title}
            onChangeText={setTitle}
          />
          <RPGInput
            label="説明（任意）"
            placeholder="具体的な行動を書くと取り組みやすくなります"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          {/* カテゴリ選択 */}
          <Text style={styles.fieldLabel}>カテゴリ</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.chip,
                  {
                    borderColor: category === c.key ? c.color : Colors.border,
                    backgroundColor:
                      category === c.key ? `${c.color}15` : "transparent",
                  },
                ]}
              >
                <Text>{c.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    { color: category === c.key ? c.color : Colors.dim },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EXP設定 */}
          <Text style={styles.fieldLabel}>難易度（EXP）</Text>
          <View style={styles.chipRow}>
            {XP_OPTIONS.map((xp) => (
              <TouchableOpacity
                key={xp}
                onPress={() => setRewardXp(xp)}
                style={[
                  styles.xpChip,
                  {
                    borderColor: rewardXp === xp ? Colors.gold : Colors.border,
                    backgroundColor:
                      rewardXp === xp ? Colors.goldGlow : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.xpChipText,
                    { color: rewardXp === xp ? Colors.gold : Colors.dim },
                  ]}
                >
                  {xp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 繰り返し設定 */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View
              style={[
                styles.toggleBox,
                isRecurring && { backgroundColor: Colors.gold, borderColor: Colors.gold },
              ]}
            >
              {isRecurring && <Text style={styles.toggleCheck}>✓</Text>}
            </View>
            <Text style={styles.toggleLabel}>繰り返しタスクにする</Text>
          </TouchableOpacity>

          {isRecurring && (
            <View style={styles.chipRow}>
              {SCHEDULES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setSchedule(s.key)}
                  style={[
                    styles.chip,
                    {
                      borderColor:
                        schedule === s.key ? Colors.gold : Colors.border,
                      backgroundColor:
                        schedule === s.key ? Colors.goldGlow : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: schedule === s.key ? Colors.gold : Colors.dim },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalActions}>
            <RPGButton
              title="キャンセル"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <RPGButton
              title="作成"
              onPress={handleCreate}
              loading={loading}
              style={{ flex: 1 }}
              icon="✨"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── メイン ────────────────────────────────────────────────────

export default function QuestScreen() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [recurringTasks, setRecurringTasksList] = useState<RecurringTask[]>([]);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"today" | "recurring" | "history">("today");
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [adRemaining, setAdRemaining] = useState(3);

  const load = useCallback(async () => {
    try {
      const [t, recurring, hist, remaining] = await Promise.all([
        getTodayTasks(),
        getRecurringTasks().catch(() => [] as RecurringTask[]),
        getTaskHistory(14).catch(() => [] as HistoryDay[]),
        getAdRewardRemaining().catch(() => 3),
      ]);
      setTasks(t);
      setRecurringTasksList(recurring);
      setHistory(hist);
      setAdRemaining(remaining);
    } catch {
      // ignore
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
        await completeTask(taskId);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, isCompleted: true, completedAt: new Date().toISOString() }
              : t,
          ),
        );
      } catch (err) {
        Alert.alert("エラー", err instanceof Error ? err.message : "操作に失敗");
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
        await undoTask(taskId);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, isCompleted: false, completedAt: null } : t,
          ),
        );
      } catch (err) {
        Alert.alert("エラー", err instanceof Error ? err.message : "操作に失敗");
      } finally {
        setPendingTaskId(null);
      }
    },
    [pendingTaskId],
  );

  const handleAdReward = useCallback(async () => {
    if (adRemaining <= 0) {
      Alert.alert("上限", "本日の広告視聴上限に達しました");
      return;
    }
    try {
      const watched = await showRewardedAd();
      if (!watched) return;
      const res = await claimAdRewardTask();
      setTasks((prev) => [...prev, res.task]);
      setAdRemaining(res.remainingToday);
      Alert.alert("獲得!", `「${res.task.title}」が追加されました！`);
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "取得に失敗");
    }
  }, [adRemaining]);

  const handleDeleteRecurring = useCallback(async (id: string) => {
    Alert.alert("削除", "この繰り返しタスクを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecurringTask(id);
            setRecurringTasksList((prev) => prev.filter((t) => t.id !== id));
          } catch (err) {
            Alert.alert("エラー", err instanceof Error ? err.message : "削除に失敗");
          }
        },
      },
    ]);
  }, []);

  const tabDef = [
    { key: "today" as const, label: "今日", icon: "📋" },
    { key: "recurring" as const, label: "習慣", icon: "🔄" },
    { key: "history" as const, label: "履歴", icon: "📅" },
  ];

  return (
    <View style={styles.flex}>
      {/* タブ切替 */}
      <View style={styles.tabBar}>
        {tabDef.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === t.key && styles.tabTextActive,
              ]}
            >
              {t.icon} {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {/* ─── 今日タブ ─── */}
        {tab === "today" && (
          <>
            {/* 広告視聴ボタン */}
            <RPGBox variant="gold" style={{ padding: 14 }}>
              <TouchableOpacity onPress={handleAdReward} style={styles.adRow}>
                <View>
                  <Text style={styles.adTitle}>🎬 広告を見てタスクを獲得</Text>
                  <Text style={styles.adSub}>
                    ボーナスタスク（EXP 1.5倍）が手に入ります
                  </Text>
                </View>
                <View style={styles.adBadge}>
                  <Text style={styles.adBadgeText}>残り{adRemaining}回</Text>
                </View>
              </TouchableOpacity>
            </RPGBox>

            {/* タスクリスト */}
            {tasks.length === 0 ? (
              <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 40 }}>📋</Text>
                <Text style={styles.emptyText}>タスクがありません</Text>
                <Text style={styles.emptyHint}>
                  下のボタンから追加しましょう
                </Text>
              </RPGBox>
            ) : (
              tasks.map((task) => (
                <RPGBox
                  key={task.id}
                  variant={
                    task.isCompleted
                      ? "green"
                      : task.isBonus
                        ? "gold"
                        : "default"
                  }
                  style={{
                    opacity: task.isCompleted ? 0.72 : 1,
                    padding: 14,
                  }}
                >
                  <View style={styles.taskRow}>
                    <TouchableOpacity
                      onPress={() =>
                        task.isCompleted
                          ? handleUndo(task.id)
                          : handleComplete(task.id)
                      }
                      disabled={pendingTaskId === task.id}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: task.isCompleted
                            ? Colors.green
                            : Colors.border,
                          backgroundColor: task.isCompleted
                            ? Colors.green
                            : "transparent",
                        },
                      ]}
                    >
                      {task.isCompleted && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.isCompleted && styles.taskTitleDone,
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text style={styles.taskDesc}>{task.description}</Text>
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: FontSize.xs,
                        fontWeight: "700",
                        color: task.isCompleted ? Colors.green : Colors.gold,
                      }}
                    >
                      +{task.rewardXp} EXP
                    </Text>
                  </View>
                </RPGBox>
              ))
            )}
          </>
        )}

        {/* ─── 習慣タブ ─── */}
        {tab === "recurring" && (
          <>
            {recurringTasks.length === 0 ? (
              <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 40 }}>🔄</Text>
                <Text style={styles.emptyText}>繰り返しタスクがありません</Text>
                <Text style={styles.emptyHint}>
                  毎日の習慣を登録すると自動でタスクが追加されます
                </Text>
              </RPGBox>
            ) : (
              recurringTasks.map((rt) => {
                const cat = CATEGORIES.find((c) => c.key === rt.category);
                return (
                  <RPGBox key={rt.id} style={{ padding: 14 }}>
                    <View style={styles.taskRow}>
                      <Text style={{ fontSize: 20 }}>{cat?.icon ?? "📌"}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle}>{rt.title}</Text>
                        <Text style={styles.taskDesc}>
                          {SCHEDULES.find((s) => s.key === rt.schedule)?.label ??
                            rt.schedule}{" "}
                          · {rt.rewardXp} EXP
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteRecurring(rt.id)}
                      >
                        <Text style={{ color: Colors.red, fontSize: 18 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </RPGBox>
                );
              })
            )}
          </>
        )}

        {/* ─── 履歴タブ ─── */}
        {tab === "history" && (
          <>
            {history.length === 0 ? (
              <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 40 }}>📅</Text>
                <Text style={styles.emptyText}>まだ履歴がありません</Text>
              </RPGBox>
            ) : (
              history.map((day) => (
                <RPGBox key={day.date} style={{ padding: 14 }}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyDate}>{formatDate(day.date)}</Text>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyChip}>
                        ✅ {day.completedCount}
                      </Text>
                      <Text style={[styles.historyChip, { color: Colors.gold }]}>
                        +{day.xpEarned} EXP
                      </Text>
                      <Text style={[styles.historyChip, { color: Colors.gold }]}>
                        +{day.ptEarned} Pt
                      </Text>
                    </View>
                  </View>
                </RPGBox>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FAB — タスク作成 */}
      {(tab === "today" || tab === "recurring") && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </View>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`;
}

// ─── スタイル ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.lg, gap: 10, paddingBottom: 80 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.gold,
  },
  tabText: { fontSize: FontSize.sm, color: Colors.dim },
  tabTextActive: { color: Colors.gold, fontWeight: "600" },

  // Ad
  adRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  adTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.gold },
  adSub: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 2 },
  adBadge: {
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adBadgeText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.gold },

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
  taskTitle: { fontSize: FontSize.base, color: Colors.text },
  taskTitleDone: { color: Colors.dim, textDecorationLine: "line-through" },
  taskDesc: { fontSize: FontSize.sm, color: Colors.dim, marginTop: 2 },

  // Empty
  emptyText: { fontSize: FontSize.md, color: Colors.dim, marginTop: 8 },
  emptyHint: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 4 },

  // History
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyDate: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500" },
  historyStats: { flexDirection: "row", gap: 10 },
  historyChip: { fontSize: FontSize.sm, color: Colors.dim },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { fontSize: 28, color: Colors.white, fontWeight: "300", marginTop: -2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 24,
    gap: 14,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.dim, fontWeight: "500" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: { fontSize: FontSize.sm },
  xpChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  xpChipText: { fontSize: FontSize.sm, fontWeight: "600" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCheck: { color: Colors.white, fontSize: 13, fontWeight: "700" },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text },
  errorText: { fontSize: FontSize.sm, color: Colors.red, textAlign: "center" },
});
