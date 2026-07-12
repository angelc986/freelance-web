"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/lib/api";
import * as api from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    phone: string;
    full_name: string;
    cedula: string;
    password: string;
    role: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("refresh_token", res.refresh_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: {
    email: string;
    phone: string;
    full_name: string;
    cedula: string;
    password: string;
    role: string;
  }) => {
    const user = await api.register(data);
    // After register, login automatically
    await login(data.email, data.password);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
