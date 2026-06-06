/**
 * 通知一覧画面
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { api } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
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

  const handleRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.gold }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
      }
    >
      {notifications.length === 0 ? (
        <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
          <Text style={{ fontSize: 40 }}>🔔</Text>
          <Text style={styles.dim}>通知はありません</Text>
        </RPGBox>
      ) : (
        notifications.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => handleRead(n.id)}>
            <RPGBox
              style={{
                padding: 14,
                opacity: n.isRead ? 0.6 : 1,
              }}
            >
              <View style={styles.notifRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.dim}>{n.body}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.time}>{formatTime(n.createdAt)}</Text>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>
              </View>
            </RPGBox>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: Spacing.lg, gap: 8, paddingBottom: 40 },
  dim: { fontSize: FontSize.sm, color: Colors.dim },
  notifRow: { flexDirection: "row", gap: 12 },
  notifTitle: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  time: { fontSize: FontSize.xs, color: Colors.dim },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
});
