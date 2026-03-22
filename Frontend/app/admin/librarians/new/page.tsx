"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { apiRegisterLibrarian } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function NewLibrarianPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function validate() {
    const e: Record<string, string | undefined> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      e.password = "Password must contain letters and numbers";
    return e;
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
      await apiRegisterLibrarian({ name, email, password });
      success(`Librarian account created for ${name}`);
      router.push("/admin/librarians");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create account.";
      error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Librarian</h1>
          <p className="page-subtitle">
            Create a librarian account. Only admins can register librarians.
          </p>
        </div>
        <Link href="/admin/librarians" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div style={{ maxWidth: 540 }}>
        <div className="card" style={{ padding: "24px 28px" }}>
          <form onSubmit={handleSubmit} noValidate>
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
              <label className="label" htmlFor="lib-name">
                Full Name
              </label>
              <input
                id="lib-name"
                type="text"
                className={`input ${errors.name ? "input-error" : ""}`}
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
                autoComplete="name"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="lib-email">
                Email Address
              </label>
              <input
                id="lib-email"
                type="email"
                className={`input ${errors.email ? "input-error" : ""}`}
                placeholder="librarian@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: undefined }));
                }}
                autoComplete="email"
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="lib-password">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="lib-password"
                  type={showPass ? "text" : "password"}
                  className={`input ${errors.password ? "input-error" : ""}`}
                  style={{ paddingRight: 40 }}
                  placeholder="Min 8 chars, letters + numbers"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  autoComplete="new-password"
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
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating
                  account...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Create Librarian Account
                </>
              )}
            </button>
          </form>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--fill)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--muted)",
          }}
        >
          The librarian can log in immediately with these credentials at the
          sign-in page. Share them securely.
        </div>
      </div>
    </div>
  );
}
