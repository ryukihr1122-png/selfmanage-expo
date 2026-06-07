/**
 * タブナビゲーション（ローカルファースト版）
 *
 * フレンドタブ削除。認証不要。
 */
import React from "react";
import { Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import { LoginBonusModal } from "@/components/LoginBonusModal";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Colors, FontSize } from "@/constants/theme";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconActive]}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  const { isLoading, loginBonus, dismissLoginBonus } = useApp();

  if (isLoading) return null;

  return (
    <>
      {loginBonus && (
        <LoginBonusModal bonus={loginBonus} onDismiss={dismissLoginBonus} />
      )}
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.gold,
          headerTitleStyle: { fontWeight: "600" },
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
          },
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: Colors.dim,
          tabBarLabelStyle: { fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "ホーム",
            headerTitle: "🌱 SelfManage",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="quest"
          options={{
            title: "タスク",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="✅" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "ステータス",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📊" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "ショップ",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🛍️" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
});
