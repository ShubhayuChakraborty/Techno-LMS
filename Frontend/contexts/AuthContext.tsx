"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiMe,
  apiGoogleAuth,
  setAccessToken,
} from "@/lib/api";
import type { User, Role } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_HINT_KEY = "lms_has_session";

function isPublicAuthPath(path: string) {
  return (
    path === "/login" || path === "/register" || path === "/forgot-password"
  );
}

function shouldSkipInitialAuthCheck() {
  if (typeof window === "undefined") return false;
  const currentPath = window.location.pathname;
  const hintedSession = window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  return !hintedSession && isPublicAuthPath(currentPath);
}

function redirectByRole(role: string, router: ReturnType<typeof useRouter>) {
  if (role === "admin") router.push("/admin/dashboard");
  else if (role === "librarian") router.push("/librarian/dashboard");
  else router.push("/member/dashboard");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !shouldSkipInitialAuthCheck());

  // On mount: attempt a silent token refresh via the HTTP-only cookie,
  // then load the current user. This re-hydrates auth state after page refreshes.
  useEffect(() => {
    if (shouldSkipInitialAuthCheck()) {
      return;
    }

    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const isPublicAuthRoute = isPublicAuthPath(currentPath);

    const hintedSession =
      typeof window !== "undefined" &&
      window.localStorage.getItem(SESSION_HINT_KEY) === "1";

    if (!hintedSession && isPublicAuthRoute) {
      return;
    }

    apiMe()
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Listen for the global session-expired event fired by the axios interceptor
  // when both the access token and refresh token have expired.
  useEffect(() => {
    const handleExpired = () => {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_HINT_KEY);
      }
      router.push("/login");
    };
    window.addEventListener("auth:session-expired", handleExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleExpired);
  }, [router]);

  const login = useCallback(
    async (email: string, password: string, role: Role) => {
      const u = await apiLogin(email, password, role);
      setUser(u);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SESSION_HINT_KEY, "1");
      }
      redirectByRole(u.role, router);
    },
    [router],
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      role: Role;
    }) => {
      // After registration the user must log in explicitly
      await apiRegister(data);
      router.push("/login");
    },
    [router],
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      const u = await apiGoogleAuth(idToken);
      setUser(u);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SESSION_HINT_KEY, "1");
      }
      redirectByRole(u.role, router);
    },
    [router],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    }
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
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

export function useRequireAuth(requiredRole?: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "librarian") router.push("/librarian/dashboard");
      else router.push("/member/dashboard");
    }
  }, [user, loading, requiredRole, router]);

  return { user, loading };
}
