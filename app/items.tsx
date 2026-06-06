/**
 * アイテム一覧画面（インベントリ）
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { api } from "@/lib/api";
import type { UserItem } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function ItemsScreen() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getMyItems()
      .then((data) => setItems(data.items))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.gold }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <RPGBox style={{ alignItems: "center", paddingVertical: 48 }}>
          <Text style={{ fontSize: 40 }}>🎒</Text>
          <Text style={styles.dim}>アイテムはまだありません</Text>
          <Text style={[styles.dim, { fontSize: FontSize.xs }]}>
            ショップで購入しましょう
          </Text>
        </RPGBox>
      ) : (
        items.map((item) => (
          <RPGBox key={item.userItemId} style={{ padding: 14 }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 28 }}>{item.iconEmoji}</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.dim}>{item.description}</Text>
                )}
                <Text style={styles.type}>
                  {item.itemType === "equipment"
                    ? `装備品（${item.slot ?? ""}）`
                    : item.itemType === "consumable"
                      ? "消費アイテム"
                      : "称号"}
                  {item.isEquipped && " · 装備中"}
                </Text>
              </View>
              <Text style={styles.qty}>×{item.quantity}</Text>
            </View>
          </RPGBox>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  dim: { fontSize: FontSize.sm, color: Colors.dim },
  type: { fontSize: FontSize.xs, color: Colors.gold },
  qty: { fontSize: FontSize.md, fontWeight: "600", color: Colors.dim },
});
