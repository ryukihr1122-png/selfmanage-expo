/**
 * RPGスタイルのカードコンポーネント
 */
import React from "react";
import { View, type ViewStyle, StyleSheet } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

type Variant = "default" | "gold" | "green" | "red";

interface Props {
  variant?: Variant;
  style?: ViewStyle;
  children: React.ReactNode;
}

const borderColors: Record<Variant, string> = {
  default: Colors.border,
  gold: Colors.borderGold,
  green: Colors.green,
  red: Colors.red,
};

const bgColors: Record<Variant, string> = {
  default: Colors.card,
  gold: Colors.card,
  green: Colors.card,
  red: Colors.card,
};

export function RPGBox({ variant = "default", style, children }: Props) {
  return (
    <View
      style={[
        styles.box,
        {
          borderColor: borderColors[variant],
          backgroundColor: bgColors[variant],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 16,
  },
});
