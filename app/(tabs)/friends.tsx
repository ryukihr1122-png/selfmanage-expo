/**
 * 仲間画面 — フレンドリスト・検索・申請
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { api } from "@/lib/api";
import type { FriendEntry } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { RPGInput } from "@/components/RPGInput";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

export default function FriendsScreen() {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pending, setPending] = useState<FriendEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; displayName: string; level: number }>
  >([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getFriends();
      setFriends(data.friends);
      setPending(data.pendingReceived);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchUsers(searchQuery.trim());
      setSearchResults(data.users);
    } catch {
      Alert.alert("エラー", "検索に失敗しました");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      Alert.alert("送信完了", "フレンド申請を送りました！");
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "送信に失敗");
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await api.acceptFriendRequest(friendshipId);
      load();
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "承認に失敗");
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.gold}
        />
      }
    >
      {/* 検索 */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <RPGInput
            placeholder="冒険者名で検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <RPGButton title="検索" onPress={handleSearch} loading={searching} />
      </View>

      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 検索結果</Text>
          {searchResults.map((u) => (
            <RPGBox key={u.id} style={{ padding: 12 }}>
              <View style={styles.friendRow}>
                <View>
                  <Text style={styles.friendName}>{u.displayName}</Text>
                  <Text style={styles.friendSub}>Lv.{u.level}</Text>
                </View>
                <RPGButton
                  title="申請"
                  onPress={() => handleSendRequest(u.id)}
                  icon="👋"
                />
              </View>
            </RPGBox>
          ))}
        </View>
      )}

      {/* 申請受信 */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📩 フレンド申請</Text>
          {pending.map((p) => (
            <RPGBox key={p.friendshipId} variant="gold" style={{ padding: 12 }}>
              <View style={styles.friendRow}>
                <View>
                  <Text style={styles.friendName}>{p.displayName}</Text>
                  <Text style={styles.friendSub}>Lv.{p.level}</Text>
                </View>
                <RPGButton
                  title="承認"
                  onPress={() => handleAccept(p.friendshipId)}
                  icon="✅"
                />
              </View>
            </RPGBox>
          ))}
        </View>
      )}

      {/* フレンドリスト */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 仲間 ({friends.length})</Text>
        {friends.length === 0 ? (
          <RPGBox style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>👥</Text>
            <Text style={styles.emptyText}>まだ仲間がいません</Text>
            <Text style={styles.emptyHint}>上の検索から冒険者を探しましょう</Text>
          </RPGBox>
        ) : (
          friends.map((f) => (
            <RPGBox key={f.friendshipId} style={{ padding: 12 }}>
              <View style={styles.friendRow}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.friendName}>{f.displayName}</Text>
                    {f.isOnline && (
                      <View style={styles.onlineDot} />
                    )}
                  </View>
                  <Text style={styles.friendSub}>
                    Lv.{f.level} · {f.streakDays}日連続
                  </Text>
                </View>
              </View>
            </RPGBox>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  section: { gap: 8 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendName: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  friendSub: { fontSize: FontSize.sm, color: Colors.dim, marginTop: 2 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.dim, marginTop: 8 },
  emptyHint: { fontSize: FontSize.xs, color: Colors.dim, marginTop: 4 },
});
