/**
 * オフライン時に画面上部にバナー表示
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { FontSize } from "@/constants/theme";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 オフラインモード — 接続を確認してください</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#e53935",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
});
