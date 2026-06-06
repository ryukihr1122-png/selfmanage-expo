/**
 * 新規登録画面
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

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError("すべての項目を入力してください");
      return;
    }
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
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
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🌱</Text>
          <Text style={styles.logoText}>新規登録</Text>
          <Text style={styles.subtitle}>冒険者の名前を決めよう</Text>
        </View>

        <View style={styles.form}>
          <RPGInput
            label="冒険者名"
            placeholder="表示名を入力"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
          />
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
            placeholder="6文字以上"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <RPGInput
            label="パスワード（確認）"
            placeholder="もう一度入力"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <RPGButton
            title="冒険を始める"
            onPress={handleRegister}
            loading={loading}
            icon="🌟"
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>既にアカウントをお持ちの方は </Text>
            <Link href="/(auth)/login" style={styles.link}>
              ログイン
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
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
  },
  logoText: {
    fontSize: FontSize["2xl"],
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
    gap: 14,
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
