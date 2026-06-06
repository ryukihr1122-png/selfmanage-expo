/**
 * AdMob リワード広告ヘルパー
 *
 * react-native-google-mobile-ads を利用。
 * Expo SDK 56 では config plugin として app.json に設定追加が必要。
 *
 * インストール手順:
 *   npx expo install react-native-google-mobile-ads
 *
 * app.json に追加:
 *   "plugins": [
 *     ["react-native-google-mobile-ads", {
 *       "androidAppId": "ca-app-pub-xxxxxxxx~yyyyyyyy",
 *       "iosAppId":     "ca-app-pub-xxxxxxxx~yyyyyyyy"
 *     }]
 *   ]
 */

import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// TODO: 本番 Ad Unit ID に差し替え
const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : "ca-app-pub-XXXXX/YYYYY";

/**
 * リワード広告をロードして表示。
 * ユーザーが最後まで視聴したら resolve(true)、
 * 途中で閉じた/エラーなら resolve(false)。
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID);

    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        rewarded.show();
      },
    );

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        cleanup();
        resolve(true);
      },
    );

    const unsubClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        // 広告が閉じられたがリワード未獲得の場合
        // (EARNED_REWARD が先に来ていれば cleanup 済みで何もしない)
        cleanup();
        resolve(false);
      },
    );

    const unsubError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      () => {
        cleanup();
        resolve(false);
      },
    );

    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    }

    rewarded.load();
  });
}
