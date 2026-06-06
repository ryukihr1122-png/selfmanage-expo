/**
 * オンボーディング — WAKPカテゴリの習慣選択
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import type { OnboardingAnswers } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const CATEGORIES = [
  {
    key: "wellnessHabits" as const,
    icon: "💧",
    color: "#4caf50",
    label: "ウェルネス",
    description: "心身の健康・睡眠・運動・食事",
    options: [
      "朝のストレッチ",
      "ウォーキング30分",
      "水を2L飲む",
      "7時間睡眠",
      "瞑想10分",
      "野菜を食べる",
      "深呼吸エクサ",
      "お風呂に浸かる",
    ],
  },
  {
    key: "actionHabits" as const,
    icon: "🔥",
    color: "#e53935",
    label: "アクション",
    description: "仕事・タスク管理・生産性",
    options: [
      "朝イチで重要タスク",
      "ポモドーロ2セット",
      "デスク整理",
      "メール処理",
      "週次レビュー",
      "タスクの優先順位付け",
      "1つ断る",
      "15分集中作業",
    ],
  },
  {
    key: "knowledgeHabits" as const,
    icon: "📚",
    color: "#1e88e5",
    label: "ナレッジ",
    description: "学習・読書・アウトプット",
    options: [
      "読書20分",
      "記事を3本読む",
      "学んだことを書く",
      "動画講座15分",
      "英語学習",
      "新技術の調査",
      "ポッドキャスト",
      "ノートまとめ",
    ],
  },
  {
    key: "purposeHabits" as const,
    icon: "🌟",
    color: "#f9a825",
    label: "パーパス",
    description: "目的・感謝・振り返り・人間関係",
    options: [
      "感謝日記",
      "1日の振り返り",
      "目標の確認",
      "誰かに親切にする",
      "家族と会話",
      "ビジョンを書く",
      "自分を褒める",
      "人に感謝を伝える",
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string[]>>({
    wellnessHabits: [],
    actionHabits: [],
    knowledgeHabits: [],
    purposeHabits: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    api
      .getOnboarding()
      .then((data) => {
        const a = data.answers;
        setSelected({
          wellnessHabits: a.wellnessHabits ?? [],
          actionHabits: a.actionHabits ?? [],
          knowledgeHabits: a.knowledgeHabits ?? [],
          purposeHabits: a.purposeHabits ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const toggle = (categoryKey: string, habit: string) => {
    setSelected((prev) => {
      const list = prev[categoryKey] ?? [];
      return {
        ...prev,
        [categoryKey]: list.includes(habit)
          ? list.filter((h) => h !== habit)
          : [...list, habit],
      };
    });
  };

  const handleSave = async () => {
    if (totalSelected === 0) {
      Alert.alert("選択してください", "最低1つの習慣を選んでください");
      return;
    }
    setLoading(true);
    try {
      await api.saveOnboarding(selected as OnboardingAnswers);
      Alert.alert(
        "🌱 冒険が始まります！",
        `${totalSelected}個の習慣がデイリータスクとして登録されました。毎日取り組んでレベルアップしましょう！`,
        [{ text: "始める！", onPress: () => router.replace("/(tabs)") }],
      );
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "保存に失敗");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const totalSelected = Object.values(selected).flat().length;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🌱</Text>
        <Text style={styles.headerTitle}>習慣カテゴリを選ぼう</Text>
        <Text style={styles.headerSub}>
          日々取り組みたい習慣を選んでください。後から変更できます。
        </Text>
      </View>

      {CATEGORIES.map((cat) => {
        const catSelected = selected[cat.key] ?? [];
        return (
          <RPGBox key={cat.key} style={{ gap: 10 }}>
            <View style={styles.catHeader}>
              <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              <View>
                <Text style={[styles.catLabel, { color: cat.color }]}>
                  {cat.label}
                </Text>
                <Text style={styles.catDesc}>{cat.description}</Text>
              </View>
            </View>

            <View style={styles.optionsGrid}>
              {cat.options.map((opt) => {
                const isSelected = catSelected.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggle(cat.key, opt)}
                    style={[
                      styles.optionChip,
                      {
                        borderColor: isSelected ? cat.color : Colors.border,
                        backgroundColor: isSelected
                          ? `${cat.color}15`
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? cat.color : Colors.dim },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </RPGBox>
        );
      })}

      <RPGButton
        title={`保存して始める（${totalSelected}件選択中）`}
        onPress={handleSave}
        loading={loading}
        icon="✨"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  header: { alignItems: "center", gap: 6, paddingVertical: 20 },
  headerIcon: { fontSize: 48 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.gold },
  headerSub: { fontSize: FontSize.sm, color: Colors.dim, textAlign: "center" },

  catHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  catLabel: { fontSize: FontSize.md, fontWeight: "700" },
  catDesc: { fontSize: FontSize.xs, color: Colors.dim },

  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionText: { fontSize: FontSize.sm },
});
