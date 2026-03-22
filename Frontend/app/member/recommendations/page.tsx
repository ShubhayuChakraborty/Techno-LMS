"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bot, RefreshCw, TrendingUp, Sparkles, Star } from "lucide-react";
import {
  apiGetMyRecommendations,
  AIRecommendation,
  TrendingBook,
} from "@/lib/api";
import IssueModal from "@/components/borrow/IssueModal";

const GRADIENTS = [
  "linear-gradient(150deg,#c8102e,#9b0e24)",
  "linear-gradient(150deg,#2563eb,#1d4ed8)",
  "linear-gradient(150deg,#7c3aed,#6d28d9)",
  "linear-gradient(150deg,#059669,#047857)",
  "linear-gradient(150deg,#d97706,#b45309)",
  "linear-gradient(150deg,#db2777,#9d174d)",
  "linear-gradient(150deg,#0891b2,#0e7490)",
  "linear-gradient(150deg,#4f46e5,#4338ca)",
];

function getInitials(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const BookCoverArea = React.memo(function BookCoverArea({
  title,
  coverUrl,
  gradient,
}: {
  title: string;
  coverUrl?: string | null;
  gradient: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = coverUrl && !imgError;
  return (
    <div
      style={{
        height: 180,
        background: gradient,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl!}
          alt={title}
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: 2,
            userSelect: "none",
          }}
        >
          {getInitials(title)}
        </span>
      )}
    </div>
  );
});

const STRATEGY_COLORS: Record<string, string> = {
  ai: "rgba(139,92,246,0.15)",
  collaborative: "rgba(29,127,236,0.12)",
  content: "rgba(16,185,129,0.12)",
  popularity: "rgba(245,158,11,0.12)",
  fallback: "rgba(107,114,128,0.12)",
};
const STRATEGY_TEXT: Record<string, string> = {
  ai: "#8b5cf6",
  collaborative: "var(--primary)",
  content: "#10b981",
  popularity: "#f59e0b",
  fallback: "#6b7280",
};

const BookCardSkeleton = React.memo(function BookCardSkeleton() {
  return (
    <div
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          height: 180,
          background: "var(--hover)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            height: 12,
            background: "var(--hover)",
            borderRadius: 6,
            width: "70%",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 10,
            background: "var(--hover)",
            borderRadius: 6,
            width: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 32,
            background: "var(--hover)",
            borderRadius: 8,
            marginTop: 8,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
});

export default function MemberRecommendationsPage() {
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [trending, setTrending] = useState<TrendingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issueBook, setIssueBook] = useState<any>(null);
  const [issueOpen, setIssueOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiGetMyRecommendations();
      if (data) {
        setRecs(data.recommendations ?? []);
        setTrending(data.trending ?? []);
      }
    } catch {
      // keep previous data visible on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openBorrow = (book: any) => {
    setIssueBook(book);
    setIssueOpen(true);
  };

  return (
    <div className="page">
      {/* Header */}
      <div
        className="page-header"
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 className="page-title">Recommended For You</h1>
          <p className="page-subtitle">
            AI-powered picks based on your reading history
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
          }}
          onClick={() => load(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* AI banner */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: 32,
          background:
            "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(29,127,236,0.05))",
          border: "1.5px solid rgba(139,92,246,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
          }}
        >
          <Bot size={22} color="white" />
        </div>
        <div>
          <div
            style={{ fontWeight: 700, color: "var(--heading)", fontSize: 15 }}
          >
            AI Recommendation Engine · Active
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            Personalised suggestions are generated automatically from your
            borrow history and reading patterns.
          </div>
        </div>
      </div>

      {/* ── Recommended For You ── */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <Sparkles size={18} color="#8b5cf6" />
          <h2
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: "var(--heading)",
              margin: 0,
            }}
          >
            Recommended For You
          </h2>
        </div>

        {loading ? (
          <div className="books-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div
            className="card"
            style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
          >
            <Bot size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              No recommendations yet
            </div>
            <div style={{ fontSize: 13 }}>
              Borrow a few books and we'll personalise your feed automatically.
            </div>
          </div>
        ) : (
          <div className="books-grid">
            {recs.map((rec, i) => {
              const book = rec.book;
              const matchPct = Math.round(rec.score * 100);
              const strategyColor =
                STRATEGY_COLORS[rec.strategy] ?? STRATEGY_COLORS.fallback;
              const strategyTextColor =
                STRATEGY_TEXT[rec.strategy] ?? STRATEGY_TEXT.fallback;
              return (
                <div
                  key={rec.id}
                  className="card"
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <BookCoverArea
                    title={book.title}
                    coverUrl={book.coverUrl}
                    gradient={GRADIENTS[i % GRADIENTS.length]}
                  />

                  <div
                    style={{
                      padding: 14,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--heading)",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {book.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {book.author}
                    </div>
                    {rec.reason && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontWeight: 600,
                          background: strategyColor,
                          color: strategyTextColor,
                          alignSelf: "flex-start",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {rec.reason}
                      </span>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      <span>{book.category}</span>
                      <span
                        style={{
                          color: "#10b981",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {matchPct > 0 ? (
                          `${matchPct}% match`
                        ) : (
                          <>
                            <Star size={12} fill="currentColor" />
                            {Number(book.rating).toFixed(1)}
                          </>
                        )}
                      </span>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: 8 }}>
                      {book.availableCopies > 0 ? (
                        <button
                          className="btn btn-primary"
                          style={{
                            width: "100%",
                            fontSize: 13,
                            padding: "7px 0",
                          }}
                          onClick={() => openBorrow(book)}
                        >
                          Borrow
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{
                            width: "100%",
                            fontSize: 13,
                            padding: "7px 0",
                          }}
                          disabled
                        >
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Trending This Month ── */}
      {(loading || trending.length > 0) && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <TrendingUp size={18} color="#f59e0b" />
            <h2
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "var(--heading)",
                margin: 0,
              }}
            >
              Trending This Month
            </h2>
          </div>

          <div className="books-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))
              : trending.map((book, i) => (
                  <div
                    key={book.id}
                    className="card"
                    style={{
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <BookCoverArea
                      title={book.title}
                      coverUrl={book.coverUrl}
                      gradient={GRADIENTS[(i + 3) % GRADIENTS.length]}
                    />

                    <div
                      style={{
                        padding: 14,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--heading)",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {book.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {book.author}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontWeight: 600,
                          background: "rgba(245,158,11,0.12)",
                          color: "#f59e0b",
                          alignSelf: "flex-start",
                        }}
                      >
                        {book.borrows} borrows
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        <span>{book.category}</span>
                        <span
                          style={{
                            color: "#f59e0b",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Star size={12} fill="currentColor" />
                          {Number(book.rating).toFixed(1)}
                        </span>
                      </div>
                      <div style={{ marginTop: "auto", paddingTop: 8 }}>
                        {book.availableCopies > 0 ? (
                          <button
                            className="btn btn-primary"
                            style={{
                              width: "100%",
                              fontSize: 13,
                              padding: "7px 0",
                            }}
                            onClick={() => openBorrow(book)}
                          >
                            Borrow
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{
                              width: "100%",
                              fontSize: 13,
                              padding: "7px 0",
                            }}
                            disabled
                          >
                            Not Available
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      <IssueModal
        open={issueOpen}
        onClose={() => {
          setIssueOpen(false);
          setIssueBook(null);
        }}
        onSuccess={() => {
          setIssueOpen(false);
          setIssueBook(null);
        }}
        preselectedBook={issueBook}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
