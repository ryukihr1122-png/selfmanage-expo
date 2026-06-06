/**
 * RPGスタイルのボタン
 */
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Colors, BorderRadius, FontSize } from "@/constants/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export function RPGButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  icon,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "ghost" ? Colors.gold : Colors.white}
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text
            style={[styles.text, textStyles[variant], isDisabled && styles.disabledText]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  icon: {
    fontSize: FontSize.lg,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDim,
  },
  secondary: {
    backgroundColor: "transparent",
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
  },
};

const textStyles: Record<Variant, { color: string }> = {
  primary: { color: Colors.white },
  secondary: { color: Colors.text },
  danger: { color: Colors.white },
  ghost: { color: Colors.gold },
};
