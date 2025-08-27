"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleE2EClient } from "@/app/crypto/simpleE2E";
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility moved to a centralized purge helper
import { purgeAllClientData } from "../utils/purge";

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
            try {
              localStorage.setItem("userId", userData._id);
            } catch {}
          })
          .catch((error) => {
            console.error("Failed to fetch user data:", error);
            // If error is 401 or TokenExpiredError, log out
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            router.replace("/signin");
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [mounted, router]);

  // Initialize SimpleE2E client when user is available
  useEffect(() => {
    if (user?._id) {
      const client = SimpleE2EClient.getInstance();
      client.setUserId(user._id);
    }
  }, [user?._id]);

  const login = async (credentials: ILoginRequest) => {
    const data: IAuthLoginResponse = await apiLogin(credentials);
    localStorage.setItem("token", data.token);
    try {
      localStorage.setItem("userId", data._id);
    } catch {}
    setToken(data.token);

    // Set user data from login response
    setUser({
      _id: data._id,
      username: data.username,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Initialize SimpleE2E client after login
    try {
      const client = SimpleE2EClient.getInstance();
      client.setUserId(data._id);
    } catch {}

    // No longer set cookie for middleware
    // document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.replace("/");
  };

  const logout = async () => {
    try {
      await purgeAllClientData();
    } catch {}
    // Ensure React state reflects logged-out state
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("userId");
    } catch {}
    router.replace("/signin");
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // If refresh fails, log out the user
      logout();
    }
  };

  // Don't render children until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
