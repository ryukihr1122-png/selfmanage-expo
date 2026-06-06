/**
 * 触覚フィードバック
 */
import * as Haptics from "expo-haptics";

export const haptic = {
  /** タスク完了 */
  complete: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** レベルアップ */
  levelUp: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** エラー */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** ボタンタップ */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** アイテム装備 */
  equip: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** 購入完了 */
  purchase: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** セレクション変更 */
  selection: () => Haptics.selectionAsync(),
};
