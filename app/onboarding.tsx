/**
 * オンボーディング（v2 キャラクター育成システム）
 *
 * Step 1: 冒険者名を決める
 * Step 2: 最初の仲間（ジャンル）を選ぶ
 * Step 3: タスクを選ぶ（10個から3つ）
 * Step 4: タマゴ出現演出
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { getProfile } from "@/db/repository";
import {
  getGenres,
  getCharacterDefs,
  getGenreTasks,
  unlockCharacter,
  addUserTask,
  expandTodayTasksV2,
  getUserCharacters,
  type Genre,
  type CharacterDef,
  type GenreTask,
} from "@/db/character-repository";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step = 1 | 2 | 3 | 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [name, setName] = useState("");

  // Step 2
  const [genres, setGenres] = useState<Genre[]>([]);
  const [characters, setCharacters] = useState<CharacterDef[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);

  // Step 3
  const [genreTasks, setGenreTasks] = useState<GenreTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Step 4
  const [eggScale] = useState(new Animated.Value(0));
  const [eggOpacity] = useState(new Animated.Value(0));
  const [selectedCharName, setSelectedCharName] = useState("");
  const [selectedGenreName, setSelectedGenreName] = useState("");
  const [selectedGenreEmoji, setSelectedGenreEmoji] = useState("");

  // 初期データ読み込み
  useEffect(() => {
    (async () => {
      try {
        // 既にキャラがいたらスキップ
        const existing = await getUserCharacters();
        if (existing.length > 0) {
          router.replace("/(tabs)");
          return;
        }

        const profile = await getProfile();
        setName(profile.displayName === "冒険者" ? "" : profile.displayName);

        const g = await getGenres();
        const c = await getCharacterDefs();
        setGenres(g);
        setCharacters(c);
      } catch (err) {
        console.error("[onboarding] init error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Step 2でジャンル選択時にタスクを読み込む
  const handleSelectGenre = useCallback(async (genreId: string) => {
    setSelectedGenreId(genreId);
    const tasks = await getGenreTasks(genreId);
    setGenreTasks(tasks);
    setSelectedTaskIds([]);
  }, []);

  // Step 3 タスクの選択/解除
  const toggleTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      }
      if (prev.length >= 3) return prev; // 最大3つ
      return [...prev, taskId];
    });
  }, []);

  // Step 1 → 2
  const goToStep2 = useCallback(async () => {
    const displayName = name.trim() || "冒険者";
    const { getDB } = await import("@/db/repository");
    const db = await getDB();
    await db.runAsync("UPDATE profile SET display_name = ? WHERE id = 1", displayName);
    setStep(2);
  }, [name]);

  // Step 2 → 3
  const goToStep3 = useCallback(() => {
    if (!selectedGenreId) return;
    setStep(3);
  }, [selectedGenreId]);

  // Step 3 → 4（キャラ解放 + タスク登録）
  const goToStep4 = useCallback(async () => {
    if (!selectedGenreId || selectedTaskIds.length === 0) return;
    setLoading(true);
    try {
      const charDef = characters.find((c) => c.genreId === selectedGenreId && c.isDefault);
      if (!charDef) throw new Error("キャラクターが見つかりません");

      // キャラ解放
      const userChar = await unlockCharacter(charDef.id, selectedGenreId);

      // タスク登録
      for (const taskId of selectedTaskIds) {
        await addUserTask(userChar.id, taskId);
      }

      // 今日のタスク展開
      await expandTodayTasksV2();

      // 演出用データ
      const genre = genres.find((g) => g.id === selectedGenreId);
      setSelectedCharName(charDef.name);
      setSelectedGenreName(genre?.name ?? "");
      setSelectedGenreEmoji(genre?.iconEmoji ?? "🥚");

      setStep(4);

      // タマゴ出現アニメーション
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(eggScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(eggOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } catch (err) {
      console.error("[onboarding] save error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGenreId, selectedTaskIds, characters, genres, eggScale, eggOpacity]);

  // Step 4 → ホーム
  const goToHome = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  if (loading && step === 1) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* プログレスバー */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step ? styles.progressDotActive : null,
            ]}
          />
        ))}
      </View>

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>⚔️</Text>
            <Text style={styles.stepTitle}>冒険者名を決めよう</Text>
            <Text style={styles.stepSub}>
              あなたの名前を教えてください。{"\n"}この名前で冒険に出発します。
            </Text>
          </View>

          <RPGBox style={{ gap: 16 }}>
            <TextInput
              style={styles.nameInput}
              placeholder="冒険者名を入力..."
              placeholderTextColor={Colors.dim}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
            />
            <Text style={styles.hint}>
              ※ 空欄の場合は「冒険者」になります
            </Text>
          </RPGBox>

          <RPGButton
            title="次へ"
            onPress={goToStep2}
            icon="→"
          />
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>🤝</Text>
            <Text style={styles.stepTitle}>最初の仲間を選ぼう</Text>
            <Text style={styles.stepSub}>
              どの分野を伸ばしたい？{"\n"}仲間を1体選んで冒険に出よう。
            </Text>
          </View>

          <View style={styles.genreGrid}>
            {genres.map((genre) => {
              const char = characters.find((c) => c.genreId === genre.id && c.isDefault);
              const isSelected = selectedGenreId === genre.id;
              return (
                <TouchableOpacity
                  key={genre.id}
                  style={[
                    styles.genreCard,
                    {
                      borderColor: isSelected ? genre.themeColor : Colors.border,
                      backgroundColor: isSelected ? `${genre.themeColor}15` : Colors.card,
                    },
                  ]}
                  onPress={() => handleSelectGenre(genre.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genreEmoji}>{genre.iconEmoji}</Text>
                  <Text style={[styles.genreCharName, { color: isSelected ? genre.themeColor : Colors.text }]}>
                    {char?.name ?? "???"}
                  </Text>
                  <Text style={styles.genreName}>{genre.name}</Text>
                  <Text style={styles.genreDesc} numberOfLines={2}>
                    {genre.description}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: genre.themeColor }]}>
                      <Text style={styles.selectedBadgeText}>選択中</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.navRow}>
            <RPGButton
              title="戻る"
              variant="secondary"
              onPress={() => setStep(1)}
              icon="←"
            />
            <RPGButton
              title="次へ"
              onPress={goToStep3}
              disabled={!selectedGenreId}
              icon="→"
            />
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>📋</Text>
            <Text style={styles.stepTitle}>タスクを3つ選ぼう</Text>
            <Text style={styles.stepSub}>
              仲間を育てるために毎日取り組むタスクを選んでください。{"\n"}
              <Text style={{ fontWeight: "700", color: Colors.gold }}>
                {selectedTaskIds.length}/3 選択中
              </Text>
            </Text>
          </View>

          {genreTasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const genre = genres.find((g) => g.id === task.genreId);
            const themeColor = genre?.themeColor ?? Colors.gold;
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    borderColor: isSelected ? themeColor : Colors.border,
                    backgroundColor: isSelected ? `${themeColor}12` : Colors.card,
                  },
                ]}
                onPress={() => toggleTask(task.id)}
                activeOpacity={0.7}
              >
                <View style={styles.taskRow}>
                  <View style={[
                    styles.taskCheck,
                    {
                      borderColor: isSelected ? themeColor : Colors.dim,
                      backgroundColor: isSelected ? themeColor : "transparent",
                    },
                  ]}>
                    {isSelected && <Text style={styles.taskCheckMark}>✓</Text>}
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, isSelected && { color: themeColor }]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  </View>
                  <Text style={styles.taskXp}>+10 EXP</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.navRow}>
            <RPGButton
              title="戻る"
              variant="secondary"
              onPress={() => setStep(2)}
              icon="←"
            />
            <RPGButton
              title="決定！"
              onPress={goToStep4}
              loading={loading}
              disabled={selectedTaskIds.length === 0}
              icon="✨"
            />
          </View>
        </ScrollView>
      )}

      {step === 4 && (
        <View style={styles.eggContainer}>
          <Text style={styles.eggAnnounce}>仲間が現れた！</Text>

          <Animated.View
            style={[
              styles.eggVisual,
              {
                transform: [{ scale: eggScale }],
                opacity: eggOpacity,
              },
            ]}
          >
            <Text style={styles.eggEmoji}>🥚</Text>
            <Text style={styles.eggGlow}>{selectedGenreEmoji}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: eggOpacity, alignItems: "center", gap: 8 }}>
            <Text style={styles.eggCharName}>{selectedCharName}</Text>
            <Text style={styles.eggGenreName}>{selectedGenreName}の仲間</Text>
            <View style={styles.eggDivider} />
            <Text style={styles.eggHint}>
              最初のタスクを完了すると{"\n"}タマゴから孵化します
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: eggOpacity, width: "100%", paddingHorizontal: 40, marginTop: 40 }}>
            <RPGButton
              title="冒険を始める！"
              onPress={goToHome}
              icon="🌱"
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  // Progress bar
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 60,
    paddingBottom: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.gold,
  },

  // Step header
  stepHeader: { alignItems: "center", gap: 8, paddingVertical: 12 },
  stepEmoji: { fontSize: 48 },
  stepTitle: { fontSize: FontSize["2xl"], fontWeight: "700", color: Colors.gold },
  stepSub: { fontSize: FontSize.sm, color: Colors.dim, textAlign: "center", lineHeight: 20 },

  // Step 1 — Name
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: FontSize.lg,
    color: Colors.text,
    backgroundColor: Colors.bg,
    textAlign: "center",
  },
  hint: { fontSize: FontSize.xs, color: Colors.dim, textAlign: "center" },

  // Step 2 — Genre selection
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  genreCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: "center",
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  genreEmoji: { fontSize: 36 },
  genreCharName: { fontSize: FontSize.base, fontWeight: "700" },
  genreName: { fontSize: FontSize.xs, color: Colors.dim },
  genreDesc: { fontSize: FontSize.xs, color: Colors.dim, textAlign: "center" },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectedBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },

  // Step 3 — Task selection
  taskCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    padding: 14,
  },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckMark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  taskDesc: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 2 },
  taskXp: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },

  // Navigation
  navRow: { flexDirection: "row", gap: 12 },

  // Step 4 — Egg reveal
  eggContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 20,
  },
  eggAnnounce: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.gold,
  },
  eggVisual: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  eggEmoji: { fontSize: 100 },
  eggGlow: {
    position: "absolute",
    fontSize: 40,
    top: 10,
    right: 10,
    opacity: 0.6,
  },
  eggCharName: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.text,
  },
  eggGenreName: {
    fontSize: FontSize.base,
    color: Colors.dim,
  },
  eggDivider: {
    width: 60,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  eggHint: {
    fontSize: FontSize.sm,
    color: Colors.dim,
    textAlign: "center",
    lineHeight: 20,
  },
});
