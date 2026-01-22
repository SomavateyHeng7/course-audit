"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  login as sanctumLogin,
  logout as sanctumLogout,
  getUser,
  User,
} from "@/lib/auth/sanctum";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SanctumAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authVersion, setAuthVersion] = useState(0);

  // Fetch user on mount or when authVersion changes
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        // User not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [authVersion]);

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing user state first
      setUser(null);
      
      // Clear all client data before login to ensure fresh state
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      const { user: userData } = await sanctumLogin(email, password);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await sanctumLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user state immediately
      setUser(null);
      setIsLoading(false);
      
      // Clear any additional cached data that might persist
      if (typeof window !== 'undefined') {
        // Clear all storage to ensure no stale data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }
    }
  };

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force refresh when auth changes (increment authVersion to trigger re-fetch)
  const forceRefresh = useCallback(() => {
    setAuthVersion(v => v + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SanctumAuthProvider");
  }
  return context;
}
