"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookMarked,
  Star,
  Users,
  Calendar,
  Hash,
  Building2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Tag,
  Lock,
  Crown,
  MessageSquare,
  Pencil,
  Trash2,
  Send,
  X,
} from "lucide-react";
import {
  apiGetBook,
  apiGetBookReviews,
  apiGetMyReview,
  apiUpsertReview,
  apiDeleteReview,
  type Review,
} from "@/lib/api";
import IssueModal from "@/components/borrow/IssueModal";
import { getBookCoverClass } from "@/lib/utils";
import { useFetch } from "@/lib/useFetch";

const COVER_GRADIENTS: Record<string, string> = {
  "cover-1": "linear-gradient(160deg,#c8102e 0%,#6b0018 60%,#2d000a 100%)",
  "cover-2": "linear-gradient(160deg,#ff9f0a 0%,#c8102e 60%,#7a0000 100%)",
  "cover-3": "linear-gradient(160deg,#af52de 0%,#6a0080 55%,#1a0030 100%)",
  "cover-4": "linear-gradient(160deg,#32ade6 0%,#1a5fa8 55%,#050c28 100%)",
  "cover-5": "linear-gradient(160deg,#34c759 0%,#1a8a3a 55%,#002611 100%)",
  "cover-6": "linear-gradient(160deg,#ff2d55 0%,#b80030 55%,#330010 100%)",
};

function DetailSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div
        style={{ height: 420, background: "var(--fill)", borderRadius: 0 }}
      />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 32,
            marginTop: -120,
          }}
        >
          <div
            style={{ height: 340, borderRadius: 18, background: "var(--fill)" }}
          />
          <div style={{ paddingTop: 130 }}>
            <div
              style={{
                height: 16,
                width: 120,
                borderRadius: 8,
                background: "var(--fill)",
                marginBottom: 16,
              }}
            />
            <div
              style={{
                height: 36,
                width: "70%",
                borderRadius: 8,
                background: "var(--fill)",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                height: 20,
                width: "40%",
                borderRadius: 8,
                background: "var(--fill)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Star picker ────────────────────────────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            transition: "transform 120ms",
            transform: hovered >= s ? "scale(1.2)" : "scale(1)",
          }}
        >
          <Star
            size={26}
            fill={(hovered || value) >= s ? "#FF9F0A" : "transparent"}
            color={(hovered || value) >= s ? "#FF9F0A" : "var(--border)"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Single review card ──────────────────────────────────────────────────────
function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = (review.member?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const color = review.member?.avatarColor ?? "#c8102e";
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 16,
        border: isOwn
          ? "1.5px solid rgba(200,16,46,0.35)"
          : "1px solid var(--border)",
        padding: "18px 20px",
        boxShadow: isOwn
          ? "0 0 0 3px rgba(200,16,46,0.06)"
          : "var(--shadow-card)",
        position: "relative",
      }}
    >
      {isOwn && (
        <span
          style={{
            position: "absolute",
            top: 14,
            right: isOwn ? 80 : 14,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--primary)",
            background: "rgba(200,16,46,0.1)",
            padding: "2px 8px",
            borderRadius: 20,
          }}
        >
          Your review
        </span>
      )}
      {isOwn && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            onClick={onEdit}
            title="Edit"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--fill)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,59,48,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--danger)",
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{ fontWeight: 700, fontSize: 14, color: "var(--heading)" }}
          >
            {review.member?.name ?? "Member"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{date}</div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 2,
            paddingRight: isOwn ? 68 : 0,
          }}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              fill={s <= review.rating ? "#FF9F0A" : "transparent"}
              color={s <= review.rating ? "#FF9F0A" : "var(--border)"}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--body)",
            lineHeight: 1.7,
          }}
        >
          {review.comment}
        </p>
      )}
    </div>
  );
}

// ─── Full reviews section ─────────────────────────────────────────────────────
function BookReviews({ bookId }: { bookId: string }) {
  const {
    data: reviewData,
    loading: reviewsLoading,
    refresh: refreshReviews,
  } = useFetch(() => apiGetBookReviews(bookId, { limit: 20 }), [bookId]);

  const {
    data: myReview,
    loading: myReviewLoading,
    refresh: refreshMyReview,
  } = useFetch(() => apiGetMyReview(bookId), [bookId]);

  const [formOpen, setFormOpen] = useState(false);
  const [starValue, setStarValue] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const openForm = useCallback((existing?: Review | null) => {
    setStarValue(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
    setError("");
    setFormOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (starValue === 0) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiUpsertReview(bookId, {
        rating: starValue,
        comment: comment.trim() || undefined,
      });
      setFormOpen(false);
      refreshReviews();
      refreshMyReview();
    } catch {
      setError("Failed to save review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;
    setDeleting(true);
    try {
      await apiDeleteReview(bookId);
      refreshReviews();
      refreshMyReview();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const reviews = reviewData?.reviews ?? [];
  const total = reviewData?.total ?? 0;

  // Sort: own review first
  const sorted = myReview
    ? [
        { ...myReview, member: undefined },
        ...reviews.filter((r) => r.id !== myReview.id),
      ]
    : reviews;

  return (
    <div style={{ marginTop: 32 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(200,16,46,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageSquare size={17} color="var(--primary)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--heading)",
                margin: 0,
              }}
            >
              Ratings &amp; Reviews
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              {total} review{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {!formOpen && (
          <button
            onClick={() => openForm(myReview)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 18px",
              borderRadius: 12,
              background: myReview
                ? "var(--fill)"
                : "linear-gradient(135deg,#c8102e,#a00020)",
              border: myReview ? "1px solid var(--border)" : "none",
              color: myReview ? "var(--body)" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: myReview ? "none" : "0 4px 14px rgba(200,16,46,0.3)",
            }}
          >
            {myReview ? (
              <>
                <Pencil size={14} /> Edit Your Review
              </>
            ) : (
              <>
                <Star size={14} fill="#fff" /> Write a Review
              </>
            )}
          </button>
        )}
      </div>

      {/* Write / Edit form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--card)",
            border: "1.5px solid rgba(200,16,46,0.3)",
            borderRadius: 20,
            padding: "24px 24px 20px",
            marginBottom: 24,
            boxShadow: "0 0 0 4px rgba(200,16,46,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <span
              style={{ fontWeight: 800, fontSize: 16, color: "var(--heading)" }}
            >
              {myReview ? "Edit your review" : "Write a review"}
            </span>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{
                background: "var(--fill)",
                border: "none",
                borderRadius: 8,
                width: 30,
                height: 30,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Star picker */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Your Rating *
            </div>
            <StarPicker value={starValue} onChange={setStarValue} />
            {starValue > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 4,
                  display: "block",
                }}
              >
                {
                  ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                    starValue
                  ]
                }
              </span>
            )}
          </div>

          {/* Comment textarea */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Comment (optional)
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this book..."
              rows={4}
              maxLength={1000}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--body)",
                fontSize: 14,
                padding: "12px 14px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.6,
                boxSizing: "border-box",
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
              {comment.length}/1000
            </div>
          </div>

          {error && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: 13,
                marginBottom: 12,
                padding: "8px 12px",
                background: "rgba(255,59,48,0.07)",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--fill)",
                color: "var(--body)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || starValue === 0}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 10,
                border: "none",
                background:
                  submitting || starValue === 0
                    ? "var(--fill)"
                    : "linear-gradient(135deg,#c8102e,#a00020)",
                color: submitting || starValue === 0 ? "var(--muted)" : "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  submitting || starValue === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                boxShadow:
                  submitting || starValue === 0
                    ? "none"
                    : "0 4px 14px rgba(200,16,46,0.3)",
              }}
            >
              <Send size={14} />
              {submitting ? "Saving..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviewsLoading || myReviewLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 16,
                background: "var(--fill)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--card)",
            borderRadius: 20,
            border: "1px solid var(--border)",
          }}
        >
          <MessageSquare
            size={36}
            color="var(--muted)"
            style={{ marginBottom: 12, opacity: 0.5 }}
          />
          <p
            style={{
              fontWeight: 700,
              color: "var(--heading)",
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            No reviews yet
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
            Be the first to review this book!
          </p>
          {!formOpen && (
            <button
              onClick={() => openForm(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#c8102e,#a00020)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(200,16,46,0.3)",
              }}
            >
              <Star size={14} fill="#fff" /> Write a Review
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sorted.map((r) => {
            const isOwn = myReview ? r.id === myReview.id : false;
            const fullReview = isOwn
              ? (reviews.find((rv) => rv.id === myReview!.id) ?? {
                  ...r,
                  member: undefined,
                })
              : r;
            return (
              <ReviewCard
                key={r.id}
                review={fullReview as Review}
                isOwn={isOwn}
                onEdit={() => openForm(myReview)}
                onDelete={handleDelete}
              />
            );
          })}
          {deleting && (
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              Deleting...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const { data: book, loading, refresh } = useFetch(() => apiGetBook(id), [id]);
  const [borrowOpen, setBorrowOpen] = useState(false);

  if (loading) return <DetailSkeleton />;
  if (!book)
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <BookOpen size={48} color="var(--muted)" style={{ marginBottom: 16 }} />
        <p style={{ color: "var(--muted)", fontSize: 16 }}>Book not found.</p>
        <Link
          href="/member/browse"
          style={{
            color: "var(--primary)",
            textDecoration: "none",
            fontSize: 14,
            marginTop: 8,
            display: "inline-block",
          }}
        >
          Back to Browse
        </Link>
      </div>
    );

  const coverClass = getBookCoverClass(book.id);
  const gradient = COVER_GRADIENTS[coverClass] ?? COVER_GRADIENTS["cover-1"];
  const rating = Number(book.rating ?? 0);
  const canBorrow = book.availableCopies > 0;

  const metaItems = [
    { icon: Users, label: "Author", value: book.author },
    { icon: Building2, label: "Publisher", value: book.publisher },
    { icon: Calendar, label: "Published", value: book.year },
    { icon: Hash, label: "ISBN", value: book.isbn },
    { icon: Tag, label: "Category", value: book.category },
  ].filter((m) => m.value);

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      {/* ── Hero Banner ───────────────────────────────── */}
      <div
        style={{
          position: "relative",
          height: 400,
          overflow: "hidden",
        }}
      >
        {/* Blurred cover as backdrop */}
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(28px) brightness(0.35) saturate(1.4)",
              transform: "scale(1.12)",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: gradient,
              opacity: 0.6,
            }}
          />
        )}
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Back link */}
        <div style={{ position: "absolute", top: 24, left: 24, zIndex: 10 }}>
          <Link
            href="/member/browse"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: 30,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            <ArrowLeft size={14} /> Browse Books
          </Link>
        </div>

        {/* Decorative corner glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(200,16,46,0.25)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        {/* Cover + Title row — floats up over hero */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 40,
            alignItems: "flex-end",
            marginTop: -160,
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* ── Book Cover Card ── */}
          <div
            style={{
              height: 340,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)",
              border: "3px solid rgba(255,255,255,0.12)",
              flexShrink: 0,
              background: gradient,
            }}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <BookMarked size={56} color="rgba(255,255,255,0.3)" />
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 800,
                    fontSize: 16,
                    textAlign: "center",
                    padding: "0 20px",
                    lineHeight: 1.3,
                  }}
                >
                  {book.title}
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                  {book.author}
                </span>
              </div>
            )}
          </div>

          {/* ── Title Block ── */}
          <div style={{ paddingBottom: 8, paddingTop: 24 }}>
            {/* Category badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(200,16,46,0.12)",
                border: "1px solid rgba(200,16,46,0.25)",
                color: "var(--primary)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              <Tag size={10} /> {book.category}
            </span>

            <h1
              style={{
                fontSize: "clamp(24px, 3.5vw, 40px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 10,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              {book.title}
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "rgba(255,255,255,0.8)",
                marginBottom: 20,
                fontWeight: 500,
                textShadow: "0 1px 8px rgba(0,0,0,0.4)",
              }}
            >
              by{" "}
              <span style={{ color: "#fff", fontWeight: 700 }}>
                {book.author}
              </span>
            </p>

            {/* Star rating */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={18}
                    fill={s <= Math.round(rating) ? "#FF9F0A" : "transparent"}
                    color={
                      s <= Math.round(rating)
                        ? "#FF9F0A"
                        : "rgba(255,255,255,0.35)"
                    }
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 1px 8px rgba(0,0,0,0.45)",
                }}
              >
                {rating.toFixed(1)}
              </span>
              {book.reviewCount != null && (
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
                  ({book.reviewCount} reviews)
                </span>
              )}
            </div>

            {/* Availability + Borrow CTA row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                disabled={!canBorrow}
                onClick={() => setBorrowOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  padding: "0 28px",
                  borderRadius: 14,
                  background: canBorrow
                    ? "linear-gradient(135deg, #c8102e 0%, #a00020 100%)"
                    : "var(--fill)",
                  border: "none",
                  color: canBorrow ? "#fff" : "var(--muted)",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: canBorrow ? "pointer" : "not-allowed",
                  boxShadow: canBorrow
                    ? "0 6px 24px rgba(200,16,46,0.38)"
                    : "none",
                  transition: "transform 150ms, box-shadow 150ms",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (canBorrow) {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 10px 32px rgba(200,16,46,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    canBorrow ? "0 6px 24px rgba(200,16,46,0.38)" : "none";
                }}
              >
                <BookMarked size={18} />
                {canBorrow ? "Borrow This Book" : "Not Available"}
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: canBorrow
                    ? "rgba(52,199,89,0.1)"
                    : "rgba(255,59,48,0.08)",
                  border: `1px solid ${canBorrow ? "rgba(52,199,89,0.25)" : "rgba(255,59,48,0.2)"}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: canBorrow ? "var(--success)" : "var(--danger)",
                }}
              >
                {canBorrow ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {`${book.availableCopies} / ${book.totalCopies} copies available`}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body Grid ─────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 28,
            marginTop: 32,
          }}
        >
          {/* ── Left column: Meta info ── */}
          <div>
            {/* Book Details Card */}
            <div
              style={{
                background: "var(--card)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                Book Details
              </div>
              <div style={{ padding: "8px 0" }}>
                {metaItems.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "11px 20px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--fill)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Icon size={14} color="var(--muted)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--muted)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--heading)",
                          wordBreak: "break-all",
                        }}
                      >
                        {String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copies stat pills */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 16,
              }}
            >
              {[
                {
                  label: "Total",
                  value: book.totalCopies,
                  color: "var(--primary)",
                  bg: "rgba(200,16,46,0.08)",
                  border: "rgba(200,16,46,0.2)",
                },
                {
                  label: "Available",
                  value: book.availableCopies,
                  color: canBorrow ? "var(--success)" : "var(--danger)",
                  bg: canBorrow
                    ? "rgba(52,199,89,0.08)"
                    : "rgba(255,59,48,0.08)",
                  border: canBorrow
                    ? "rgba(52,199,89,0.2)"
                    : "rgba(255,59,48,0.2)",
                },
              ].map(({ label, value, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 16,
                    padding: "16px 10px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {!canBorrow && (
              <div
                style={{
                  marginTop: 14,
                  padding: "13px 16px",
                  background: "rgba(255,59,48,0.06)",
                  borderRadius: 14,
                  fontSize: 12,
                  color: "var(--danger)",
                  border: "1px solid rgba(255,59,48,0.15)",
                  lineHeight: 1.6,
                }}
              >
                All copies are currently borrowed. Check back later or contact
                the library.
              </div>
            )}
          </div>

          {/* ── Right column: Description + extras ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Description */}
            {book.description && (
              <div
                style={{
                  background: "var(--card)",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Description
                </div>
                <p
                  style={{
                    padding: "20px 24px",
                    fontSize: 15,
                    color: "var(--body)",
                    lineHeight: 1.85,
                    margin: 0,
                  }}
                >
                  {book.description}
                </p>
              </div>
            )}

            {/* Borrow prompt when no description */}
            {!book.description && canBorrow && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(200,16,46,0.08) 0%, rgba(200,16,46,0.04) 100%)",
                  border: "1px solid rgba(200,16,46,0.2)",
                  borderRadius: 20,
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  textAlign: "center",
                }}
              >
                <BookOpen
                  size={40}
                  color="var(--primary)"
                  style={{ opacity: 0.7 }}
                />
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "var(--heading)",
                      fontSize: 15,
                      marginBottom: 6,
                    }}
                  >
                    Ready to read?
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    This book is available — borrow it today.
                  </p>
                </div>
                <button
                  onClick={() => setBorrowOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 22px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #c8102e, #a00020)",
                    border: "none",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(200,16,46,0.35)",
                  }}
                >
                  <BookMarked size={16} /> Borrow Now
                </button>
              </div>
            )}

            {/* Fun reading stats strip */}
            <div
              style={{
                background: "var(--card)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                overflow: "hidden",
              }}
            >
              {[
                {
                  label: "Rating",
                  value: rating > 0 ? rating.toFixed(1) : "N/A",
                  sub: "out of 5",
                  color: "#FF9F0A",
                  icon: Star,
                },
                {
                  label: "Reviews",
                  value: book.reviewCount ?? 0,
                  sub: "total",
                  color: "var(--primary)",
                  icon: Users,
                },
                {
                  label: "Year",
                  value: book.year ?? "—",
                  sub: "published",
                  color: "var(--success)",
                  icon: Calendar,
                },
              ].map(({ label, value, sub, color, icon: Icon }, i) => (
                <div
                  key={label}
                  style={{
                    padding: "22px 16px",
                    textAlign: "center",
                    borderRight: i < 2 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${color}1a`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--heading)",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {sub}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--muted)",
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        <BookReviews bookId={id} />
      </div>

      <IssueModal
        open={borrowOpen}
        preselectedBook={book}
        onClose={() => setBorrowOpen(false)}
        onSuccess={() => {
          setBorrowOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
