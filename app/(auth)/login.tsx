/**
 * ログイン画面
 */
import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { RPGInput } from "@/components/RPGInput";
import { RPGButton } from "@/components/RPGButton";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ロゴ */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🌱</Text>
          <Text style={styles.logoText}>SelfManage</Text>
          <Text style={styles.subtitle}>自分を育てる冒険を始めよう</Text>
        </View>

        {/* フォーム */}
        <View style={styles.form}>
          <RPGInput
            label="メールアドレス"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <RPGInput
            label="パスワード"
            placeholder="パスワードを入力"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <RPGButton
            title="ログイン"
            onPress={handleLogin}
            loading={loading}
            icon="⚔️"
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>アカウントをお持ちでない方は </Text>
            <Link href="/(auth)/register" style={styles.link}>
              新規登録
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 56,
  },
  logoText: {
    fontSize: FontSize["3xl"],
    fontWeight: "700",
    color: Colors.gold,
    marginTop: 8,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.dim,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.red,
    textAlign: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  linkText: {
    fontSize: FontSize.sm,
    color: Colors.dim,
  },
  link: {
    fontSize: FontSize.sm,
    color: Colors.gold,
    fontWeight: "600",
  },
});
