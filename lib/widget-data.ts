/**
 * iOS Widget データ共有
 *
 * App Group 経由でウィジェットとデータを共有する。
 * react-native-shared-group-preferences を使用。
 *
 * ウィジェット本体は EAS Build 時に iOS ネイティブで追加する必要がある。
 * ここではアプリ側からの書き込みロジックのみ定義。
 *
 * TODO: ウィジェット本体（SwiftUI）の実装は App Store 提出フェーズで対応
 */

import { Platform } from "react-native";

// App Group ID
const APP_GROUP = "group.com.aokiryousuke.selfmanage";

interface WidgetData {
  level: number;
  streakDays: number;
  todayCompleted: number;
  todayTotal: number;
  points: number;
  lastUpdated: string;
}

/**
 * ウィジェット用データを更新
 * 現時点では App Group 未導入のため no-op。
 * react-native-shared-group-preferences 導入後に有効化。
 */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    // TODO: ネイティブモジュール導入後に有効化
    // import SharedGroupPreferences from "react-native-shared-group-preferences";
    // await SharedGroupPreferences.setItem("widgetData", data, APP_GROUP);
    console.log("[widget] Data updated:", data);
  } catch (err) {
    console.error("[widget] Failed to update widget data:", err);
  }
}

/**
 * タスク完了時やデータ更新時に呼ぶ
 */
export function buildWidgetData(stats: {
  level: number;
  streakDays: number;
  points: number;
}, todayTasks: { isCompleted: boolean }[]): WidgetData {
  return {
    level: stats.level,
    streakDays: stats.streakDays,
    todayCompleted: todayTasks.filter((t) => t.isCompleted).length,
    todayTotal: todayTasks.length,
    points: stats.points,
    lastUpdated: new Date().toISOString(),
  };
}
