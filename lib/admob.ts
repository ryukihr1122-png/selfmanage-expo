/**
 * AdMob リワード広告ヘルパー
 *
 * 開発中（Expo Go）: モック広告（常にtrue返却）
 * 本番（ネイティブビルド）: react-native-google-mobile-ads を使用
 *
 * ネイティブビルド時:
 *   npx expo install react-native-google-mobile-ads
 *   app.json plugins に追加
 */

/**
 * リワード広告をロードして表示。
 * ユーザーが最後まで視聴したら resolve(true)。
 *
 * 開発中はモック（3秒待って true 返却）。
 */
export async function showRewardedAd(): Promise<boolean> {
  // ネイティブビルドでのみ AdMob を使用
  try {
    const AdMob = require("react-native-google-mobile-ads");
    const { RewardedAd, RewardedAdEventType, AdEventType, TestIds } = AdMob;

    const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : "ca-app-pub-XXXXX/YYYYY";

    return new Promise((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID);

      const unsubLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => { rewarded.show(); },
      );
      const unsubEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => { cleanup(); resolve(true); },
      );
      const unsubClosed = rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => { cleanup(); resolve(false); },
      );
      const unsubError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        () => { cleanup(); resolve(false); },
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
  } catch {
    // Expo Go では react-native-google-mobile-ads が使えないのでモック
    console.log("[admob] Using mock ad (Expo Go mode)");
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }
}
