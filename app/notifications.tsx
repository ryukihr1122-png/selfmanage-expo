/**
 * 通知設定画面（ローカルファースト版）
 *
 * サーバーからの通知一覧は不要。
 * ローカル通知の設定のみ表示。
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import {
  scheduleMorningReminder,
  scheduleEveningReminder,
  cancelAllNotifications,
} from "@/lib/notifications";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function NotificationsScreen() {
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    setScheduled(list);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleEnableAll = async () => {
    await scheduleMorningReminder();
    await scheduleEveningReminder();
    await load();
    Alert.alert("通知ON", "朝7時・夜8時のリマインダーを設定しました");
  };

  const handleDisableAll = async () => {
    await cancelAllNotifications();
    await load();
    Alert.alert("通知OFF", "すべてのリマインダーを解除しました");
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.gold }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <RPGBox style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 40 }}>🔔</Text>
        <Text style={styles.title}>通知リマインダー</Text>
        <Text style={styles.dim}>
          毎朝7時と夜8時にタスクリマインダーを送ります
        </Text>
      </RPGBox>

      <RPGBox style={{ gap: 8 }}>
        <Text style={styles.sectionTitle}>現在のスケジュール</Text>
        {scheduled.length === 0 ? (
          <Text style={styles.dim}>リマインダーは設定されていません</Text>
        ) : (
          scheduled.map((n) => (
            <View key={n.identifier} style={styles.scheduleRow}>
              <Text style={styles.scheduleId}>
                {n.identifier === "morning-reminder" ? "🌅 朝のリマインダー" : "🌙 夜のリマインダー"}
              </Text>
              <Text style={styles.dim}>
                {n.content.title}
              </Text>
            </View>
          ))
        )}
      </RPGBox>

      <RPGButton
        title="リマインダーをONにする"
        onPress={handleEnableAll}
        icon="✅"
      />

      <RPGButton
        title="リマインダーをOFFにする"
        variant="secondary"
        onPress={handleDisableAll}
        icon="🔕"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  title: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  dim: { fontSize: FontSize.sm, color: Colors.dim },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  scheduleRow: { gap: 2, paddingVertical: 4 },
  scheduleId: { fontSize: FontSize.base, fontWeight: "500", color: Colors.text },
});
