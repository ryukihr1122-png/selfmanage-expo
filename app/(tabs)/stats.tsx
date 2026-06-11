/**
 * 仲間一覧画面（v2 キャラクター育成版）
 *
 * - 所持キャラ一覧（ステージ、レベル、タスク）
 * - プレイヤーレベル解放状況
 * - 新しい仲間の追加
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  getGenres,
  getCharacterDefs,
  getUserCharacters,
  getUserTasks,
  getPlayerUnlockStatus,
  unlockCharacter,
  expandTodayTasksV2,
  type Genre,
  type CharacterDef,
  type UserCharacter,
  type UserTask,
  type PlayerUnlockStatus,
} from "@/db/character-repository";
import { getProfile, type Profile } from "@/db/repository";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { haptic } from "@/lib/haptics";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const STAGE_EMOJI: Record<number, string> = {
  0: "🥚", 1: "🐣", 2: "🐥", 3: "🐉", 4: "✨",
};

const STAGE_NAMES: Record<number, string> = {
  0: "タマゴ", 1: "幼体", 2: "成長体", 3: "成体", 4: "覚醒体",
};

export default function CompanionsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chars, setChars] = useState<UserCharacter[]>([]);
  const [charTasks, setCharTasks] = useState<Record<string, UserTask[]>>({});
  const [unlockStatus, setUnlockStatus] = useState<PlayerUnlockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 仲間追加モーダル
  const [showAddModal, setShowAddModal] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [charDefs, setCharDefs] = useState<CharacterDef[]>([]);
  const [ownedGenreIds, setOwnedGenreIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const [p, c, u] = await Promise.all([
        getProfile(),
        getUserCharacters(),
        getPlayerUnlockStatus(),
      ]);
      setProfile(p);
      setChars(c);
      setUnlockStatus(u);

      const taskMap: Record<string, UserTask[]> = {};
      for (const char of c) {
        taskMap[char.id] = await getUserTasks(char.id);
      }
      setCharTasks(taskMap);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // 仲間追加モーダルを開く
  const openAddModal = useCallback(async () => {
    const [g, cd] = await Promise.all([getGenres(), getCharacterDefs()]);
    setGenres(g);
    setCharDefs(cd);
    setOwnedGenreIds(chars.map((c) => c.genreId));
    setShowAddModal(true);
  }, [chars]);

  // 仲間を追加
  const handleUnlock = useCallback(async (charDefId: string, genreId: string) => {
    try {
      await unlockCharacter(charDefId, genreId);
      await expandTodayTasksV2();
      haptic.levelUp();
      setShowAddModal(false);
      load();
      Alert.alert("🎉 新しい仲間！", "タスクタブからタスクを設定しよう！");
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "解放に失敗");
    }
  }, [load]);

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const xpPct = Math.round(((profile.totalXp % 100) / 100) * 100);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
        }
      >
        {/* プレイヤーステータス */}
        <RPGBox style={{ alignItems: "center", gap: 12, paddingVertical: 20 }}>
          <Text style={styles.levelBig}>Lv.{profile.level}</Text>
          <Text style={styles.playerName}>{profile.displayName}</Text>
          <View style={styles.xpBarWide}>
            <View style={[styles.xpBarFill, { width: `${xpPct}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {profile.totalXp % 100} / 100 EXP（総計 {profile.totalXp}）
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>{profile.streakDays >= 3 ? "🔥" : "💧"}</Text>
              <Text style={styles.statValue}>{profile.streakDays}</Text>
              <Text style={styles.statCaption}>日連続</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{profile.points}</Text>
              <Text style={styles.statCaption}>Pt</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statIcon}>🤝</Text>
              <Text style={styles.statValue}>{chars.length}</Text>
              <Text style={styles.statCaption}>仲間</Text>
            </View>
          </View>
        </RPGBox>

        {/* 解放状況 */}
        {unlockStatus && (
          <RPGBox style={{ padding: 14 }}>
            <Text style={styles.unlockTitle}>🔓 解放状況</Text>
            <View style={styles.unlockRow}>
              <Text style={styles.unlockLabel}>仲間枠</Text>
              <Text style={styles.unlockValue}>{chars.length} / {unlockStatus.maxCharacters}</Text>
            </View>
            <View style={styles.unlockRow}>
              <Text style={styles.unlockLabel}>タスク枠/キャラ</Text>
              <Text style={styles.unlockValue}>{unlockStatus.maxTasksPerChar}</Text>
            </View>
            {unlockStatus.nextCharacterUnlockLevel && (
              <Text style={styles.unlockHint}>
                Lv.{unlockStatus.nextCharacterUnlockLevel} で仲間枠+1
              </Text>
            )}
            {unlockStatus.nextTaskUnlockLevel && (
              <Text style={styles.unlockHint}>
                Lv.{unlockStatus.nextTaskUnlockLevel} でタスク枠+1
              </Text>
            )}
          </RPGBox>
        )}

        {/* キャラ一覧 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🤝 仲間たち</Text>
          <View style={styles.sectionLine} />
        </View>

        {chars.map((char) => {
          const stageEmoji = STAGE_EMOJI[char.stage] ?? "🥚";
          const tasks = charTasks[char.id] ?? [];

          return (
            <RPGBox key={char.id} style={{ padding: 16 }}>
              <View style={styles.charRow}>
                <Text style={styles.charEmoji}>{stageEmoji}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.charHeader}>
                    <Text style={styles.charName}>
                      {char.nickname ?? char.characterName}
                    </Text>
                    <Text style={[styles.charGenre, { color: char.themeColor }]}>
                      {char.iconEmoji} {char.genreName}
                    </Text>
                  </View>
                  <Text style={styles.charStage}>
                    {STAGE_NAMES[char.stage] ?? "不明"} · Lv.{char.level}
                  </Text>
                  <View style={styles.xpBarSmall}>
                    <View style={[styles.xpBarFillSmall, {
                      width: `${Math.min(100, Math.max(0,
                        char.level > 0
                          ? ((char.currentXp - char.level * (char.level - 1) * 5) / (char.level * 10)) * 100
                          : (char.currentXp / 10) * 100
                      ))}%`,
                      backgroundColor: char.themeColor,
                    }]} />
                  </View>

                  {/* タスク一覧 */}
                  {tasks.length > 0 && (
                    <View style={styles.charTasksContainer}>
                      {tasks.map((t) => (
                        <View key={t.id} style={styles.charTaskChip}>
                          <Text style={styles.charTaskText}>
                            {t.taskTitle} (Lv.{t.currentLevel})
                          </Text>
                          <Text style={styles.charTaskCount}>
                            {t.totalCompletions}回
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {tasks.length === 0 && (
                    <Text style={styles.noTaskText}>タスク未設定</Text>
                  )}
                </View>
              </View>
            </RPGBox>
          );
        })}

        {/* 仲間追加ボタン */}
        {unlockStatus && unlockStatus.canAddCharacter && (
          <TouchableOpacity
            onPress={openAddModal}
            style={styles.addCharBtn}
          >
            <Text style={styles.addCharIcon}>+</Text>
            <Text style={styles.addCharText}>新しい仲間を迎える</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 仲間追加モーダル */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🤝 新しい仲間を選ぼう</Text>
            <Text style={styles.modalSub}>
              どの分野を伸ばしたい？
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {genres.map((genre) => {
                const charDef = charDefs.find((c) => c.genreId === genre.id && c.isDefault);
                const isOwned = ownedGenreIds.includes(genre.id);
                return (
                  <TouchableOpacity
                    key={genre.id}
                    onPress={() => charDef && !isOwned && handleUnlock(charDef.id, genre.id)}
                    disabled={isOwned}
                    style={[
                      styles.genreItem,
                      isOwned && { opacity: 0.5 },
                      { borderColor: isOwned ? Colors.border : genre.themeColor },
                    ]}
                  >
                    <Text style={styles.genreItemEmoji}>{genre.iconEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.charName, { color: isOwned ? Colors.dim : Colors.text }]}>
                        {charDef?.name ?? "???"}
                      </Text>
                      <Text style={styles.genreItemDesc}>{genre.name}</Text>
                      {genre.description && (
                        <Text style={styles.genreItemDesc}>{genre.description}</Text>
                      )}
                    </View>
                    <Text style={{ color: isOwned ? Colors.dim : genre.themeColor, fontWeight: "700" }}>
                      {isOwned ? "仲間済" : "選ぶ"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  // Player
  levelBig: { fontSize: FontSize["3xl"], fontWeight: "700", color: Colors.gold },
  playerName: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text },
  xpBarWide: { width: "100%", height: 10, backgroundColor: Colors.border, borderRadius: 99, overflow: "hidden" },
  xpBarFill: { height: "100%", backgroundColor: Colors.gold, borderRadius: 99 },
  xpText: { fontSize: FontSize.sm, color: Colors.dim },
  statsGrid: { flexDirection: "row", gap: 32, marginTop: 8 },
  statCell: { alignItems: "center", gap: 2 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  statCaption: { fontSize: FontSize.xs, color: Colors.dim },

  // Unlock
  unlockTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold, marginBottom: 8 },
  unlockRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  unlockLabel: { fontSize: FontSize.sm, color: Colors.text },
  unlockValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  unlockHint: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 4 },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.borderGold },

  // Character card
  charRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  charEmoji: { fontSize: 48 },
  charHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  charName: { fontSize: FontSize.base, fontWeight: "700", color: Colors.text },
  charGenre: { fontSize: FontSize.xs, fontWeight: "600" },
  charStage: { fontSize: FontSize.xs, color: Colors.dim },
  xpBarSmall: { height: 4, backgroundColor: Colors.border, borderRadius: 99, overflow: "hidden" },
  xpBarFillSmall: { height: "100%", borderRadius: 99 },

  charTasksContainer: { gap: 4, marginTop: 6 },
  charTaskChip: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  charTaskText: { fontSize: FontSize.xs, color: Colors.text },
  charTaskCount: { fontSize: FontSize.xs, color: Colors.dim },
  noTaskText: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 4 },

  // Add character
  addCharBtn: {
    borderWidth: 1.5,
    borderColor: Colors.dim,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  addCharIcon: { fontSize: 32, color: Colors.dim, fontWeight: "300" },
  addCharText: { fontSize: FontSize.sm, color: Colors.dim, fontWeight: "600" },

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

  genreItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    marginTop: 8,
    gap: 12,
  },
  genreItemEmoji: { fontSize: 32 },
  genreItemDesc: { fontSize: FontSize.xs, color: Colors.dim },
});
