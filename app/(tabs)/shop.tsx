/**
 * ショップ画面 — ポイントでアイテム購入
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { api } from "@/lib/api";
import type { ShopItem } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

function effectLabel(effect: Record<string, unknown>): string {
  const type = effect.type as string;
  const value = effect.value as number | undefined;
  const condition = effect.condition as string | undefined;
  const condMap: Record<string, string> = {
    normal: "通常タスク",
    bonus: "ボーナスタスク",
    chain: "連鎖タスク",
    all: "全タスク",
  };
  switch (type) {
    case "xp_multiplier":
      return `${condMap[condition ?? "all"] ?? "全タスク"} EXP +${Math.round((value ?? 0) * 100)}%`;
    case "pt_multiplier":
      return `獲得 Pt +${Math.round((value ?? 0) * 100)}%`;
    case "streak_grace":
      return `ストリーク猶予 ${value ?? 1}日`;
    default:
      return type;
  }
}

export default function ShopScreen() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [shop, me] = await Promise.all([api.getShopItems(), api.getMe()]);
      setItems(shop.items);
      setPoints(me.stats.points);
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

  const handleBuy = async (item: ShopItem) => {
    if (points < item.costPt) {
      Alert.alert("Pt不足", `${item.costPt} Pt 必要です（現在 ${points} Pt）`);
      return;
    }
    Alert.alert("購入確認", `「${item.name}」を ${item.costPt} Pt で購入しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "購入",
        onPress: async () => {
          setBuying(item.id);
          try {
            const res = await api.purchaseItem(item.id);
            setPoints(res.pointsRemaining);
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, owned: true } : i)),
            );
            Alert.alert("購入完了!", `「${item.name}」を手に入れました！`);
          } catch (err) {
            Alert.alert("エラー", err instanceof Error ? err.message : "購入に失敗");
          } finally {
            setBuying(null);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

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
      {/* Pt表示 */}
      <RPGBox variant="gold" style={{ alignItems: "center", padding: 16 }}>
        <Text style={{ fontSize: 24 }}>💰</Text>
        <Text style={styles.pointsText}>{points} Pt</Text>
      </RPGBox>

      {/* アイテムリスト */}
      {items.map((item) => (
        <RPGBox
          key={item.id}
          style={{ padding: 14, opacity: item.owned ? 0.6 : 1 }}
        >
          <View style={styles.itemRow}>
            <Text style={styles.itemEmoji}>{item.iconEmoji}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDesc}>{item.description}</Text>
              )}
              <Text style={styles.itemEffect}>
                {effectLabel(item.effectJson)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={styles.itemCost}>{item.costPt} Pt</Text>
              {item.owned ? (
                <Text style={styles.ownedBadge}>所持済み</Text>
              ) : (
                <RPGButton
                  title="購入"
                  onPress={() => handleBuy(item)}
                  loading={buying === item.id}
                  disabled={points < item.costPt}
                />
              )}
            </View>
          </View>
        </RPGBox>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 40 },

  pointsText: { fontSize: FontSize["2xl"], fontWeight: "700", color: Colors.gold },

  itemRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  itemEmoji: { fontSize: 28 },
  itemName: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  itemDesc: { fontSize: FontSize.sm, color: Colors.dim },
  itemEffect: { fontSize: FontSize.xs, color: Colors.gold },
  itemCost: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },
  ownedBadge: { fontSize: FontSize.xs, color: Colors.green, fontWeight: "600" },
});
