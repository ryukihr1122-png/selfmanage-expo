/**
 * ルートレイアウト（ローカルファースト版）
 *
 * - SQLiteProvider でDB初期化
 * - AppProvider で起動時処理
 * - 認証画面なし（ローカルDB）
 */
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { AppProvider } from "@/contexts/AppContext";
import { ToastProvider } from "@/components/Toast";
import { migrateIfNeeded } from "@/db/schema";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="selfmanage.db" onInit={migrateIfNeeded}>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="character"
              options={{
                headerShown: true,
                title: "プロフィール",
                headerTintColor: Colors.gold,
                headerStyle: { backgroundColor: Colors.bg },
              }}
            />
            <Stack.Screen
              name="items"
              options={{
                headerShown: true,
                title: "アイテム",
                headerTintColor: Colors.gold,
                headerStyle: { backgroundColor: Colors.bg },
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                headerShown: true,
                title: "設定",
                headerTintColor: Colors.gold,
                headerStyle: { backgroundColor: Colors.bg },
              }}
            />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: true,
                title: "通知",
                headerTintColor: Colors.gold,
                headerStyle: { backgroundColor: Colors.bg },
              }}
            />
            <Stack.Screen
              name="legal"
              options={{
                headerShown: true,
                title: "法的情報",
                headerTintColor: Colors.gold,
                headerStyle: { backgroundColor: Colors.bg },
              }}
            />
          </Stack>
        </ToastProvider>
      </AppProvider>
    </SQLiteProvider>
  );
}
