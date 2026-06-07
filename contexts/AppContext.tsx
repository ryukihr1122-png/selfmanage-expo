/**
 * アプリコンテキスト（ローカルファースト版）
 *
 * 旧 AuthContext を置き換え。
 * - 認証不要（ローカルDB）
 * - ログインボーナス自動請求
 * - デイリータスク自動展開
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  getProfile,
  claimLoginBonus,
  expandTodayTasks,
  type Profile,
  type LoginBonusResult,
} from "@/db/repository";
import {
  registerForPushNotifications,
  scheduleMorningReminder,
  scheduleEveningReminder,
} from "@/lib/notifications";

interface AppState {
  profile: Profile | null;
  isLoading: boolean;
  loginBonus: LoginBonusResult | null;
  refreshProfile: () => Promise<void>;
  dismissLoginBonus: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState<LoginBonusResult | null>(null);

  // 起動時の初期化
  useEffect(() => {
    (async () => {
      try {
        // 今日のタスクを展開
        await expandTodayTasks();

        // プロフィール読み込み
        const p = await getProfile();
        setProfile(p);

        // ログインボーナス
        const bonus = await claimLoginBonus();
        if (!bonus.alreadyClaimed) {
          setLoginBonus(bonus);
        }

        // プッシュ通知
        registerForPushNotifications().catch(() => {});
        scheduleMorningReminder().catch(() => {});
        scheduleEveningReminder().catch(() => {});
      } catch (err) {
        console.error("[AppContext] Init failed:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const refreshProfile = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
  }, []);

  const dismissLoginBonus = useCallback(() => {
    setLoginBonus(null);
  }, []);

  const value = useMemo(
    () => ({ profile, isLoading, loginBonus, refreshProfile, dismissLoginBonus }),
    [profile, isLoading, loginBonus, refreshProfile, dismissLoginBonus],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
