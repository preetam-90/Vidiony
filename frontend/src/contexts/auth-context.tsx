"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, type AuthUser, setAccessToken, clearAccessToken, getAccessToken } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch {
      // Token expired — try to refresh
      try {
        const { accessToken: newToken } = await api.auth.refresh();
        setAccessToken(newToken);
        const { user } = await api.auth.me();
        setUser(user);
      } catch {
        clearAccessToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Re-hydrate if another tab sets the token (e.g. OAuth callback in same browser)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "vidion_token") refreshUser();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user } = await api.auth.login({ email, password });
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(
    async (data: { email: string; username: string; password: string; name?: string }) => {
      const { accessToken, user } = await api.auth.register(data);
      setAccessToken(accessToken);
      setUser(user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
