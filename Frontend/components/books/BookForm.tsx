"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Upload,
  Link2,
  X,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Plus,
  Minus,
  Check,
  BookText,
  Library,
  Package,
  ImageIcon,
  AlignLeft,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { apiCreateBook, apiUpdateBook, apiUploadBookCover } from "@/lib/api";
import { CATEGORIES } from "@/lib/mockData";
import { Book } from "@/lib/mockData";
import { getBookCoverClass } from "@/lib/utils";

const COVER_GRADIENTS: Record<string, string> = {
  "cover-1": "linear-gradient(160deg,#c8102e 0%,#6b0018 60%,#2d000a 100%)",
  "cover-2": "linear-gradient(160deg,#ff9f0a 0%,#c8102e 60%,#7a0000 100%)",
  "cover-3": "linear-gradient(160deg,#af52de 0%,#6a0080 55%,#1a0030 100%)",
  "cover-4": "linear-gradient(160deg,#32ade6 0%,#1a5fa8 55%,#050c28 100%)",
  "cover-5": "linear-gradient(160deg,#34c759 0%,#1a8a3a 55%,#002611 100%)",
  "cover-6": "linear-gradient(160deg,#ff2d55 0%,#b80030 55%,#330010 100%)",
};

const GLOW: Record<string, string> = {
  "cover-1": "200,16,46",
  "cover-2": "255,159,10",
  "cover-3": "175,82,222",
  "cover-4": "50,173,230",
  "cover-5": "52,199,89",
  "cover-6": "255,45,85",
};

interface BookFormProps {
  book?: Partial<Book>;
  returnPath: string;
  isEdit?: boolean;
}

const EMPTY: Partial<Book> = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publisher: "",
  year: new Date().getFullYear(),
  totalCopies: 1,
  description: "",
  coverUrl: "",
};

/* ── Section card wrapper ─────────────────────────────── */
function Section({
  icon,
  accent,
  number,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  accent: string;
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 18,
        border: "1px solid var(--border)",
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          borderBottom: "1px solid var(--border)",
          background: "var(--fill)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: `rgba(${accent},0.10)`,
            border: `1.5px solid rgba(${accent},0.22)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 900,
                color: `rgb(${accent})`,
                opacity: 0.7,
                letterSpacing: "0.06em",
              }}
            >
              {number}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {title}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {/* Card body */}
      <div
        style={{
          padding: "18px 18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Field wrapper ────────────────────────────────────── */
function F({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 7,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--primary)" }}>*</span>}
        {hint && (
          <span
            style={{
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11,
              color: "var(--muted)",
              opacity: 0.65,
              marginLeft: 4,
            }}
          >
            — {hint}
          </span>
        )}
      </div>
      {children}
      {error && (
        <div
          style={{
            fontSize: 11,
            color: "var(--danger)",
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--danger)",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          {error}
        </div>
      )}
    </div>
  );
}

/* ── Two-column grid ─────────────────────────────────── */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {children}
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function BookForm({
  book,
  returnPath,
  isEdit = false,
}: BookFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [form, setForm] = useState<Partial<Book>>(book ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverMode, setCoverMode] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    book?.coverUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (book) {
      setForm(book);
      setPreviewUrl(book.coverUrl || null);
    }
  }, [book]);

  const set = (key: keyof Book, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadedUrl = await apiUploadBookCover(file);
      set("coverUrl", uploadedUrl);
      setPreviewUrl(uploadedUrl);
      success("Cover uploaded!");
    } catch {
      error("Failed to upload image.");
      setPreviewUrl(null);
      set("coverUrl", "");
    } finally {
      setUploading(false);
    }
  };

  const clearCover = () => {
    set("coverUrl", "");
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title?.trim()) e.title = "Title is required";
    if (!form.author?.trim()) e.author = "Author is required";
    if (!form.isbn?.trim()) e.isbn = "ISBN is required";
    if (!form.category) e.category = "Category required";
    if (!form.totalCopies || Number(form.totalCopies) < 1)
      e.totalCopies = "At least 1 copy";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && book?.id) {
        await apiUpdateBook(book.id, form);
        success("Book updated!");
      } else {
        await apiCreateBook(form);
        success("Book added to catalog!");
      }
      router.push(returnPath);
    } catch {
      error("Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  const coverClass = getBookCoverClass(form.id || "preview");
  const gradient = COVER_GRADIENTS[coverClass] ?? COVER_GRADIENTS["cover-1"];
  const glow = GLOW[coverClass] ?? "200,16,46";

  const inputStyle = (hasErr?: boolean): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: hasErr ? "1.5px solid var(--danger)" : "1.5px solid var(--border)",
    background: "var(--surface)",
    color: "var(--heading)",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    transition: "border-color 150ms",
  });

  const selectStyle = (hasErr?: boolean): React.CSSProperties => ({
    ...inputStyle(hasErr),
    appearance: "none",
    cursor: "pointer",
  });

  return (
    <div>
      {/* ── Sticky action bar ── */}
      <div
        style={{
          position: "sticky",
          top: 60,
          zIndex: 49,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
          }}
        >
          <Link
            href={returnPath}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: 30,
              padding: "0 10px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "var(--fill)",
              color: "var(--body)",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <div
            style={{
              width: 1,
              height: 16,
              background: "var(--border)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 9px",
              borderRadius: 20,
              background: "rgba(200,16,46,0.1)",
              border: "1px solid rgba(200,16,46,0.2)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--primary)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <BookOpen size={9} />
            {isEdit ? "Editing" : "New Book"}
          </span>
          {form.title && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--heading)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {form.title}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => router.push(returnPath)}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "transparent",
              color: "var(--body)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              height: 32,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: saving
                ? "var(--fill)"
                : "linear-gradient(135deg,#c8102e,#a00020)",
              color: saving ? "var(--muted)" : "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              boxShadow: saving ? "none" : "0 2px 10px rgba(200,16,46,0.4)",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={12} className="spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={12} />
                {isEdit ? "Update Book" : "Add Book"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="bf-grid">
        {/* LEFT: dark sticky stage */}
        <div
          className="bf-stage-hide-mobile"
          style={{
            position: "sticky",
            top: 112,
            height: "calc(100vh - 112px)",
            overflow: "hidden",
            background:
              "linear-gradient(180deg,#0a0a0e 0%,#111118 50%,#0a0a0e 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "32px 20px 24px",
            gap: 0,
          }}
        >
          {/* Glow blob */}
          <div
            style={{
              position: "absolute",
              top: "28%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 240,
              height: 240,
              background: `rgba(${glow},0.14)`,
              filter: "blur(60px)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          {/* Live dot */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}
          >
            <span className="bf-live-dot" /> Live Preview
          </div>

          {/* Book cover */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                position: "absolute",
                left: -10,
                top: 5,
                bottom: 5,
                width: 10,
                background:
                  "linear-gradient(90deg,rgba(0,0,0,0.0),rgba(0,0,0,0.55))",
                borderRadius: "3px 0 0 3px",
              }}
            />
            <div
              style={{
                width: 190,
                height: 272,
                borderRadius: "1px 12px 12px 1px",
                background: gradient,
                overflow: "hidden",
                position: "relative",
                boxShadow: `0 32px 80px rgba(0,0,0,0.75), 0 0 50px rgba(${glow},0.22), inset -3px 0 8px rgba(0,0,0,0.25)`,
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="cover"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 40%)",
                  pointerEvents: "none",
                }}
              />
              {!previewUrl && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookMarked
                    size={34}
                    color="rgba(255,255,255,0.18)"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,255,255,0.1))",
                }}
              />
            </div>
            <div
              style={{
                width: 190,
                height: 32,
                background: gradient,
                opacity: 0.09,
                filter: "blur(3px)",
                transform: "scaleY(-1)",
                borderRadius: "0 0 6px 6px",
                marginTop: 2,
              }}
            />
          </div>

          {/* Title + author */}
          <div
            style={{
              textAlign: "center",
              maxWidth: 290,
              marginTop: 22,
              padding: "0 8px",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.25,
              }}
            >
              {form.title || (
                <em
                  style={{
                    color: "rgba(255,255,255,0.18)",
                    fontWeight: 400,
                    fontSize: 14,
                  }}
                >
                  Untitled Book
                </em>
              )}
            </div>
            {form.author && (
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: 5,
                }}
              >
                by {form.author}
              </div>
            )}
          </div>

          {/* Chips */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 16,
              padding: "0 16px",
            }}
          >
            {form.category && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: `rgb(${glow})`,
                  background: `rgba(${glow},0.12)`,
                  border: `1px solid rgba(${glow},0.3)`,
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {form.category}
              </span>
            )}
            {form.year && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.38)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {form.year}
              </span>
            )}
            {(form.totalCopies ?? 0) > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(52,199,89,0.85)",
                  background: "rgba(52,199,89,0.1)",
                  border: "1px solid rgba(52,199,89,0.22)",
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {form.totalCopies}{" "}
                {Number(form.totalCopies) === 1 ? "copy" : "copies"}
              </span>
            )}
          </div>

          {/* Right edge line */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "8%",
              bottom: "8%",
              width: 1,
              background:
                "linear-gradient(180deg,transparent,rgba(255,255,255,0.07) 30%,rgba(255,255,255,0.07) 70%,transparent)",
            }}
          />
        </div>

        {/* RIGHT: form */}
        <div
          style={{
            background: "var(--surface)",
            padding: "20px 0 48px",
            minWidth: 0,
          }}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* 01 — Basic Information */}
            <Section
              number="01"
              icon={
                <BookText size={17} color={`rgb(200,16,46)`} strokeWidth={2} />
              }
              accent="200,16,46"
              title="Basic Information"
              subtitle="Title and author of the book"
            >
              <F label="Title" required error={errors.title}>
                <input
                  style={inputStyle(!!errors.title)}
                  value={form.title || ""}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. The Great Gatsby"
                />
              </F>
              <F label="Author" required error={errors.author}>
                <input
                  style={inputStyle(!!errors.author)}
                  value={form.author || ""}
                  onChange={(e) => set("author", e.target.value)}
                  placeholder="e.g. F. Scott Fitzgerald"
                />
              </F>
            </Section>

            {/* 02 — Publishing Details */}
            <Section
              number="02"
              icon={
                <Library size={17} color={`rgb(50,173,230)`} strokeWidth={2} />
              }
              accent="50,173,230"
              title="Publishing Details"
              subtitle="ISBN, category, publisher, year"
            >
              <Row>
                <F label="ISBN" required error={errors.isbn}>
                  <input
                    style={inputStyle(!!errors.isbn)}
                    value={form.isbn || ""}
                    onChange={(e) => set("isbn", e.target.value)}
                    placeholder="978-0-00-000000-0"
                  />
                </F>
                <F label="Category" required error={errors.category}>
                  <select
                    style={selectStyle(!!errors.category)}
                    value={form.category || ""}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </F>
              </Row>
              <Row>
                <F label="Publisher" hint="optional">
                  <input
                    style={inputStyle()}
                    value={form.publisher || ""}
                    onChange={(e) => set("publisher", e.target.value)}
                    placeholder="Publisher name"
                  />
                </F>
                <F label="Publication Year" hint="optional">
                  <input
                    style={inputStyle()}
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.year || ""}
                    onChange={(e) => set("year", Number(e.target.value))}
                  />
                </F>
              </Row>
            </Section>

            {/* 03 — Inventory */}
            <Section
              number="03"
              icon={
                <Package size={17} color={`rgb(52,199,89)`} strokeWidth={2} />
              }
              accent="52,199,89"
              title="Inventory"
              subtitle="Number of physical copies in the library"
            >
              <F label="Total Copies" required error={errors.totalCopies}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "totalCopies",
                        Math.max(1, Number(form.totalCopies ?? 1) - 1),
                      )
                    }
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: "1.5px solid var(--border)",
                      background: "var(--fill)",
                      color: "var(--body)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 18,
                    }}
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={form.totalCopies || ""}
                    onChange={(e) => set("totalCopies", Number(e.target.value))}
                    style={{
                      width: 80,
                      height: 40,
                      borderRadius: 10,
                      border: "1.5px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--heading)",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: 18,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "totalCopies",
                        Math.min(999, Number(form.totalCopies ?? 0) + 1),
                      )
                    }
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg,#c8102e,#a00020)",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(200,16,46,0.4)",
                    }}
                  >
                    <Plus size={15} />
                  </button>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    copies
                  </span>
                </div>
              </F>
              {isEdit && book?.availableCopies != null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    background: "rgba(52,199,89,0.06)",
                    border: "1.5px solid rgba(52,199,89,0.18)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: "rgba(52,199,89,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={15} color="rgb(52,199,89)" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "rgb(52,199,89)",
                      }}
                    >
                      {book.availableCopies} copies currently available
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 1,
                      }}
                    >
                      {Number(form.totalCopies ?? 0) -
                        (book.availableCopies ?? 0)}{" "}
                      currently borrowed
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* 04 — Cover Image */}
            <Section
              number="04"
              icon={
                <ImageIcon
                  size={17}
                  color={`rgb(175,82,222)`}
                  strokeWidth={2}
                />
              }
              accent="175,82,222"
              title="Cover Image"
              subtitle="Upload or link a cover photo (optional)"
            >
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 6 }}>
                {(["url", "file"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCoverMode(mode)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 36,
                      padding: "0 14px",
                      borderRadius: 9,
                      border:
                        coverMode === mode
                          ? "1.5px solid var(--primary)"
                          : "1.5px solid var(--border)",
                      background:
                        coverMode === mode
                          ? "rgba(200,16,46,0.07)"
                          : "var(--fill)",
                      color:
                        coverMode === mode ? "var(--primary)" : "var(--body)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 150ms",
                    }}
                  >
                    {mode === "url" ? (
                      <Link2 size={12} />
                    ) : (
                      <Upload size={12} />
                    )}
                    {mode === "url" ? "Paste URL" : "Upload File"}
                  </button>
                ))}
              </div>

              {coverMode === "url" ? (
                <F label="Image URL">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...inputStyle(), flex: 1 }}
                      value={form.coverUrl || ""}
                      onChange={(e) => {
                        set("coverUrl", e.target.value);
                        setPreviewUrl(e.target.value || null);
                      }}
                      placeholder="https://example.com/cover.jpg"
                    />
                    {form.coverUrl && (
                      <button
                        type="button"
                        onClick={clearCover}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          border: "1.5px solid var(--border)",
                          background: "var(--fill)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "var(--danger)",
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {previewUrl && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: "var(--fill)",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt="preview"
                        style={{
                          height: 52,
                          width: 36,
                          objectFit: "cover",
                          borderRadius: 6,
                          flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--heading)",
                          }}
                        >
                          Cover preview looks good
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {previewUrl}
                        </div>
                      </div>
                    </div>
                  )}
                </F>
              ) : (
                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 14,
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--fill)",
                    transition: "border-color 150ms, background 150ms",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    const d = e.currentTarget as HTMLDivElement;
                    d.style.borderColor = "var(--primary)";
                    d.style.background = "rgba(200,16,46,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    const d = e.currentTarget as HTMLDivElement;
                    d.style.borderColor = "var(--border)";
                    d.style.background = "var(--fill)";
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {uploading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        color: "var(--primary)",
                      }}
                    >
                      <Loader2 size={24} className="spin" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        Uploading…
                      </span>
                    </div>
                  ) : previewUrl ? (
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <img
                        src={previewUrl}
                        alt="Cover"
                        style={{
                          maxHeight: 110,
                          maxWidth: "100%",
                          borderRadius: 10,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCover();
                        }}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "var(--danger)",
                          border: "2px solid var(--card)",
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={11} color="#fff" />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--muted)",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: "var(--surface)",
                          border: "1.5px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--body)",
                          marginTop: 2,
                        }}
                      >
                        Click to upload a cover
                      </div>
                      <div style={{ fontSize: 12 }}>
                        JPEG, PNG, or WebP · max 5 MB
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* 05 — Description */}
            <Section
              number="05"
              icon={
                <AlignLeft
                  size={17}
                  color={`rgb(255,159,10)`}
                  strokeWidth={2}
                />
              }
              accent="255,159,10"
              title="Description"
              subtitle="Synopsis or notes about the book"
            >
              <F label="Summary" hint="optional">
                <textarea
                  value={form.description || ""}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Write a brief synopsis or any notes about this book…"
                  maxLength={2000}
                  rows={5}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    borderRadius: 11,
                    border: "1.5px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--heading)",
                    fontSize: 14,
                    fontWeight: 500,
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    textAlign: "right",
                    marginTop: 4,
                  }}
                >
                  {(form.description || "").length} / 2000
                </div>
              </F>
            </Section>

            {/* Bottom action bar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                paddingTop: 4,
              }}
            >
              <button
                type="button"
                onClick={() => router.push(returnPath)}
                style={{
                  height: 46,
                  padding: "0 24px",
                  borderRadius: 12,
                  border: "1.5px solid var(--border)",
                  background: "transparent",
                  color: "var(--body)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  height: 46,
                  padding: "0 32px",
                  borderRadius: 12,
                  border: "none",
                  background: saving
                    ? "var(--fill)"
                    : "linear-gradient(135deg,#c8102e,#a00020)",
                  color: saving ? "var(--muted)" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: saving ? "none" : "0 4px 18px rgba(200,16,46,0.4)",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    {isEdit ? "Update Book" : "Add Book"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
