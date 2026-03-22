"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiSendRegistrationOtp, apiVerifyAndRegister } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

const ALLOWED_DOMAIN = "technoindiaeducation.com";

type Step = "form" | "otp";

export default function RegisterPage() {
  const { googleLogin } = useAuth();

  // Step 1 — registration form
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 2 — OTP verification
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google loading state
  const [googleError, setGoogleError] = useState("");

  function validateForm() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email) {
      errs.email = "Email is required";
    } else if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      errs.email = `Only @${ALLOWED_DOMAIN} email addresses can register`;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    if (!password) errs.password = "Password is required";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      errs.password = "Password must contain both letters and numbers";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (confirm !== password) errs.confirm = "Passwords do not match";
    return errs;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormLoading(true);
    setFormErrors({});
    try {
      await apiSendRegistrationOtp(email, name);
      setStep("otp");
      startResendCooldown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setFormErrors({ general: msg });
    } finally {
      setFormLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await apiVerifyAndRegister({ email, otp, name, password });
      // Redirect to login with success indicator
      window.location.href = "/login?registered=1";
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "OTP verification failed.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResendOtp() {
    setResendLoading(true);
    setOtpError("");
    try {
      await apiSendRegistrationOtp(email, name);
      startResendCooldown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP.";
      setOtpError(msg);
    } finally {
      setResendLoading(false);
    }
  }

  async function handleGoogleSuccess(response: { credential?: string }) {
    if (!response.credential) return;
    setGoogleError("");
    try {
      await googleLogin(response.credential);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setGoogleError(msg);
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
              alt="Techno India Logo"
              width={72}
              height={72}
              style={{
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
            {step === "form"
              ? "Create your member account"
              : "Verify your email"}
          </p>
        </div>

        {step === "form" ? (
          <>
            {/* Domain hint */}
            <div
              style={{
                marginBottom: 20,
                padding: "10px 14px",
                background: "rgba(200,16,46,0.06)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--muted)",
                border: "1px solid rgba(200,16,46,0.15)",
              }}
            >
              <strong>Students &amp; Staff only:</strong> Use your{" "}
              <span style={{ color: "#C8102E", fontWeight: 600 }}>
                @{ALLOWED_DOMAIN}
              </span>{" "}
              email to register.
            </div>

            <form onSubmit={handleSendOtp}>
              {formErrors.general && (
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
                  {formErrors.general}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`input ${formErrors.name ? "input-error" : ""}`}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormErrors((p) => ({ ...p, name: undefined! }));
                  }}
                />
                {formErrors.name && (
                  <p className="field-error">{formErrors.name}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="email">
                  Institute Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`input ${formErrors.email ? "input-error" : ""}`}
                  placeholder={`you@${ALLOWED_DOMAIN}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormErrors((p) => ({ ...p, email: undefined! }));
                  }}
                />
                {formErrors.email && (
                  <p className="field-error">{formErrors.email}</p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    className={`input ${formErrors.password ? "input-error" : ""}`}
                    style={{ paddingRight: 40 }}
                    placeholder="Min 8 chars with letters & numbers"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormErrors((p) => ({ ...p, password: undefined! }));
                    }}
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
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="field-error">{formErrors.password}</p>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="label" htmlFor="confirm">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type={showPass ? "text" : "password"}
                  className={`input ${formErrors.confirm ? "input-error" : ""}`}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setFormErrors((p) => ({ ...p, confirm: undefined! }));
                  }}
                />
                {formErrors.confirm && (
                  <p className="field-error">{formErrors.confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginBottom: 16 }}
              >
                {formLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending
                    OTP...
                  </>
                ) : (
                  <>Send Verification OTP →</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "16px 0",
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>or</span>
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
            </div>

            {/* Google sign-in */}
            {googleError && (
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
                {googleError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setGoogleError("Google sign-in failed. Please try again.")
                }
                text="signup_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="100%"
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
              Google sign-in is only available for{" "}
              <strong>@{ALLOWED_DOMAIN}</strong> accounts.
            </p>
          </>
        ) : (
          /* ─── Step 2: OTP verification ─── */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Mail size={48} style={{ color: "#C8102E", marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                We sent a 6-digit OTP to{" "}
                <strong style={{ color: "var(--heading)" }}>{email}</strong>.
                Enter it below to complete registration.
              </p>
            </div>

            {otpError && (
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
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={`input ${otpError ? "input-error" : ""}`}
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                style={{
                  fontSize: 28,
                  letterSpacing: 12,
                  textAlign: "center",
                  fontWeight: 700,
                }}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginBottom: 16 }}
            >
              {otpLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Verify &amp; Create Account
                </>
              )}
            </button>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  background: "none",
                  border: "none",
                  cursor: resendCooldown > 0 ? "default" : "pointer",
                  fontSize: 13,
                  color: resendCooldown > 0 ? "var(--muted)" : "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw
                  size={14}
                  className={resendLoading ? "animate-spin" : ""}
                />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>·</span>
              <button
                type="button"
                onClick={() => setStep("form")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                Change email
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--primary)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
