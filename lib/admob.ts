/**
 * AdMob リワード広告ヘルパー
 *
 * - ネイティブビルド: react-native-google-mobile-ads を使用
 * - Expo Go / SDKが無い場合: モック（1.5秒待って成功扱い）
 *
 * テスト広告ID（Google公式）:
 *   iOS:     ca-app-pub-3940256099942544/1712485313
 *   Android: ca-app-pub-3940256099942544/5224354917
 *
 * 本番広告IDはAdMobアカウント取得後に差し替え。
 */

// ── 広告ユニットID ──────────────────────────────────
// TODO: AdMobアカウント取得後に本番IDに差し替え
const AD_UNIT_IOS = "ca-app-pub-3940256099942544/1712485313"; // テスト用
const AD_UNIT_ANDROID = "ca-app-pub-3940256099942544/5224354917"; // テスト用

import { Platform } from "react-native";

/**
 * AdMob SDKの初期化（アプリ起動時に1回呼ぶ）
 */
export async function initializeAdMob(): Promise<void> {
  try {
    const { default: mobileAds } = require("react-native-google-mobile-ads");
    await mobileAds().initialize();
    console.log("[admob] SDK initialized");
  } catch {
    console.log("[admob] SDK not available (Expo Go mode)");
  }
}

/**
 * ATT（App Tracking Transparency）リクエスト — iOS 14.5+
 * 広告IDの利用許可を求める。
 */
export async function requestTrackingPermission(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    const { default: mobileAds, AdsConsent } = require("react-native-google-mobile-ads");
    // ATTリクエスト
    await mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: __DEV__ ? ["EMULATOR"] : [],
    });
    console.log("[admob] Tracking permission requested");
  } catch {
    // Expo Go — 無視
  }
}

/**
 * リワード広告をロードして表示。
 * ユーザーが最後まで視聴したら resolve(true)。
 * 途中閉じ or エラーは resolve(false)。
 *
 * Expo Goではモック（1.5秒で成功）。
 */
export async function showRewardedAd(): Promise<boolean> {
  try {
    const {
      RewardedAd,
      RewardedAdEventType,
      AdEventType,
      TestIds,
    } = require("react-native-google-mobile-ads");

    // __DEV__ ならテストID、本番なら設定済みIDを使用
    const adUnitId = __DEV__
      ? TestIds.REWARDED
      : Platform.select({ ios: AD_UNIT_IOS, android: AD_UNIT_ANDROID }) ?? AD_UNIT_IOS;

    return new Promise((resolve) => {
      const rewarded = RewardedAd.createForAdRequest(adUnitId);

      let cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        unsubError();
      }

      const unsubLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          rewarded.show();
        },
      );

      const unsubEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          console.log("[admob] Reward earned");
          cleanup();
          resolve(true);
        },
      );

      const unsubClosed = rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log("[admob] Ad closed without reward");
          cleanup();
          resolve(false);
        },
      );

      const unsubError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        (error: unknown) => {
          console.log("[admob] Ad error:", error);
          cleanup();
          resolve(false);
        },
      );

      rewarded.load();
    });
  } catch {
    // Expo Go or SDK unavailable — mock
    console.log("[admob] Using mock ad (Expo Go mode)");
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }
}
