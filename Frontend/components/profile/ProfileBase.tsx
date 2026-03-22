/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  apiUpdateProfile,
  apiChangePassword,
  apiUploadAvatar,
} from "@/lib/api";

const AVATAR_COLORS = [
  "#1D7FEC",
  "#34C759",
  "#FF9500",
  "#FF3B30",
  "#AF52DE",
  "#FF2D55",
  "#00C7BE",
  "#5856D6",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getDefaultColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface ExtraField {
  key: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}

interface Props {
  /** Extra display rows shown in the info view */
  extraInfoRows?: { label: string; value: string }[];
  /** Extra editable form fields below name/email */
  extraFields?: ExtraField[];
  /** Small badge rendered on top-right of avatar */
  avatarBadge?: React.ReactNode;
  /** Extra content rendered below the two-column grid */
  children?: React.ReactNode;
}

export default function ProfileBase({
  extraInfoRows,
  extraFields,
  avatarBadge,
  children,
}: Props) {
  const { user, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolve avatar URL from member or librarian profile
  const profileAvatarUrl =
    user?.member?.avatarUrl ?? user?.librarian?.avatarUrl ?? "";
  const profileAvatarColor =
    user?.member?.avatarColor ?? user?.librarian?.avatarColor ?? null;

  // Primary: server-stored avatar URL; fallback: localStorage base64 (legacy)
  const [avatar, setAvatar] = useState(profileAvatarUrl);
  const [avatarColor, setAvatarColor] = useState(
    profileAvatarColor ??
      (user ? getDefaultColor(user.name) : AVATAR_COLORS[0]),
  );

  useEffect(() => {
    // Keep avatar in sync when user context updates (e.g. after save)
    const serverUrl = user?.member?.avatarUrl ?? user?.librarian?.avatarUrl;
    if (serverUrl) {
      setAvatar(serverUrl);
    } else if (user?.id) {
      // Legacy fallback: read from localStorage if no server URL exists yet
      const stored = localStorage.getItem(`lms_avatar_${user.id}`);
      if (stored) setAvatar(stored);
    }
    const serverColor =
      user?.member?.avatarColor ?? user?.librarian?.avatarColor;
    if (serverColor) {
      setAvatarColor(serverColor);
    } else if (user?.id) {
      const storedColor = localStorage.getItem(`lms_avatar_color_${user.id}`);
      if (storedColor) setAvatarColor(storedColor);
    }
  }, [
    user?.id,
    user?.member?.avatarUrl,
    user?.librarian?.avatarUrl,
    user?.member?.avatarColor,
    user?.librarian?.avatarColor,
  ]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);

  const [pwEditing, setPwEditing] = useState(false);
  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError("Image must be smaller than 2 MB");
      return;
    }
    setUploading(true);
    try {
      // Upload to server — the backend saves the file and stores the URL in DB
      const url = await apiUploadAvatar(file);
      setAvatar(url);
      // Store in localStorage as well so Navbar picks it up immediately
      localStorage.setItem(`lms_avatar_${user.id}`, url);
      // Refresh user context so member.avatarUrl is updated throughout the app
      const updated = await apiUpdateProfile({ avatarUrl: url });
      updateUser(updated);
      toastSuccess("Profile photo updated");
    } catch {
      toastError("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleColorPick = (color: string) => {
    setAvatarColor(color);
    localStorage.setItem(`lms_avatar_color_${user.id}`, color);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastError("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      // Collect extra field values (phone, address, etc.) keyed by their `key`
      const extraData: Record<string, string> = {};
      extraFields?.forEach(({ key, value }) => {
        extraData[key] = value;
      });

      const updated = await apiUpdateProfile({
        name: form.name.trim(),
        ...extraData,
      });
      updateUser(updated);
      toastSuccess("Profile updated");
      setEditing(false);
    } catch {
      toastError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toastError("Passwords do not match");
      return;
    }
    if (pwForm.next.length < 6) {
      toastError("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      await apiChangePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      toastSuccess("Password changed successfully");
      setPwForm({ current: "", next: "", confirm: "" });
      setPwEditing(false);
    } catch {
      toastError("Failed — check your current password");
    } finally {
      setPwLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({ name: user.name, email: user.email });
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 20,
        }}
      >
        {/* ── Profile card ── */}
        <div className="card" style={{ padding: 24 }}>
          {/* Avatar section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div style={{ position: "relative" }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 30,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(editing ? form.name || user.name : user.name)}
                </div>
              )}
              <button
                title="Upload photo"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: uploading ? "var(--muted)" : "var(--primary)",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: uploading ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                {uploading ? (
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                ) : (
                  <Camera size={13} color="white" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
              {avatarBadge ? (
                <div
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarBadge}
                </div>
              ) : null}
            </div>

            {/* Color picker (shown when no image) */}
            {!avatar && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => handleColorPick(c)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: c,
                      border:
                        avatarColor === c
                          ? "3px solid var(--body)"
                          : "2px solid transparent",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {avatar && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setAvatar("");
                  localStorage.removeItem(`lms_avatar_${user.id}`);
                }}
              >
                Remove photo
              </button>
            )}

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "var(--heading)",
                }}
              >
                {editing ? form.name || user.name : user.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 2,
                  textTransform: "capitalize",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                {user.role}
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--heading)",
                }}
              >
                Account Details
              </div>
              {!editing ? (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setEditing(true)}
                >
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={cancelEdit}
                  >
                    <X size={12} /> Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={12} /> {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="input"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                {extraFields?.map(
                  ({ key, label, type = "text", value, onChange }) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <input
                        className="input"
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                      />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  { label: "Full Name", value: user.name },
                  { label: "Email", value: user.email },
                  ...(extraInfoRows ?? []),
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      gap: 12,
                    }}
                  >
                    <span style={{ color: "var(--muted)", flexShrink: 0 }}>
                      {r.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--body)",
                        textAlign: "right",
                        wordBreak: "break-word",
                      }}
                    >
                      {r.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Password card ── */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: pwEditing ? 16 : 0,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--heading)",
                }}
              >
                Password &amp; Security
              </div>
              {!pwEditing && (
                <div
                  style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}
                >
                  Keep your account secure
                </div>
              )}
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 13 }}
              onClick={() => setPwEditing((e) => !e)}
            >
              {pwEditing ? "Cancel" : "Change Password"}
            </button>
          </div>

          {pwEditing && (
            <form
              onSubmit={handlePasswordChange}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {(["current", "next", "confirm"] as const).map((key) => (
                <div key={key} className="form-group">
                  <label className="form-label">
                    {
                      {
                        current: "Current Password",
                        next: "New Password",
                        confirm: "Confirm New Password",
                      }[key]
                    }
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={show[key] ? "text" : "password"}
                      className="input"
                      value={pwForm[key]}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      required
                      style={{ paddingRight: 52 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        fontSize: 12,
                        padding: "4px 6px",
                      }}
                    >
                      {show[key] ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
                style={{ marginTop: 4 }}
              >
                {pwLoading ? "Saving…" : "Update Password"}
              </button>
            </form>
          )}

          {!pwEditing && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "var(--surface)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}
              >
                • Use a strong password of at least 8 characters
                <br />• Mix letters, numbers and symbols
                <br />• Do not share your password with anyone
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slot for role-specific extra content */}
      {children}
    </>
  );
}
