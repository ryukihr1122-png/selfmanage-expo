/**
 * カラーテーマフック
 *
 * システム設定に応じてライト/ダークテーマを切り替える。
 * 現時点では Colors は静的参照（ライトモード固定）のまま。
 * 段階的に useTheme() で動的に切り替えていく。
 */
import { useColorScheme } from "react-native";
import { LightColors, DarkColors } from "@/constants/theme";

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  return { colors, isDark };
}
