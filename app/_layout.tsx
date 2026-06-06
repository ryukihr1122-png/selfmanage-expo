/**
 * ルートレイアウト — 認証プロバイダーでアプリ全体をラップ
 */
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="character"
          options={{ headerShown: true, title: "プロフィール", headerTintColor: Colors.gold, headerStyle: { backgroundColor: Colors.bg } }}
        />
        <Stack.Screen
          name="items"
          options={{ headerShown: true, title: "アイテム", headerTintColor: Colors.gold, headerStyle: { backgroundColor: Colors.bg } }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: true, title: "設定", headerTintColor: Colors.gold, headerStyle: { backgroundColor: Colors.bg } }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: true, title: "通知", headerTintColor: Colors.gold, headerStyle: { backgroundColor: Colors.bg } }}
        />
        <Stack.Screen
          name="legal"
          options={{ headerShown: true, title: "法的情報", headerTintColor: Colors.gold, headerStyle: { backgroundColor: Colors.bg } }}
        />
      </Stack>
      </ToastProvider>
    </AuthProvider>
  );
}
