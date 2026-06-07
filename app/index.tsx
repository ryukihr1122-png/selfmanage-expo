/**
 * エントリポイント — オンボーディング状態に応じてリダイレクト
 *
 * ローカルファースト: 認証不要。
 * 初回起動 → オンボーディング、以降 → ホーム。
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useApp } from "@/contexts/AppContext";
import { getOnboarding } from "@/db/repository";
import { Colors, FontSize } from "@/constants/theme";

export default function Index() {
  const { isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    (async () => {
      const onboarding = await getOnboarding();
      const hasHabits =
        (onboarding?.wellnessHabits?.length ?? 0) > 0 ||
        (onboarding?.actionHabits?.length ?? 0) > 0 ||
        (onboarding?.knowledgeHabits?.length ?? 0) > 0 ||
        (onboarding?.purposeHabits?.length ?? 0) > 0;

      if (hasHabits) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    })();
  }, [isLoading, router]);

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
