/**
 * 設定画面
 */
import React from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { RPGBox } from "@/components/RPGBox";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "アカウント削除",
      "この操作は取り消せません。すべてのデータが削除されます。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteAccount();
              await logout();
              router.replace("/(auth)/login");
            } catch (err) {
              Alert.alert("エラー", err instanceof Error ? err.message : "削除に失敗");
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <RPGBox>
        <Text style={styles.label}>冒険者名</Text>
        <Text style={styles.value}>{user?.displayName ?? "-"}</Text>
      </RPGBox>

      <RPGBox>
        <Text style={styles.label}>メールアドレス</Text>
        <Text style={styles.value}>{user?.email ?? "-"}</Text>
      </RPGBox>

      <RPGButton
        title="オンボーディングを再設定"
        variant="secondary"
        onPress={() => router.push("/onboarding")}
        icon="🌟"
      />

      <RPGButton title="ログアウト" variant="secondary" onPress={handleLogout} icon="🚪" />

      <RPGBox>
        <Text style={styles.sectionTitle}>法的情報</Text>
        <RPGButton
          title="プライバシーポリシー"
          variant="ghost"
          onPress={() => router.push("/legal?type=privacy")}
          icon="📜"
        />
        <RPGButton
          title="利用規約"
          variant="ghost"
          onPress={() => router.push("/legal?type=terms")}
          icon="📋"
        />
      </RPGBox>

      <View style={{ marginTop: 40 }}>
        <RPGButton
          title="アカウントを削除"
          variant="danger"
          onPress={handleDeleteAccount}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  label: { fontSize: FontSize.sm, color: Colors.dim, marginBottom: 4 },
  value: { fontSize: FontSize.base, color: Colors.text, fontWeight: "500" },
  sectionTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.text, marginBottom: 8 },
});
