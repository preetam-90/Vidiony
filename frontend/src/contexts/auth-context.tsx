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

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.auth.login({ email, password });
    setUser(user);
  }, []);

  const register = useCallback(
    async (data: { email: string; username: string; password: string; name?: string }) => {
      const { user } = await api.auth.register(data);
      setUser(user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {}
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
