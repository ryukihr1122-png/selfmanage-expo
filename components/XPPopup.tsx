/**
 * タスク完了時のEXPポップアップ & レベルアップ演出
 */
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import { Colors, FontSize } from "@/constants/theme";

interface XPPopupProps {
  xpGained: number;
  levelUp?: boolean;
  newLevel?: number;
  visible: boolean;
  onDone: () => void;
}

export function XPPopup({ xpGained, levelUp, newLevel, visible, onDone }: XPPopupProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(30);
    scale.setValue(0.5);

    Animated.sequence([
      // Pop in
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(levelUp ? 1800 : 1000),
      // Fade out & float up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -40,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone());
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.popup,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {levelUp ? (
          <>
            <Text style={styles.levelUpIcon}>⚔️</Text>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            <Text style={styles.levelNumber}>Lv. {newLevel}</Text>
            <Text style={styles.xpText}>+{xpGained} EXP</Text>
          </>
        ) : (
          <>
            <Text style={styles.xpIcon}>✨</Text>
            <Text style={styles.xpText}>+{xpGained} EXP</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  popup: {
    backgroundColor: "rgba(58, 48, 32, 0.92)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: "center",
    minWidth: width * 0.5,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  xpIcon: { fontSize: 32, marginBottom: 4 },
  xpText: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.gold,
  },
  levelUpIcon: { fontSize: 48, marginBottom: 4 },
  levelUpText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffd700",
    letterSpacing: 3,
  },
  levelNumber: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
});
