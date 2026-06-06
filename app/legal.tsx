import { useLocalSearchParams, Stack } from "expo-router";
import { WebView } from "react-native-webview";
import { StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import { Colors } from "@/constants/theme";

const LEGAL_FILES: Record<string, number> = {
  privacy: require("@/assets/legal/privacy-policy.html"),
  terms: require("@/assets/legal/terms-of-service.html"),
};

const TITLES: Record<string, string> = {
  privacy: "プライバシーポリシー",
  terms: "利用規約",
};

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const key = type || "privacy";
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(LEGAL_FILES[key]);
        await asset.downloadAsync();
        if (asset.localUri) {
          const content = await FileSystem.readAsStringAsync(asset.localUri);
          setHtml(content);
        }
      } catch {
        setHtml("<html><body><p>読み込みに失敗しました</p></body></html>");
      }
    })();
  }, [key]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: TITLES[key] || "Legal" }} />
      {html ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.webview}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  webview: { flex: 1 },
});
