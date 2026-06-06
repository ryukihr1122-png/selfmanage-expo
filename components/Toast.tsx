/**
 * 軽量トースト通知
 */
import React, { useEffect, useRef, createContext, useContext, useState, useCallback } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import { Colors, FontSize, BorderRadius } from "@/constants/theme";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastType = "info") => {
    const id = ++nextId;
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {messages.map((msg) => (
          <ToastItem key={msg.id} message={msg} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ message }: { message: ToastMessage }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  const bgColors: Record<ToastType, string> = {
    success: "#2e7d32",
    error: "#c62828",
    info: "#3a3020",
  };

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColors[message.type], opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.toastText}>
        {icons[message.type]} {message.text}
      </Text>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    maxWidth: width * 0.85,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
