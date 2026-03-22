"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  TrendingUp,
  Star,
  RefreshCw,
  Zap,
  Users,
  Brain,
  ChevronDown,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  apiGetAIStats,
  apiGetAllRecommendations,
  apiGenerateAIForMember,
  apiGenerateAIForAll,
  type AIRecsStats,
  type AIRecommendation,
} from "@/lib/api";
import { apiGetMembers } from "@/lib/api";
import { getBookCoverClass } from "@/lib/utils";
import { StarRating } from "@/components/ui/Badge";
import type { Member } from "@/lib/mockData";

const STRATEGY_LABELS: Record<string, string> = {
  collaborative_filtering: "Collaborative",
  content_based: "Content Match",
  trending: "Trending",
  genre_match: "Genre Match",
  highly_rated: "Highly Rated",
};

const STRATEGY_COLORS: Record<string, string> = {
  collaborative_filtering: "#1D7FEC",
  content_based: "#34C759",
  trending: "#FF9F0A",
  genre_match: "#AF52DE",
  highly_rated: "#FF3B30",
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/api\/v1\/?$/, "");

function normalizeCoverUrl(coverUrl?: string | null): string | null {
  if (!coverUrl) return null;
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  const normalizedPath = coverUrl.startsWith("/") ? coverUrl : `/${coverUrl}`;
  return `${API_ORIGIN}${normalizedPath}`;
}

function RecommendationBookCover({
  bookId,
  title,
  coverUrl,
}: {
  bookId: string;
  title: string;
  coverUrl?: string | null;
}) {
  const [errored, setErrored] = useState(false);
  const src = normalizeCoverUrl(coverUrl);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={title}
        onError={() => setErrored(true)}
        style={{
          width: 52,
          height: 70,
          borderRadius: 8,
          flexShrink: 0,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      className={getBookCoverClass(bookId)}
      style={{
        width: 52,
        height: 70,
        borderRadius: 8,
        flexShrink: 0,
      }}
    />
  );
}

export default function AdminRecommendationsPage() {
  const [stats, setStats] = useState<AIRecsStats | null>(null);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [generatingMember, setGeneratingMember] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [recPage, setRecPage] = useState(1);
  const [totalRecPages, setTotalRecPages] = useState(1);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const data = await apiGetAIStats();
    setStats(data);
    setLoadingStats(false);
  }, []);

  const loadRecs = useCallback(async (memberId?: string, page = 1) => {
    setLoadingRecs(true);
    const data = await apiGetAllRecommendations({ memberId, page, limit: 8 });
    setRecs(data.recommendations || []);
    setTotalRecPages(data.totalPages || 1);
    setRecPage(page);
    setLoadingRecs(false);
  }, []);

  const loadMembers = useCallback(async (search = "") => {
    const data = await apiGetMembers({ search, status: "active" });
    setMembers(data.members || []);
  }, []);

  useEffect(() => {
    loadStats();
    loadRecs();
    loadMembers();
  }, [loadStats, loadRecs, loadMembers]);

  useEffect(() => {
    const t = setTimeout(() => loadMembers(memberSearch), 300);
    return () => clearTimeout(t);
  }, [memberSearch, loadMembers]);

  const handleGenerateForMember = async () => {
    if (!selectedMember) return;
    setGeneratingMember(true);
    try {
      const result = await apiGenerateAIForMember(selectedMember.id, 5);
      showToast(
        "success",
        `Generated ${result.recommendations.length} AI recommendations for ${result.member.name}!`,
      );
      loadRecs(selectedMember.id);
      loadStats();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to generate recommendations.";
      showToast("error", msg);
    } finally {
      setGeneratingMember(false);
    }
  };

  const handleGenerateForAll = async () => {
    setGeneratingAll(true);
    try {
      const result = await apiGenerateAIForAll(3);
      showToast(
        "success",
        `Generated ${result.total} AI recommendations across ${result.results.length} members!`,
      );
      loadRecs();
      loadStats();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bulk generation failed.";
      showToast("error", msg);
    } finally {
      setGeneratingAll(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.membershipNo?.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "success" ? "#34C759" : "#FF3B30",
            color: "white",
            borderRadius: 12,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 380,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">AI Recommendations</h1>
          <p className="page-subtitle">
            Personalized book suggestions powered by Gemini AI
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerateForAll}
          disabled={generatingAll}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {generatingAll ? (
            <RefreshCw
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Zap size={16} />
          )}
          {generatingAll ? "Generating…" : "Generate for All Members"}
        </button>
      </div>

      {/* AI Engine Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "20px 24px",
          background: "linear-gradient(135deg, #1D7FEC 0%, #0058c5 100%)",
          color: "white",
          border: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Brain size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Gemini AI Recommendation Engine Active
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
              {loadingStats
                ? "Loading statistics…"
                : stats
                  ? `Serving ${stats.membersWithRecommendations} members · ${stats.totalRecommendations} total recommendations generated`
                  : "Powered by Google Gemini 1.5 Flash"}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 24,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>
                {stats ? `${Math.round(stats.averageScore * 100)}%` : "—"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Avg Match Score</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>
                {stats ? stats.membersWithRecommendations : "—"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Members Served</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            icon: <Sparkles size={20} />,
            label: "Recommendations Generated",
            value: stats ? String(stats.totalRecommendations) : "—",
            color: "#1D7FEC",
            bg: "rgba(29,127,236,0.1)",
          },
          {
            icon: <Users size={20} />,
            label: "Members Receiving Recs",
            value: stats ? String(stats.membersWithRecommendations) : "—",
            color: "#34C759",
            bg: "rgba(52,199,89,0.1)",
          },
          {
            icon: <Star size={20} />,
            label: "Avg Match Score",
            value: stats ? `${Math.round(stats.averageScore * 100)}%` : "—",
            color: "#FF9F0A",
            bg: "rgba(255,159,10,0.1)",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="stat-icon"
              style={{ background: s.bg, color: s.color }}
            >
              {s.icon}
            </div>
            <div
              className="stat-value"
              style={{ color: s.color, fontSize: 22 }}
            >
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gemini Trending Insight */}
      {stats?.trendingInsight && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            border: "1.5px solid rgba(29,127,236,0.25)",
            background: "rgba(29,127,236,0.05)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #1D7FEC, #AF52DE)",
                borderRadius: 8,
                padding: 8,
                flexShrink: 0,
              }}
            >
              <Brain size={18} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                Gemini Trending Analysis
              </div>
              <div
                style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.6 }}
              >
                {stats.trendingInsight}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Books */}
      {stats && stats.trendingBooks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">
            <TrendingUp
              size={14}
              style={{ display: "inline", marginRight: 6 }}
            />
            Trending Books This Month
          </div>
          <div className="books-grid">
            {stats.trendingBooks.map((book) => (
              <div
                key={book.id}
                className="card"
                style={{ overflow: "hidden" }}
              >
                <div
                  className={getBookCoverClass(book.id)}
                  style={{
                    height: 120,
                    margin: "12px 12px 0",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "white",
                      textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    }}
                  >
                    {book.title}
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {book.author}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {book.category}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <StarRating rating={parseFloat(String(book.rating)) || 4} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      {book.borrows} borrows
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate for Specific Member */}
      <div className="card" style={{ marginBottom: 24, padding: "20px 24px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={16} color="var(--primary)" />
          Generate AI Recommendations for a Member
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Member Selector */}
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              Select Member
            </div>
            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                background: "var(--card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 14,
              }}
              onClick={() => setShowMemberDropdown((v) => !v)}
            >
              <span
                style={{
                  color: selectedMember ? "var(--body)" : "var(--muted)",
                }}
              >
                {selectedMember
                  ? `${selectedMember.name} (${selectedMember.membershipNo})`
                  : "Select a member…"}
              </span>
              <ChevronDown size={16} color="var(--muted)" />
            </div>
            {showMemberDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  marginTop: 4,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  maxHeight: 280,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Search size={14} color="var(--muted)" />
                    <input
                      autoFocus
                      placeholder="Search members…"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: 13,
                        color: "var(--body)",
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 220 }}>
                  {filteredMembers.length === 0 ? (
                    <div
                      style={{
                        padding: "12px 16px",
                        color: "var(--muted)",
                        fontSize: 13,
                      }}
                    >
                      No members found
                    </div>
                  ) : (
                    filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMember(m);
                          setShowMemberDropdown(false);
                          loadRecs(m.id);
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: 13,
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                          background:
                            selectedMember?.id === m.id
                              ? "rgba(29,127,236,0.08)"
                              : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <div
                          style={{ fontWeight: 600, color: "var(--heading)" }}
                        >
                          {m.name}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 11 }}>
                          {m.membershipNo} · {m.totalBorrows} borrows
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerateForMember}
            disabled={!selectedMember || generatingMember}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 42,
            }}
          >
            {generatingMember ? (
              <RefreshCw
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Brain size={16} />
            )}
            {generatingMember ? "Generating…" : "Generate with Gemini AI"}
          </button>

          {selectedMember && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedMember(null);
                loadRecs();
              }}
              style={{ height: 42 }}
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Feed */}
      <div>
        <div className="section-label" style={{ marginBottom: 12 }}>
          {selectedMember
            ? `AI Recommendations for ${selectedMember.name}`
            : "All Recommendation Feed"}
        </div>

        {loadingRecs ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            <RefreshCw
              size={20}
              style={{
                animation: "spin 1s linear infinite",
                marginBottom: 8,
                display: "block",
                margin: "0 auto 8px",
              }}
            />
            Loading recommendations…
          </div>
        ) : recs.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <Brain size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              No recommendations yet
            </div>
            <div style={{ fontSize: 13 }}>
              {selectedMember
                ? `Click "Generate with Gemini AI" to create personalized recommendations for ${selectedMember.name}.`
                : `Click "Generate for All Members" to run the AI engine across all members.`}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recs.map((rec) => {
                const strategyColor =
                  STRATEGY_COLORS[rec.strategy] || "#1D7FEC";
                const strategyLabel =
                  STRATEGY_LABELS[rec.strategy] || rec.strategy;
                return (
                  <div
                    key={rec.id}
                    className="card"
                    style={{ padding: "16px 20px" }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <RecommendationBookCover
                        bookId={rec.book.id}
                        title={rec.book.title}
                        coverUrl={rec.book.coverUrl}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--heading)",
                          }}
                        >
                          {rec.book.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {rec.book.author}
                        </div>
                        {rec.reason && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "var(--body)",
                              fontStyle: "italic",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 5,
                            }}
                          >
                            <Brain
                              size={12}
                              style={{
                                marginTop: 2,
                                flexShrink: 0,
                                color: strategyColor,
                              }}
                            />
                            {rec.reason}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              background: `${strategyColor}18`,
                              color: strategyColor,
                              borderRadius: 20,
                              padding: "2px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <Sparkles
                              size={10}
                              style={{ display: "inline", marginRight: 4 }}
                            />
                            {strategyLabel}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#34C759",
                              background: "rgba(52,199,89,0.1)",
                              borderRadius: 20,
                              padding: "2px 10px",
                            }}
                          >
                            {Math.round(Number(rec.score) * 100)}% match
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {rec.book.category}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          For
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--heading)",
                          }}
                        >
                          {rec.member.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {rec.member.membershipNo}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <StarRating
                            rating={parseFloat(String(rec.book.rating)) || 4}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalRecPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                {Array.from({ length: totalRecPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => loadRecs(selectedMember?.id, p)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1.5px solid var(--border)",
                        background:
                          p === recPage ? "var(--primary)" : "var(--card)",
                        color: p === recPage ? "white" : "var(--body)",
                        fontWeight: p === recPage ? 700 : 400,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
