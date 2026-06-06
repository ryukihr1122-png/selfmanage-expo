/**
 * エントリポイント — 認証状態に応じてリダイレクト
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, FontSize } from "@/constants/theme";

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌱</Text>
      <Text style={styles.title}>SelfManage</Text>
      <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: FontSize["2xl"],
    fontWeight: "700",
    color: Colors.gold,
    marginTop: 12,
  },
});
