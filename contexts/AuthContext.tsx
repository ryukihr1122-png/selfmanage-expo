/**
 * 認証コンテキスト
 * - JWT token を SecureStore に保存
 * - 起動時に自動ログインチェック
 * - ログインボーナスの自動請求
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { api, type User, type LoginBonusResult, ApiError } from "@/lib/api";
import { setToken, getToken, clearAllTokens } from "@/lib/storage";
import {
  registerForPushNotifications,
  scheduleMorningReminder,
  scheduleEveningReminder,
} from "@/lib/notifications";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  loginBonus: LoginBonusResult | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissLoginBonus: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState<LoginBonusResult | null>(null);

  // 起動時: トークンがあれば /me で検証
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const data = await api.getMe();
        setUser(data.user);
        // プッシュ通知の初期化
        registerForPushNotifications().catch(() => {});
        scheduleMorningReminder().catch(() => {});
        scheduleEveningReminder().catch(() => {});
        // ログインボーナス自動請求
        try {
          const bonus = await api.claimLoginBonus();
          if (!bonus.alreadyClaimed) {
            setLoginBonus(bonus);
          }
        } catch {
          // ログインボーナスAPIがまだない場合は無視
        }
      } catch {
        await clearAllTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    await setToken(res.token);
    setUser(res.user);
    // ログインボーナス請求
    try {
      const bonus = await api.claimLoginBonus();
      if (!bonus.alreadyClaimed) {
        setLoginBonus(bonus);
      }
    } catch {
      // ignore
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await api.register(email, password, displayName);
      await setToken(res.token);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearAllTokens();
    setUser(null);
    setLoginBonus(null);
  }, []);

  const dismissLoginBonus = useCallback(() => {
    setLoginBonus(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, loginBonus, login, register, logout, dismissLoginBonus }),
    [user, isLoading, loginBonus, login, register, logout, dismissLoginBonus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
