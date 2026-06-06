/**
 * react-native-google-mobile-ads の型宣言スタブ
 * EAS Build 時にネイティブモジュールとして追加されるため、
 * 開発時は型定義のみ提供。
 */
declare module "react-native-google-mobile-ads" {
  export const TestIds: {
    REWARDED: string;
    BANNER: string;
    INTERSTITIAL: string;
  };

  export enum RewardedAdEventType {
    LOADED = "loaded",
    EARNED_REWARD = "earned_reward",
  }

  export enum AdEventType {
    CLOSED = "closed",
    ERROR = "error",
    LOADED = "loaded",
    OPENED = "opened",
  }

  export interface RewardedAdInstance {
    load(): void;
    show(): Promise<void>;
    addAdEventListener(
      event: RewardedAdEventType | AdEventType,
      handler: (data?: unknown) => void,
    ): () => void;
  }

  export const RewardedAd: {
    createForAdRequest(adUnitId: string): RewardedAdInstance;
  };
}
