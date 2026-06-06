/**
 * RPG羊皮紙テーマ — 全画面で使うカラー・フォントサイズ定義
 */

export const LightColors = {
  bg: "#f5f0e8",
  card: "#fffaf2",
  cardActive: "#f0e8d8",
  border: "#e0cbb0",
  borderGold: "#c49a28",
  text: "#2c1a08",
  dim: "#8a6848",
  gold: "#c4870a",
  goldDim: "#8b6008",
  goldGlow: "rgba(196, 135, 10, 0.16)",
  green: "#2a7a4a",
  greenGlow: "rgba(42, 122, 74, 0.13)",
  red: "#b83020",
  amber: "#c47a0a",
  white: "#ffffff",
} as const;

export const DarkColors = {
  bg: "#1a1510",
  card: "#2a221a",
  cardActive: "#3a2e22",
  border: "#4a3c2e",
  borderGold: "#c49a28",
  text: "#e8dfd0",
  dim: "#9a8a70",
  gold: "#d4a020",
  goldDim: "#b08818",
  goldGlow: "rgba(212, 160, 32, 0.2)",
  green: "#3a9a5a",
  greenGlow: "rgba(58, 154, 90, 0.18)",
  red: "#d84030",
  amber: "#d49a1a",
  white: "#ffffff",
} as const;

// 初期値はライトテーマ。useColorScheme() で切り替える。
// 直接参照用のデフォルト（ライトモード）
export const Colors = LightColors;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
