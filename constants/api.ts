/**
 * API設定
 * 開発時はローカル、本番はRailwayのURLを参照
 */
import Constants from "expo-constants";

const DEV_API_URL = "http://localhost:3000";

// EAS buildのextra、もしくはprocess.envから取得
const PROD_API_URL =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.apiUrl ??
  "https://selfmanage-app-production.up.railway.app";

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
