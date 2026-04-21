"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, type AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch (err) {
      // Try to refresh using the refresh cookie
      try {
        const refreshed = await api.auth.refresh();
        if (refreshed) {
          const { user } = await api.auth.me();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
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

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !user?.youtubeChannelId) {
      logout();
    }
  }, [isAuthenticated, isLoading, logout, user?.youtubeChannelId]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
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
