/**
 * RPGスタイルのテキスト入力
 */
import React from "react";
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { Colors, BorderRadius, FontSize } from "@/constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function RPGInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={Colors.dim}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.dim,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.red,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.red,
  },
});
