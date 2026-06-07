/**
 * 設定画面（ローカルファースト版）
 *
 * - バックアップ / リストア
 * - オンボーディング再設定
 * - 法的情報
 * - データリセット
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getProfile, type Profile } from "@/db/repository";
import {
  shareBackup,
  restoreFromFile,
  getLastBackupDate,
} from "@/db/backup";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    getLastBackupDate().then(setLastBackup).catch(() => {});
  }, []);

  const handleBackup = async () => {
    setBacking(true);
    try {
      await shareBackup();
      const date = await getLastBackupDate();
      setLastBackup(date);
      Alert.alert("バックアップ完了", "ファイルを保存・共有してください");
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "バックアップに失敗");
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      "データの復元",
      "現在のデータはすべて上書きされます。続行しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "復元する",
          onPress: async () => {
            setRestoring(true);
            try {
              await restoreFromFile();
              const p = await getProfile();
              setProfile(p);
              Alert.alert("復元完了", "データを復元しました。アプリを再起動してください。");
            } catch (err) {
              Alert.alert("エラー", err instanceof Error ? err.message : "復元に失敗");
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  const handleResetData = () => {
    Alert.alert(
      "データをリセット",
      "すべてのデータが削除されます。この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "リセットする",
          style: "destructive",
          onPress: () => {
            Alert.alert("確認", "本当にリセットしますか？", [
              { text: "キャンセル", style: "cancel" },
              {
                text: "はい、リセットする",
                style: "destructive",
                onPress: async () => {
                  try {
                    // DB削除 → アプリ再起動を促す
                    const { getDB } = await import("@/db/repository");
                    const db = await getDB();
                    await db.execAsync(`
                      DELETE FROM task_events;
                      DELETE FROM daily_tasks;
                      DELETE FROM recurring_tasks;
                      DELETE FROM user_items;
                      DELETE FROM user_titles;
                      DELETE FROM pt_events;
                      DELETE FROM login_bonuses;
                      DELETE FROM ad_reward_logs;
                      DELETE FROM daily_challenges;
                      DELETE FROM onboarding;
                      UPDATE profile SET total_xp = 0, level = 1, points = 0, streak_days = 0, last_qualified_date = NULL, active_title = NULL WHERE id = 1;
                    `);
                    Alert.alert("リセット完了", "アプリを再起動してください。");
                  } catch (err) {
                    Alert.alert("エラー", err instanceof Error ? err.message : "リセットに失敗");
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* プロフィール情報 */}
      <RPGBox>
        <Text style={styles.label}>冒険者名</Text>
        <Text style={styles.value}>{profile?.displayName ?? "冒険者"}</Text>
      </RPGBox>

      <RPGBox>
        <Text style={styles.label}>レベル</Text>
        <Text style={styles.value}>Lv.{profile?.level ?? 1}（{profile?.totalXp ?? 0} EXP）</Text>
      </RPGBox>

      {/* 習慣設定 */}
      <RPGButton
        title="習慣を再設定"
        variant="secondary"
        onPress={() => router.push("/onboarding")}
        icon="🌟"
      />

      {/* バックアップ・リストア */}
      <RPGBox style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>💾 バックアップ</Text>
        <Text style={styles.dim}>
          {lastBackup
            ? `前回のバックアップ: ${lastBackup}`
            : "まだバックアップしていません"}
        </Text>
        <RPGButton
          title="データをエクスポート"
          variant="secondary"
          onPress={handleBackup}
          loading={backing}
          icon="📤"
        />
        <RPGButton
          title="データをインポート（復元）"
          variant="secondary"
          onPress={handleRestore}
          loading={restoring}
          icon="📥"
        />
      </RPGBox>

      {/* 法的情報 */}
      <RPGBox>
        <Text style={styles.sectionTitle}>法的情報</Text>
        <RPGButton
          title="プライバシーポリシー"
          variant="ghost"
          onPress={() => router.push("/legal?type=privacy")}
          icon="📜"
        />
        <RPGButton
          title="利用規約"
          variant="ghost"
          onPress={() => router.push("/legal?type=terms")}
          icon="📋"
        />
      </RPGBox>

      {/* データリセット */}
      <View style={{ marginTop: 40 }}>
        <RPGButton
          title="データをリセット"
          variant="danger"
          onPress={handleResetData}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  label: { fontSize: FontSize.sm, color: Colors.dim, marginBottom: 4 },
  value: { fontSize: FontSize.base, color: Colors.text, fontWeight: "500" },
  dim: { fontSize: FontSize.sm, color: Colors.dim },
  sectionTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.text, marginBottom: 4 },
});
