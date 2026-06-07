/**
 * プッシュ通知ヘルパー（ローカルファースト版）
 *
 * - ローカル通知スケジュール（毎朝・夜リマインダー）
 * - サーバー登録は不要（ローカルDB）
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// フォアグラウンド受信時の挙動
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知パーミッションを要求
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[notifications] Push only works on physical devices");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[notifications] Permission not granted");
    return null;
  }

  // iOS バッジリセット
  if (Platform.OS === "ios") {
    await Notifications.setBadgeCountAsync(0);
  }

  return "local-only";
}

/**
 * 毎朝のリマインダーをスケジュール（ローカル通知）
 */
export async function scheduleMorningReminder(): Promise<void> {
  await cancelScheduledNotifications("morning-reminder");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌅 おはようございます！",
      body: "今日のタスクが準備できています。冒険を始めましょう！",
      data: { type: "morning-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
    identifier: "morning-reminder",
  });
}

/**
 * 夜のリマインダーをスケジュール
 */
export async function scheduleEveningReminder(): Promise<void> {
  await cancelScheduledNotifications("evening-reminder");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌙 今日のタスク、まだ残っていませんか？",
      body: "あと少しで達成できます。ストリークを維持しましょう！",
      data: { type: "evening-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
    identifier: "evening-reminder",
  });
}

/**
 * 特定のIDの通知をキャンセル
 */
async function cancelScheduledNotifications(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // 存在しない場合は無視
  }
}

/**
 * すべてのスケジュール済み通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
