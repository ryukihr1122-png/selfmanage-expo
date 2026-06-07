/**
 * キャラクター（プロフィール）画面（ローカルファースト版）
 */
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import {
  getProfile,
  getMyItems,
  equipItem,
  unequipItem,
  type Profile,
  type UserItem,
} from "@/db/repository";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const SLOTS = [
  { key: "weapon", label: "道具", icon: "🛠️" },
  { key: "armor", label: "防具", icon: "🛡️" },
  { key: "accessory", label: "アクセサリ", icon: "💍" },
] as const;

export default function CharacterScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile(), getMyItems().catch(() => [] as UserItem[])])
      .then(([p, inv]) => {
        setProfile(p);
        setItems(inv);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleEquip = async (userItemId: string) => {
    try {
      await equipItem(userItemId);
      setItems((prev) =>
        prev.map((i) => ({ ...i, isEquipped: i.userItemId === userItemId ? true : i.isEquipped })),
      );
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "装備に失敗");
    }
  };

  const handleUnequip = async (userItemId: string) => {
    try {
      await unequipItem(userItemId);
      setItems((prev) =>
        prev.map((i) => ({ ...i, isEquipped: i.userItemId === userItemId ? false : i.isEquipped })),
      );
    } catch (err) {
      Alert.alert("エラー", err instanceof Error ? err.message : "解除に失敗");
    }
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const equippedBySlot = new Map<string, UserItem>();
  items.filter((i) => i.isEquipped && i.slot).forEach((i) => equippedBySlot.set(i.slot!, i));

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* プロフィールヘッダ */}
      <RPGBox style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 48 }}>👤</Text>
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.levelText}>Lv.{profile.level}</Text>
        <Text style={styles.dim}>
          総EXP {profile.totalXp} · {profile.streakDays}日連続 · {profile.points} Pt
        </Text>
      </RPGBox>

      {/* 装備スロット */}
      <Text style={styles.sectionTitle}>⚔️ 装備</Text>
      {SLOTS.map((slot) => {
        const equipped = equippedBySlot.get(slot.key);
        return (
          <RPGBox key={slot.key} style={{ padding: 14 }}>
            <View style={styles.slotRow}>
              <View style={styles.slotIcon}>
                <Text style={{ fontSize: 24 }}>{slot.icon}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                {equipped ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 18 }}>{equipped.iconEmoji}</Text>
                    <Text style={styles.equippedName}>{equipped.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.dim}>未装備</Text>
                )}
              </View>
              {equipped && (
                <RPGButton
                  title="外す"
                  variant="ghost"
                  onPress={() => handleUnequip(equipped.userItemId)}
                />
              )}
            </View>
          </RPGBox>
        );
      })}

      {/* 所持アイテムから装備 */}
      <Text style={styles.sectionTitle}>🎒 所持アイテム</Text>
      {items.filter((i) => i.itemType === "equipment" && !i.isEquipped).length === 0 ? (
        <RPGBox style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={styles.dim}>装備可能なアイテムはありません</Text>
        </RPGBox>
      ) : (
        items
          .filter((i) => i.itemType === "equipment" && !i.isEquipped)
          .map((item) => (
            <RPGBox key={item.userItemId} style={{ padding: 14 }}>
              <View style={styles.slotRow}>
                <Text style={{ fontSize: 24 }}>{item.iconEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.equippedName}>{item.name}</Text>
                  <Text style={styles.dim}>{item.slot ?? ""}</Text>
                </View>
                <RPGButton
                  title="装備"
                  onPress={() => handleEquip(item.userItemId)}
                />
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
  loadingText: { fontSize: FontSize.base, color: Colors.gold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  name: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  levelText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.gold },
  dim: { fontSize: FontSize.sm, color: Colors.dim },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  slotIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  slotLabel: { fontSize: FontSize.xs, color: Colors.dim },
  equippedName: { fontSize: FontSize.base, fontWeight: "500", color: Colors.text },
});
