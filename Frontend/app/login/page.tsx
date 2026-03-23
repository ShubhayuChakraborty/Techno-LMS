"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import type { Role } from "@/lib/mockData";
import { useSearchParams } from "next/navigation";

function LoginPageContent() {
  const { login, googleLogin } = useAuth();
  const searchParams = useSearchParams();
  const [registered, setRegistered] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
    google?: string;
  }>({});

  useEffect(() => {
    if (searchParams?.get("registered") === "1") setRegistered(true);
  }, [searchParams]);

  function handleRoleChange(r: Role) {
    setRole(r);
    setEmail("");
    setPassword("");
    setErrors({});
  }

  function validate() {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await login(email, password, role);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  const roleColors: Record<Role, string> = {
    admin: "#C8102E",
    librarian: "#FF9F0A",
    member: "#34C759",
  };

  async function handleGoogleSuccess(response: { credential?: string }) {
    if (!response.credential) return;
    setErrors((p) => ({ ...p, google: undefined }));
    try {
      await googleLogin(response.credential);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setErrors((p) => ({ ...p, google: msg }));
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Image
              src="/tiulogo.png"
              alt="Tathagat Logo"
              width={72}
              height={72}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                boxShadow: "0 4px 16px rgba(200,16,46,0.25)",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--heading)",
              marginBottom: 4,
              letterSpacing: "-0.3px",
            }}
          >
            Techno India
          </h1>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#C8102E",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 4,
            }}
          >
            Library Management System
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Access your library portal
          </p>
        </div>

        {registered && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              background: "rgba(52,199,89,0.1)",
              borderRadius: 8,
              fontSize: 13,
              color: "#34C759",
              border: "1px solid rgba(52,199,89,0.25)",
              textAlign: "center",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircle2 size={14} /> Account created successfully! Please
              sign in.
            </span>
          </div>
        )}

        {/* Role Selector */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Sign in as</label>
          <div className="role-selector">
            {(["admin", "librarian", "member"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`role-tab role-tab-${r} ${role === r ? "active" : ""}`}
                style={
                  role === r
                    ? ({
                        "--active-color": roleColors[r],
                      } as React.CSSProperties)
                    : {}
                }
                type="button"
                suppressHydrationWarning
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "rgba(255,59,48,0.08)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--danger)",
              }}
            >
              {errors.general}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? "input-error" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              autoComplete="email"
              suppressHydrationWarning
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label
                className="label"
                htmlFor="password"
                style={{ marginBottom: 0 }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className={`input ${errors.password ? "input-error" : ""}`}
                style={{ paddingRight: 40 }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
                autoComplete="current-password"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                }}
                suppressHydrationWarning
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{
              width: "100%",
              marginBottom: 20,
              background: roleColors[role],
              borderColor: roleColors[role],
            }}
            suppressHydrationWarning
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>Sign In →</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "4px 0 16px",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Google sign-in */}
        {errors.google && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              background: "rgba(255,59,48,0.08)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--danger)",
            }}
          >
            {errors.google}
          </div>
        )}
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setErrors((p) => ({
                ...p,
                google: "Google sign-in failed. Please try again.",
              }))
            }
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
            width={360}
          />
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--muted)",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Members: sign in with your <strong>@technoindiaeducation.com</strong>{" "}
          Google account.
        </p>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--primary)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="auth-page" />}>
      <LoginPageContent />
    </React.Suspense>
  );
}
