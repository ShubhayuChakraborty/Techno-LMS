"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  KeyRound,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { apiForgotPassword, apiResetPassword } from "@/lib/api";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [success, setSuccess] = useState(false);

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

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setEmailError("Email is required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    try {
      await apiForgotPassword(email);
      setStep("reset");
      startResendCooldown();
    } catch {
      // Always show generic message to prevent email enumeration
      setStep("reset");
      startResendCooldown();
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleResendOtp() {
    setResendLoading(true);
    try {
      await apiForgotPassword(email);
      startResendCooldown();
    } catch {
      startResendCooldown(); // still start cooldown
    } finally {
      setResendLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setResetError("Please enter the 6-digit OTP.");
      return;
    }
    if (!newPassword) {
      setResetError("New password is required.");
      return;
    }
    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setResetError(
        "Password must be at least 8 characters and contain letters and numbers.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      await apiResetPassword(email, otp, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Password reset failed. Please try again.";
      setResetError(msg);
    } finally {
      setResetLoading(false);
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
            {step === "email"
              ? "Reset your password"
              : "Enter verification code"}
          </p>
        </div>

        {success ? (
          /* ─── Success state ─── */
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <CheckCircle2 size={48} color="rgb(52,199,89)" />
            </div>
            <h3
              style={{
                fontWeight: 700,
                color: "var(--heading)",
                marginBottom: 8,
              }}
            >
              Password Reset!
            </h3>
            <p
              style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}
            >
              Your password has been updated. You can now sign in with your new
              password.
            </p>
            <Link
              href="/login"
              className="btn btn-primary btn-lg"
              style={{ display: "block", textAlign: "center" }}
            >
              Go to Sign In →
            </Link>
          </div>
        ) : step === "email" ? (
          /* ─── Step 1: Enter email ─── */
          <form onSubmit={handleSendOtp}>
            <p
              style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}
            >
              Enter your registered email address. We will send you a 6-digit
              OTP to reset your password.
            </p>

            {emailError && (
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
                {emailError}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`input ${emailError ? "input-error" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginBottom: 20 }}
            >
              {emailLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending OTP...
                </>
              ) : (
                <>
                  <Mail size={18} /> Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          /* ─── Step 2: OTP + new password ─── */
          <form onSubmit={handleReset}>
            <div
              style={{
                marginBottom: 20,
                padding: "10px 14px",
                background: "var(--fill)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              OTP sent to{" "}
              <strong style={{ color: "var(--heading)" }}>{email}</strong>.
              Check your inbox (or console in dev mode).
            </div>

            {resetError && (
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
                {resetError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={`input ${resetError && otp.length !== 6 ? "input-error" : ""}`}
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setResetError("");
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

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="newPassword">
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="newPassword"
                  type={showPass ? "text" : "password"}
                  className="input"
                  style={{ paddingRight: 40 }}
                  placeholder="Min 8 chars with letters & numbers"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setResetError("");
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
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPass ? "text" : "password"}
                className="input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setResetError("");
                }}
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading || otp.length !== 6}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginBottom: 16 }}
            >
              {resetLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <KeyRound size={18} /> Reset Password
                </>
              )}
            </button>

            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
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
                onClick={() => setStep("email")}
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

        {!success && (
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "var(--muted)",
              marginTop: 20,
            }}
          >
            Remember your password?{" "}
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
        )}
      </div>
    </div>
  );
}
