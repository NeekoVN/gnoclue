"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin } from "../services/auth";
import { ILoginRequest, IAuthLoginResponse } from "../types/auth";
import { getCurrentUser } from "../services/user";
import { IUser } from "../types/user";

interface AuthContextType {
  token: string | null;
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: ILoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility to clear all cookies
const clearAllCookies = () => {
  if (typeof document === "undefined") return;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (mounted) {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        // Fetch user data
        getCurrentUser()
          .then((userData) => {
            setUser(userData);
          })
          .catch((error) => {
            console.error("Failed to fetch user data:", error);
            // If error is 401 or TokenExpiredError, log out
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            clearAllCookies();
            router.replace("/signin");
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [mounted]);

  const login = async (credentials: ILoginRequest) => {
    const data: IAuthLoginResponse = await apiLogin(credentials);
    localStorage.setItem("token", data.token);
    setToken(data.token);

    // Set user data from login response
    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // No longer set cookie for middleware
    // document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.replace("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    clearAllCookies();
    router.replace("/signin");
  };

  // Don't render children until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
