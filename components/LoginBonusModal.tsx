/**
 * ログインボーナス表示モーダル
 */
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, BorderRadius } from "@/constants/theme";
import { RPGButton } from "./RPGButton";
import type { LoginBonusResult } from "@/db/repository";

interface Props {
  bonus: LoginBonusResult;
  onDismiss: () => void;
}

export function LoginBonusModal({ bonus, onDismiss }: Props) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.icon}>🎁</Text>
          <Text style={styles.title}>ログインボーナス!</Text>
          <Text style={styles.streak}>
            {bonus.consecutiveDays}日連続ログイン
          </Text>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardIcon}>💰</Text>
            <Text style={styles.rewardText}>+{bonus.ptAwarded} Pt</Text>
          </View>

          <Text style={styles.hint}>
            毎日ログインするとボーナスが増えていきます！
          </Text>

          <RPGButton title="受け取る" onPress={onDismiss} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.borderGold,
    borderRadius: BorderRadius.xl,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.gold,
  },
  streak: {
    fontSize: FontSize.md,
    color: Colors.dim,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.md,
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardText: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.gold,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.dim,
    textAlign: "center",
  },
});
