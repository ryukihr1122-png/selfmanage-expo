/**
 * タスク管理画面（v2 キャラクター育成版）
 *
 * - キャラ別タスク一覧（完了 / 取り消し）
 * - タスクの追加 / 削除
 * - タスクレベルアップ
 * - 広告ボーナスタスク
 */
import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "expo-router";
import {
  getUserCharacters,
  getTodayTasksV2,
  getUserTasks,
  getGenreTasks,
  getTaskLevels,
  completeTaskV2,
  undoTaskV2,
  addUserTask,
  removeUserTask,
  upgradeTaskLevel,
  claimAdRewardTaskV2,
  getPlayerUnlockStatus,
  type UserCharacter,
  type DailyTaskV2,
  type UserTask,
  type GenreTask,
  type TaskLevel,
  type PlayerUnlockStatus,
} from "@/db/character-repository";
import { showRewardedAd } from "@/lib/admob";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { haptic } from "@/lib/haptics";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const STAGE_EMOJI: Record<number, string> = {
  0: "🥚", 1: "🐣", 2: "🐥", 3: "🐉", 4: "✨",
};

export default function QuestScreen() {
  const [chars, setChars] = useState<UserCharacter[]>([]);
  const [tasks, setTasks] = useState<DailyTaskV2[]>([]);
  const [userTasks, setUserTasks] = useState<Record<string, UserTask[]>>({});
  const [unlockStatus, setUnlockStatus] = useState<PlayerUnlockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // タスク追加モーダル
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalCharId, setAddModalCharId] = useState<string | null>(null);
  const [addModalGenreId, setAddModalGenreId] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<GenreTask[]>([]);
  const [existingTaskIds, setExistingTaskIds] = useState<string[]>([]);

  // タスク詳細モーダル
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTask, setDetailTask] = useState<UserTask | null>(null);
  const [detailLevels, setDetailLevels] = useState<TaskLevel[]>([]);

  const load = useCallback(async () => {
    try {
      const [c, t, u] = await Promise.all([
        getUserCharacters(),
        getTodayTasksV2(),
        getPlayerUnlockStatus(),
      ]);
      setChars(c);
      setTasks(t);
      setUnlockStatus(u);

      // キャラ別にユーザータスクをロード
      const utMap: Record<string, UserTask[]> = {};
      for (const char of c) {
        utMap[char.id] = await getUserTasks(char.id);
      }
      setUserTasks(utMap);

      // 最初のキャラを選択
      if (!selectedCharId && c.length > 0) {
        setSelectedCharId(c[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCharId]);

  useFocusEffect(
    useCallback(() => { load(); }, [load])
  );

  // タスク完了
  const handleComplete = useCallback(async (taskId: string) => {
    if (pendingTaskId) return;
    setPendingTaskId(taskId);
    try {
      const res = await completeTaskV2(taskId);
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t,
      ));

      if (res.characterLevelUp) {
        haptic.levelUp();
      } else {
        haptic.complete();
      }

      // 結果通知
      const msgs: string[] = [`+${res.earnedXp} EXP`];
      if (res.characterNewStage) msgs.push(`進化: ${res.characterNewStage}！`);
      if (res.playerLevelUp) msgs.push("プレイヤーレベルアップ！");
      if (res.playerNewUnlock) msgs.push(res.playerNewUnlock);
      if (res.taskCanUpgrade) msgs.push("タスクレベルアップ可能！");

      if (msgs.length > 1) {
        Alert.alert("🎉 タスク完了！", msgs.join("\n"));
      }

      // データリロード
      const newChars = await getUserCharacters();
      setChars(newChars);
      if (selectedCharId) {
        setUserTasks((prev) => ({ ...prev }));
        const ut = await getUserTasks(selectedCharId);
        setUserTasks((prev) => ({ ...prev, [selectedCharId]: ut }));
      }
    } catch {
      // ignore
    } finally {
      setPendingTaskId(null);
    }
  }, [pendingTaskId, selectedCharId]);

  // タスク取り消し
  const handleUndo = useCallback(async (taskId: string) => {
    if (pendingTaskId) return;
    setPendingTaskId(taskId);
    try {
      await undoTaskV2(taskId);
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: false, completedAt: null } : t,
      ));
      const newChars = await getUserCharacters();
      setChars(newChars);
    } catch {
      // ignore
    } finally {
      setPendingTaskId(null);
    }
  }, [pendingTaskId]);

  // 広告ボーナス
  const handleAdReward = useCallback(async (charId: string) => {
    try {
      const watched = await showRewardedAd();
      if (!watched) return;
      const res = await claimAdRewardTaskV2(charId);
      setTasks((prev) => [...prev, res.task]);
      Alert.alert("🎁 ボーナス獲得！", `「${res.task.title}」が追加されました！\n残り${res.remainingToday}回`);
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "取得に失敗");
    }
  }, []);

  // タスク追加モーダルを開く
  const openAddModal = useCallback(async (charId: string, genreId: string) => {
    const [genre, existing] = await Promise.all([
      getGenreTasks(genreId),
      getUserTasks(charId),
    ]);
    const existIds = existing.map((t) => t.genreTaskId);
    setAvailableTasks(genre);
    setExistingTaskIds(existIds);
    setAddModalCharId(charId);
    setAddModalGenreId(genreId);
    setShowAddModal(true);
  }, []);

  // タスク追加実行
  const handleAddTask = useCallback(async (genreTaskId: string) => {
    if (!addModalCharId) return;
    try {
      await addUserTask(addModalCharId, genreTaskId);
      setExistingTaskIds((prev) => [...prev, genreTaskId]);
      // リロード
      const ut = await getUserTasks(addModalCharId);
      setUserTasks((prev) => ({ ...prev, [addModalCharId]: ut }));
      haptic.complete();
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "追加に失敗");
    }
  }, [addModalCharId]);

  // タスク削除
  const handleRemoveTask = useCallback(async (userTaskId: string, charId: string) => {
    Alert.alert("タスクを外す", "このタスクを日課から外しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "外す",
        style: "destructive",
        onPress: async () => {
          try {
            await removeUserTask(userTaskId);
            const ut = await getUserTasks(charId);
            setUserTasks((prev) => ({ ...prev, [charId]: ut }));
            load(); // タスクリストも更新
          } catch (err) {
            Alert.alert("エラー", err instanceof Error ? err.message : "削除に失敗");
          }
        },
      },
    ]);
  }, [load]);

  // タスクレベルアップ
  const handleUpgrade = useCallback(async (userTaskId: string, charId: string) => {
    try {
      const success = await upgradeTaskLevel(userTaskId);
      if (success) {
        Alert.alert("⬆️ レベルアップ！", "タスクの難易度が上がりました！獲得EXPも増加します。");
        haptic.levelUp();
        const ut = await getUserTasks(charId);
        setUserTasks((prev) => ({ ...prev, [charId]: ut }));
        load();
      } else {
        Alert.alert("条件未達", "レベルアップに必要な達成回数が足りません。");
      }
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "レベルアップに失敗");
    }
  }, [load]);

  // タスク詳細モーダルを開く
  const openDetailModal = useCallback(async (ut: UserTask) => {
    const levels = await getTaskLevels(ut.genreTaskId);
    setDetailTask(ut);
    setDetailLevels(levels);
    setShowDetailModal(true);
  }, []);

  const selectedChar = chars.find((c) => c.id === selectedCharId);
  const charTasks = selectedCharId
    ? tasks.filter((t) => t.userCharacterId === selectedCharId)
    : [];
  const charUserTasks = selectedCharId ? (userTasks[selectedCharId] ?? []) : [];

  return (
    <View style={styles.flex}>
      {/* キャラ選択タブ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.charTabBar}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {chars.map((char) => {
          const isActive = selectedCharId === char.id;
          const stageEmoji = STAGE_EMOJI[char.stage] ?? "🥚";
          const charDone = tasks.filter((t) => t.userCharacterId === char.id && t.isCompleted).length;
          const charTotal = tasks.filter((t) => t.userCharacterId === char.id).length;
          return (
            <TouchableOpacity
              key={char.id}
              onPress={() => setSelectedCharId(char.id)}
              style={[styles.charTab, isActive && styles.charTabActive]}
            >
              <Text style={styles.charTabEmoji}>{stageEmoji}</Text>
              <Text style={[styles.charTabName, isActive && styles.charTabNameActive]} numberOfLines={1}>
                {char.nickname ?? char.characterName}
              </Text>
              <Text style={[styles.charTabProgress, isActive && { color: Colors.gold }]}>
                {charDone}/{charTotal}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
        }
      >
        {/* キャラステータス */}
        {selectedChar && (
          <RPGBox style={{ padding: 14 }}>
            <View style={styles.charStatusRow}>
              <Text style={{ fontSize: 40 }}>{STAGE_EMOJI[selectedChar.stage] ?? "🥚"}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.charName}>
                  {selectedChar.nickname ?? selectedChar.characterName}
                </Text>
                <View style={styles.levelRow}>
                  <Text style={styles.levelLabel}>Lv.{selectedChar.level}</Text>
                  <View style={styles.xpBarBg}>
                    <View style={[styles.xpBarFill, {
                      width: `${Math.min(100, Math.max(0,
                        selectedChar.level > 0
                          ? ((selectedChar.currentXp - selectedChar.level * (selectedChar.level - 1) * 5) / (selectedChar.level * 10)) * 100
                          : (selectedChar.currentXp / 10) * 100
                      ))}%`,
                    }]} />
                  </View>
                </View>
                <Text style={styles.charXpText}>
                  Total XP: {selectedChar.currentXp}
                </Text>
              </View>
            </View>
          </RPGBox>
        )}

        {/* 今日のタスク */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 今日のタスク</Text>
          <View style={styles.sectionLine} />
        </View>

        {charTasks.length === 0 ? (
          <RPGBox style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ fontSize: 32 }}>📋</Text>
            <Text style={styles.emptyText}>タスクがありません</Text>
          </RPGBox>
        ) : (
          charTasks.map((task) => (
            <RPGBox
              key={task.id}
              variant={task.isCompleted ? "green" : task.source === "ad_bonus" ? "gold" : "default"}
              style={{ opacity: task.isCompleted ? 0.72 : 1, padding: 14 }}
            >
              <View style={styles.taskRow}>
                <TouchableOpacity
                  onPress={() => (task.isCompleted ? handleUndo(task.id) : handleComplete(task.id))}
                  disabled={pendingTaskId === task.id}
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
                  +{task.rewardXp}
                </Text>
              </View>
            </RPGBox>
          ))
        )}

        {/* 広告ボーナス */}
        {selectedCharId && (
          <RPGBox variant="gold" style={{ padding: 14 }}>
            <TouchableOpacity
              onPress={() => handleAdReward(selectedCharId)}
              style={styles.adRow}
            >
              <View>
                <Text style={styles.adTitle}>🎬 広告でボーナスタスク</Text>
                <Text style={styles.adSub}>EXP 1.5倍のボーナスタスクを獲得</Text>
              </View>
              <Text style={styles.adArrow}>→</Text>
            </TouchableOpacity>
          </RPGBox>
        )}

        {/* 日課管理 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚙️ 日課管理</Text>
          <View style={styles.sectionLine} />
        </View>

        {charUserTasks.map((ut) => (
          <RPGBox key={ut.id} style={{ padding: 14 }}>
            <TouchableOpacity
              onPress={() => openDetailModal(ut)}
              activeOpacity={0.7}
            >
              <View style={styles.userTaskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{ut.taskTitle}</Text>
                  <Text style={styles.taskLevelLabel}>
                    Lv.{ut.currentLevel} · {ut.totalCompletions}回達成
                  </Text>
                </View>
                <View style={styles.userTaskActions}>
                  {ut.canUpgrade && (
                    <TouchableOpacity
                      onPress={() => selectedCharId && handleUpgrade(ut.id, selectedCharId)}
                      style={styles.upgradeBadge}
                    >
                      <Text style={styles.upgradeBadgeText}>⬆️ UP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => selectedCharId && handleRemoveTask(ut.id, selectedCharId)}
                  >
                    <Text style={{ color: Colors.red, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </RPGBox>
        ))}

        {/* タスク追加ボタン */}
        {selectedChar && unlockStatus && charUserTasks.length < unlockStatus.maxTasksPerChar && (
          <TouchableOpacity
            onPress={() => openAddModal(selectedChar.id, selectedChar.genreId)}
            style={styles.addTaskBtn}
          >
            <Text style={styles.addTaskText}>+ タスクを追加</Text>
          </TouchableOpacity>
        )}
        {selectedChar && unlockStatus && charUserTasks.length >= unlockStatus.maxTasksPerChar && (
          <Text style={styles.limitText}>
            タスク枠: {charUserTasks.length}/{unlockStatus.maxTasksPerChar}（プレイヤーLvで解放）
          </Text>
        )}
      </ScrollView>

      {/* タスク追加モーダル */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📋 タスクを追加</Text>
            <Text style={styles.modalSub}>日課に追加するタスクを選んでください</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {availableTasks.map((gt) => {
                const isAdded = existingTaskIds.includes(gt.id);
                return (
                  <TouchableOpacity
                    key={gt.id}
                    onPress={() => !isAdded && handleAddTask(gt.id)}
                    disabled={isAdded}
                    style={[styles.addTaskItem, isAdded && { opacity: 0.5 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{gt.title}</Text>
                      <Text style={styles.taskLevelLabel}>{gt.description}</Text>
                    </View>
                    <Text style={{ color: isAdded ? Colors.dim : Colors.gold, fontWeight: "700" }}>
                      {isAdded ? "追加済" : "+追加"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <RPGButton
              title="閉じる"
              variant="secondary"
              onPress={() => setShowAddModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* タスク詳細モーダル */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailTask && (
              <>
                <Text style={styles.modalTitle}>{detailTask.taskTitle}</Text>
                <Text style={styles.modalSub}>
                  現在 Lv.{detailTask.currentLevel} · 累計 {detailTask.totalCompletions} 回達成
                </Text>

                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>📊 レベル一覧</Text>
                {detailLevels.map((lv) => {
                  const isCurrent = lv.level === detailTask.currentLevel;
                  const isLocked = lv.level > detailTask.currentLevel;
                  return (
                    <View
                      key={lv.id}
                      style={[
                        styles.levelItem,
                        isCurrent && { borderColor: Colors.gold, backgroundColor: Colors.goldGlow },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskTitle, isLocked && { color: Colors.dim }]}>
                          Lv.{lv.level}: {lv.label}
                        </Text>
                        {lv.description && (
                          <Text style={styles.taskLevelLabel}>{lv.description}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: FontSize.xs, color: Colors.gold, fontWeight: "700" }}>
                          ×{lv.xpMultiplier.toFixed(1)}
                        </Text>
                        {lv.requiredCompletions > 0 && (
                          <Text style={{ fontSize: 10, color: Colors.dim }}>
                            {lv.requiredCompletions}回必要
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            <RPGButton
              title="閉じる"
              variant="secondary"
              onPress={() => setShowDetailModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── スタイル ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.lg, gap: 10, paddingBottom: 40 },

  // Character tab bar
  charTabBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 72,
  },
  charTab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  charTabActive: {
    backgroundColor: Colors.goldGlow,
  },
  charTabEmoji: { fontSize: 20 },
  charTabName: { fontSize: 11, color: Colors.dim, fontWeight: "600", maxWidth: 70 },
  charTabNameActive: { color: Colors.gold },
  charTabProgress: { fontSize: 10, color: Colors.dim },

  // Character status
  charStatusRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  charName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold, width: 40 },
  xpBarBg: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 99, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 99, backgroundColor: Colors.gold },
  charXpText: { fontSize: FontSize.xs, color: Colors.dim },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.borderGold },

  // Task
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 5, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: "700" },
  taskTitle: { fontSize: FontSize.base, color: Colors.text },
  taskTitleDone: { color: Colors.dim, textDecorationLine: "line-through" },
  taskLevelLabel: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 2 },

  // User task management
  userTaskRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  userTaskActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  upgradeBadge: {
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  upgradeBadgeText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.gold },

  // Add task
  addTaskBtn: {
    borderWidth: 1.5,
    borderColor: Colors.dim,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  addTaskText: { fontSize: FontSize.sm, color: Colors.dim, fontWeight: "600" },
  limitText: { fontSize: FontSize.xs, color: Colors.dim, textAlign: "center", marginTop: 4 },

  // Ad
  adRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  adTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gold },
  adSub: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 2 },
  adArrow: { fontSize: FontSize.lg, color: Colors.gold },

  // Empty
  emptyText: { fontSize: FontSize.sm, color: Colors.dim, marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 24,
    gap: 12,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  modalSub: { fontSize: FontSize.sm, color: Colors.dim },

  addTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },

  levelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 6,
    gap: 12,
  },
});
