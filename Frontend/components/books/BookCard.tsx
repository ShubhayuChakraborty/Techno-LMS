"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  BookOpen,
  Pencil,
  Trash2,
  BookMarked,
  Lock,
  Crown,
} from "lucide-react";
import type { Book } from "@/lib/mockData";
import { getBookCoverClass } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  href: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showBorrow?: boolean;
  locked?: boolean;
  lockMessage?: string;
  onUpgrade?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBorrow?: () => void;
}

const COVER_GRADIENTS: Record<string, string> = {
  "cover-1": "linear-gradient(160deg,#c8102e 0%,#6b0018 60%,#2d000a 100%)",
  "cover-2": "linear-gradient(160deg,#ff9f0a 0%,#c8102e 60%,#7a0000 100%)",
  "cover-3": "linear-gradient(160deg,#af52de 0%,#6a0080 55%,#1a0030 100%)",
  "cover-4": "linear-gradient(160deg,#32ade6 0%,#1a5fa8 55%,#050c28 100%)",
  "cover-5": "linear-gradient(160deg,#34c759 0%,#1a8a3a 55%,#002611 100%)",
  "cover-6": "linear-gradient(160deg,#ff2d55 0%,#b80030 55%,#330010 100%)",
};

export default function BookCard({
  book,
  href,
  showEdit,
  showDelete,
  showBorrow,
  locked = false,
  lockMessage = "Premium book. Upgrade to Max to borrow.",
  onUpgrade,
  onEdit,
  onDelete,
  onBorrow,
}: BookCardProps) {
  const coverClass = getBookCoverClass(book.id);
  const available = book.availableCopies > 0;
  const gradient = COVER_GRADIENTS[coverClass] ?? COVER_GRADIENTS["cover-1"];
  const rating = Number(book.rating);
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      style={{
        perspective: "900px",
        height: 340,
        cursor: locked ? "default" : "pointer",
        position: "relative",
      }}
      onMouseEnter={() => !locked && setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.23,1,0.32,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          borderRadius: 18,
        }}
      >
        {/* -- FRONT ---------------------------------- */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {/* Full cover image */}
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
                background: gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookMarked size={64} color="rgba(255,255,255,0.25)" />
            </div>
          )}

          {/* Gradient overlay (bottom) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)",
              borderRadius: 18,
            }}
          />

          {/* Availability pill */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: available
                ? "rgba(52,199,89,0.92)"
                : "rgba(255,59,48,0.92)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "4px 9px",
              borderRadius: 20,
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#fff",
                display: "inline-block",
                opacity: 0.9,
              }}
            />
            {available ? `${book.availableCopies} left` : "Out"}
          </div>

          {/* Bottom info */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "14px 14px 14px",
            }}
          >
            {/* Category chip */}
            <span
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: 20,
                marginBottom: 8,
              }}
            >
              {book.category}
            </span>
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1.25,
                marginBottom: 4,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {book.title}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              {book.author}
            </div>
            {/* Rating bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={10}
                    fill={s <= Math.round(rating) ? "#FF9F0A" : "transparent"}
                    color={
                      s <= Math.round(rating)
                        ? "#FF9F0A"
                        : "rgba(255,255,255,0.4)"
                    }
                  />
                ))}
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Flip hint */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={13} color="rgba(255,255,255,0.8)" />
          </div>
        </div>

        {/* -- BACK ----------------------------------- */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 18,
            overflow: "hidden",
            background: gradient,
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            padding: 18,
          }}
        >
          {/* Blurred cover bg */}
          {book.coverUrl && (
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
                filter: "blur(18px) brightness(0.3)",
                transform: "scale(1.1)",
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Mini cover thumbnail */}
            <div
              style={{
                width: 52,
                height: 68,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                marginBottom: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookMarked size={20} color="rgba(255,255,255,0.5)" />
                </div>
              )}
            </div>

            {/* Title + Author */}
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1.25,
                marginBottom: 4,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {book.title}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {book.author}
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                {
                  label: "Copies",
                  value: `${book.availableCopies}/${book.totalCopies}`,
                },
                { label: "Year", value: book.year || "—" },
                { label: "Rating", value: rating.toFixed(1) },
                { label: "Reviews", value: book.reviewCount ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "7px 10px",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {book.description && (
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 11,
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  marginBottom: 12,
                  flex: 1,
                }}
              >
                {book.description}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 7, marginTop: "auto" }}>
              <Link
                href={href}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
                }
              >
                <BookOpen size={13} /> Details
              </Link>

              {showBorrow && (
                <button
                  onClick={onBorrow}
                  disabled={!available}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 36,
                    borderRadius: 10,
                    background: available
                      ? "rgba(52,199,89,0.9)"
                      : "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: available ? "pointer" : "not-allowed",
                    opacity: available ? 1 : 0.5,
                    transition: "background 150ms",
                  }}
                >
                  {available ? "Borrow" : "Unavailable"}
                </button>
              )}

              {showEdit && (
                <button
                  onClick={onEdit}
                  title="Edit"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pencil size={13} />
                </button>
              )}

              {showDelete && (
                <button
                  onClick={onDelete}
                  title="Delete"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: "rgba(255,59,48,0.8)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: "rgba(5,8,16,0.48)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            gap: 10,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Lock size={20} />
          </div>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
            Premium Access Locked
          </div>
          <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 11 }}>
            {lockMessage}
          </div>
          <button
            onClick={onUpgrade}
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Crown size={12} /> Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}
