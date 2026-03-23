"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  BookMarked,
  Star,
  Users,
  Calendar,
  Hash,
  Building2,
  Tag,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { apiGetBook, apiGetBookReviews, type Review } from "@/lib/api";
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
      <div style={{ height: 420, background: "var(--fill)" }} />
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

function ReviewCard({ review }: { review: Review }) {
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
        border: "1px solid var(--border)",
        padding: "18px 20px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: review.comment ? 12 : 0,
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
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

function ReadOnlyReviews({ bookId }: { bookId: string }) {
  const { data: reviewData, loading } = useFetch(
    () => apiGetBookReviews(bookId, { limit: 20 }),
    [bookId],
  );
  const reviews = reviewData?.reviews ?? [];
  const total = reviewData?.total ?? 0;
  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
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
            Member Reviews
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            {total} review{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      {loading ? (
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
      ) : reviews.length === 0 ? (
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
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Members haven&apos;t reviewed this book yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LibrarianBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: book, loading } = useFetch(() => apiGetBook(id), [id]);

  if (loading) return <DetailSkeleton />;
  if (!book)
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>Book not found.</p>
        <Link
          href="/librarian/books"
          style={{
            color: "var(--primary)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Back to Books
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
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
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
            href="/librarian/books"
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
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            <ArrowLeft size={14} /> Books
          </Link>
        </div>
        {/* Decorative glow */}
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
          {/* Book Cover Card */}
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

          {/* Title Block */}
          <div style={{ paddingBottom: 8, paddingTop: 24 }}>
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
                color: "var(--heading)",
                lineHeight: 1.15,
                marginBottom: 10,
                letterSpacing: "-0.02em",
              }}
            >
              {book.title}
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--muted)",
                marginBottom: 20,
                fontWeight: 500,
              }}
            >
              by{" "}
              <span style={{ color: "var(--body)", fontWeight: 600 }}>
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
                      s <= Math.round(rating) ? "#FF9F0A" : "var(--border)"
                    }
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                {rating.toFixed(1)}
              </span>
              {book.reviewCount != null && (
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  ({book.reviewCount} reviews)
                </span>
              )}
            </div>

            {/* Availability + Edit CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
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
                {book.availableCopies} / {book.totalCopies} copies available
              </div>

              <Link
                href={`/librarian/books/${book.id}/edit`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 12,
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                  color: "var(--body)",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "var(--shadow-card)",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--fill)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--card)")
                }
              >
                <Edit3 size={16} /> Edit Book
              </Link>
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
          {/* Left: Meta info */}
          <div>
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
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
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
                {
                  label: "Borrowed",
                  value: book.totalCopies - book.availableCopies,
                  color: "var(--warning, #ff9f0a)",
                  bg: "rgba(255,159,10,0.08)",
                  border: "rgba(255,159,10,0.2)",
                },
              ].map(({ label, value, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 14,
                    padding: "14px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
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
          </div>

          {/* Right: Description + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

            {/* Quick stats strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
              }}
            >
              {[
                {
                  icon: Star,
                  label: "Rating",
                  value: rating.toFixed(1),
                  color: "#FF9F0A",
                  bg: "rgba(255,159,10,0.08)",
                  border: "rgba(255,159,10,0.18)",
                },
                {
                  icon: MessageSquare,
                  label: "Reviews",
                  value: book.reviewCount ?? 0,
                  color: "var(--primary)",
                  bg: "rgba(200,16,46,0.07)",
                  border: "rgba(200,16,46,0.15)",
                },
                {
                  icon: Calendar,
                  label: "Year",
                  value: book.year ?? "—",
                  color: "var(--body)",
                  bg: "var(--fill)",
                  border: "var(--border)",
                },
              ].map(({ icon: Icon, label, value, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 18,
                    padding: "20px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    <Icon size={17} color={color} />
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color,
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews (read-only) */}
        <ReadOnlyReviews bookId={book.id} />
      </div>
    </div>
  );
}
