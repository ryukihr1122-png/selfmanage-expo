/**
 * ステータス画面 — レベル・EXP・WAKP詳細・ストリーク
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { api } from "@/lib/api";
import type { MeResponse, OnboardingAnswers } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const WAKP = [
  { key: "W", habitsKey: "wellnessHabits", icon: "💧", color: "#4caf50", label: "ウェルネス" },
  { key: "A", habitsKey: "actionHabits", icon: "🔥", color: "#e53935", label: "アクション" },
  { key: "K", habitsKey: "knowledgeHabits", icon: "📚", color: "#1e88e5", label: "ナレッジ" },
  { key: "P", habitsKey: "purposeHabits", icon: "🌟", color: "#f9a825", label: "パーパス" },
] as const;

export default function StatsScreen() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [habits, setHabits] = useState<Partial<OnboardingAnswers> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMe(), api.getOnboarding().catch(() => null)])
      .then(([meRes, onboarding]) => {
        setMe(meRes);
        if (onboarding) setHabits(onboarding.answers);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !me) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const { stats } = me;
  const xpInLevel = stats.totalXp % 100;
  const xpPct = Math.round((xpInLevel / 100) * 100);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* メインステータス */}
      <RPGBox style={{ alignItems: "center", gap: 12 }}>
        <Text style={styles.levelBig}>Lv.{stats.level}</Text>
        <View style={styles.xpBarWide}>
          <View style={[styles.xpBarFill, { width: `${xpPct}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xpInLevel} / 100 EXP（総計 {stats.totalXp} EXP）
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statIcon}>{stats.streakDays >= 3 ? "🔥" : "💧"}</Text>
            <Text style={styles.statValue}>{stats.streakDays}</Text>
            <Text style={styles.statCaption}>日連続</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{stats.points}</Text>
            <Text style={styles.statCaption}>Pt</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{stats.totalXp}</Text>
            <Text style={styles.statCaption}>総EXP</Text>
          </View>
        </View>
      </RPGBox>

      {/* WAKPカテゴリ詳細 */}
      <Text style={styles.sectionTitle}>📊 カテゴリ別ステータス</Text>
      {WAKP.map((w) => {
        const wHabits =
          (habits?.[w.habitsKey as keyof OnboardingAnswers] as string[] | undefined) ?? [];
        const companionXp = Math.floor(stats.totalXp / 4);
        const level = Math.floor(companionXp / 25) + 1;
        const pct = Math.round(((companionXp % 25) / 25) * 100);

        return (
          <RPGBox key={w.key} style={{ padding: 14 }}>
            <View style={styles.wakpRow}>
              <Text style={{ fontSize: 24 }}>{w.icon}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.wakpHeader}>
                  <Text style={[styles.wakpLabel, { color: w.color }]}>
                    {w.key} — {w.label}
                  </Text>
                  <Text style={[styles.wakpLevel, { color: w.color }]}>
                    Lv.{level}
                  </Text>
                </View>
                <View style={styles.xpBarSmall}>
                  <View
                    style={[
                      styles.xpBarFillSmall,
                      { width: `${pct}%`, backgroundColor: w.color },
                    ]}
                  />
                </View>
                {wHabits.length > 0 && (
                  <View style={styles.habitsRow}>
                    {wHabits.map((h) => (
                      <View
                        key={h}
                        style={[styles.habitChip, { borderColor: w.color }]}
                      >
                        <Text style={[styles.habitChipText, { color: w.color }]}>
                          {h}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </RPGBox>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  levelBig: { fontSize: FontSize["3xl"], fontWeight: "700", color: Colors.gold },
  xpBarWide: {
    width: "100%",
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 99,
  },
  xpText: { fontSize: FontSize.sm, color: Colors.dim },

  statsGrid: { flexDirection: "row", gap: 24, marginTop: 8 },
  statCell: { alignItems: "center", gap: 2 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  statCaption: { fontSize: FontSize.xs, color: Colors.dim },

  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },

  wakpRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  wakpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wakpLabel: { fontSize: FontSize.sm, fontWeight: "600" },
  wakpLevel: { fontSize: FontSize.sm, fontWeight: "700" },
  xpBarSmall: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  xpBarFillSmall: { height: "100%", borderRadius: 99 },
  habitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  habitChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  habitChipText: { fontSize: FontSize.xs },
});
