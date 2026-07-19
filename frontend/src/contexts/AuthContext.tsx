"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/lib/api";
import * as api from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
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

  const mockUsers: Record<string, User> = {
    "contratista@test.com": {
      id: 1,
      email: "contratista@test.com",
      full_name: "Carlos Méndez",
      phone: "+584141234567",
      cedula: "V-12345678",
      role: "contractor",
      avatar_url: null,
      avatar_verified: false,
      cedula_locked: true,
      rating_avg: 4.8,
      is_admin: false,
      is_active: true,
      wallet_address: null,
      balance: 1500,
      is_verified: true,
    },
    "empleado@test.com": {
      id: 2,
      email: "empleado@test.com",
      full_name: "María Rodríguez",
      phone: "+584149876543",
      cedula: "V-87654321",
      role: "worker",
      avatar_url: null,
      avatar_verified: false,
      cedula_locked: true,
      rating_avg: 4.2,
      is_admin: false,
      is_active: true,
      wallet_address: null,
      balance: 580,
      is_verified: false,
    },
  };

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          // Dev mode: try mock user from localStorage
          const savedEmail = localStorage.getItem("mock_email");
          if (savedEmail && mockUsers[savedEmail]) {
            setUser(mockUsers[savedEmail]);
          } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch {
      // Dev mode: fallback to mock user
      const mock = mockUsers[email.toLowerCase()];
      if (mock) {
        localStorage.setItem("access_token", "dev-token");
        localStorage.setItem("refresh_token", "dev-refresh");
        localStorage.setItem("mock_email", email.toLowerCase());
        setToken("dev-token");
        setUser(mock);
        return mock;
      }
      throw new Error("Usuario no encontrado (modo desarrollo)");
    }
  };

  const register = async (data: {
    email: string;
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
    localStorage.removeItem("mock_email");
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
