"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  AlertCircle,
  IndianRupee,
  Sparkles,
  Clock,
  ChevronRight,
  Award,
  ArrowRight,
  BookMarked,
  BarChart3,
  Compass,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { greetingTime, todayString, daysFromNow } from "@/lib/utils";
import { useFetch } from "@/lib/useFetch";
import {
  apiGetMemberBorrows,
  apiGetMyFines,
  apiGetAllRecommendations,
} from "@/lib/api";

/* ── BookCover ───────────────────────────────────────────── */
const COVER_PALETTES = [
  ["#c8102e", "#9b0e24"],
  ["#2563eb", "#1d4ed8"],
  ["#7c3aed", "#6d28d9"],
  ["#059669", "#047857"],
  ["#d97706", "#b45309"],
  ["#db2777", "#9d174d"],
  ["#0891b2", "#0e7490"],
  ["#4f46e5", "#4338ca"],
];

function coverPalette(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return COVER_PALETTES[h % COVER_PALETTES.length];
}

function BookCover({
  title,
  coverUrl,
  size = 40,
}: {
  title: string;
  coverUrl?: string;
  size?: number;
}) {
  const [a, b] = coverPalette(title);
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size * 1.45,
        borderRadius: 6,
        background: `linear-gradient(150deg, ${a}, ${b})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: size * 0.28,
        fontWeight: 700,
        color: "rgba(255,255,255,0.92)",
        letterSpacing: 0.5,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 6,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

/* ── StatusPill ──────────────────────────────────────────── */
function StatusPill({ days }: { days: number }) {
  const isOverdue = days < 0;
  const isSoon = !isOverdue && days <= 3;
  const color = isOverdue
    ? "var(--danger)"
    : isSoon
      ? "var(--warning)"
      : "var(--success)";
  const bg = isOverdue
    ? "var(--danger-light)"
    : isSoon
      ? "var(--warning-light)"
      : "var(--success-light)";
  const label = isOverdue
    ? `${Math.abs(days)}d overdue`
    : days === 0
      ? "Due today"
      : `${days}d remaining`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 5,
      }}
    >
      <Clock size={10} />
      {label}
    </span>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function MemberDashboard() {
  const { user } = useAuth();
  const memberId = user?.member?.id ?? "";

  const { data: allBorrows = [], loading: lb } = useFetch(
    () => (memberId ? apiGetMemberBorrows(memberId) : Promise.resolve([])),
    [memberId],
  );
  const { data: fines = [] } = useFetch(
    () => (memberId ? apiGetMyFines(memberId) : Promise.resolve([])),
    [memberId],
  );
  const { data: recsResult, loading: lr } = useFetch(
    () =>
      memberId
        ? apiGetAllRecommendations({ memberId, limit: 4 })
        : Promise.resolve({ recommendations: [], total: 0, totalPages: 0 }),
    [memberId],
  );
  const recs = recsResult?.recommendations ?? [];

  const active = useMemo(
    () => allBorrows.filter((b) => !b.returnedAt),
    [allBorrows],
  );
  const overdue = useMemo(
    () => active.filter((b) => new Date(b.dueDate) < new Date()),
    [active],
  );
  const pendingFines = useMemo(() => fines.filter((f) => !f.isPaid), [fines]);
  const pendingAmount = useMemo(
    () => pendingFines.reduce((s, f) => s + f.amount, 0),
    [pendingFines],
  );
  const booksRead = useMemo(
    () => allBorrows.filter((b) => b.returnedAt).length,
    [allBorrows],
  );
  const maxBorrows = user?.member?.membershipType === "premium" ? 5 : 3;
  const borrowPct = Math.min(1, active.length / maxBorrows);
  const firstName = user?.name?.split(" ")[0] || "Reader";

  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 48 }}>
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          borderLeft: "4px solid var(--primary)",
          padding: "24px 28px",
          marginBottom: 20,
          boxShadow: "var(--shadow-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Left: greeting */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: "var(--primary-light)",
                color: "var(--primary)",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                border: "1px solid rgba(200,16,46,0.12)",
              }}
            >
              {user?.member?.membershipType ?? "Member"}
            </span>
            {overdue.length > 0 && (
              <span
                style={{
                  background: "var(--danger-light)",
                  color: "var(--danger)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid rgba(255,59,48,0.15)",
                }}
              >
                <AlertCircle size={10} />
                {overdue.length} Overdue
              </span>
            )}
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--heading)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {greetingTime()}, {firstName}
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              margin: "4px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Calendar size={12} />
            {todayString()}
          </p>
        </div>

        {/* Right: summary + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 14,
          }}
        >
          <Link
            href="/member/browse"
            style={{
              background: "var(--primary)",
              color: "white",
              fontWeight: 600,
              fontSize: 13,
              padding: "9px 20px",
              borderRadius: 10,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <BookOpen size={15} />
            Browse Catalog
          </Link>
          <div style={{ display: "flex", gap: 28 }}>
            {[
              { label: "Active", val: active.length, color: "var(--heading)" },
              {
                label: "Overdue",
                val: overdue.length,
                color: overdue.length > 0 ? "var(--danger)" : "var(--heading)",
              },
              {
                label: "Fines",
                val: `₹${pendingAmount}`,
                color: pendingAmount > 0 ? "var(--warning)" : "var(--heading)",
              },
              { label: "Read", val: booksRead, color: "var(--heading)" },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: m.color,
                  }}
                >
                  {m.val}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KpiCard
          icon={<BookMarked size={17} />}
          iconColor="var(--primary)"
          iconBg="var(--primary-light)"
          label="Active Borrows"
          value={active.length}
        >
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              <span>Borrow limit</span>
              <span style={{ fontWeight: 600, color: "var(--body)" }}>
                {active.length} / {maxBorrows}
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: "var(--fill)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${borrowPct * 100}%`,
                  background:
                    borrowPct >= 1
                      ? "var(--danger)"
                      : borrowPct >= 0.6
                        ? "var(--warning)"
                        : "var(--primary)",
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        </KpiCard>

        <KpiCard
          icon={<AlertCircle size={17} />}
          iconColor={overdue.length > 0 ? "var(--danger)" : "var(--muted)"}
          iconBg={overdue.length > 0 ? "var(--danger-light)" : "var(--fill)"}
          label="Overdue"
          value={overdue.length}
          valueColor={overdue.length > 0 ? "var(--danger)" : undefined}
        >
          <p
            style={{
              fontSize: 12,
              color: overdue.length > 0 ? "var(--danger)" : "var(--success)",
              margin: "14px 0 0",
              fontWeight: 500,
            }}
          >
            {overdue.length > 0
              ? `${overdue.length} past due date`
              : "All returns on time"}
          </p>
        </KpiCard>

        <KpiCard
          icon={<IndianRupee size={17} />}
          iconColor={pendingAmount > 0 ? "var(--warning)" : "var(--muted)"}
          iconBg={pendingAmount > 0 ? "var(--warning-light)" : "var(--fill)"}
          label="Pending Fines"
          value={`₹${pendingAmount}`}
          valueColor={pendingAmount > 0 ? "var(--warning)" : undefined}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              margin: "14px 0 0",
            }}
          >
            {pendingFines.length > 0
              ? `${pendingFines.length} unpaid fine${pendingFines.length > 1 ? "s" : ""}`
              : "No outstanding dues"}
          </p>
        </KpiCard>

        <KpiCard
          icon={<Award size={17} />}
          iconColor="var(--success)"
          iconBg="var(--success-light)"
          label="Books Read"
          value={booksRead}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "var(--success)",
              marginTop: 14,
            }}
          >
            <BarChart3 size={12} />
            <span>
              {booksRead > 0 ? "Books completed" : "Start reading today"}
            </span>
          </div>
        </KpiCard>
      </div>

      {/* ── QUICK NAVIGATION ────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            href: "/member/browse",
            icon: <BookOpen size={16} />,
            title: "Browse Catalog",
            desc: "Find & discover books",
            color: "var(--primary)",
            iconBg: "var(--primary-light)",
          },
          {
            href: "/member/borrows",
            icon: <BookMarked size={16} />,
            title: "My Borrows",
            desc: `${active.length} active`,
            color: "#2563eb",
            iconBg: "rgba(37,99,235,0.08)",
          },
          {
            href: "/member/fines",
            icon: <IndianRupee size={16} />,
            title: "My Fines",
            desc: pendingAmount > 0 ? `₹${pendingAmount} due` : "No dues",
            color: pendingAmount > 0 ? "var(--warning)" : "var(--success)",
            iconBg:
              pendingAmount > 0
                ? "var(--warning-light)"
                : "var(--success-light)",
          },
          {
            href: "/member/recommendations",
            icon: <Sparkles size={16} />,
            title: "For You",
            desc: "AI recommendations",
            color: "#7c3aed",
            iconBg: "rgba(124,58,237,0.08)",
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: a.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: a.color,
                flexShrink: 0,
              }}
            >
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--heading)",
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.desc}
              </div>
            </div>
            <ChevronRight
              size={14}
              style={{ color: "var(--muted)", flexShrink: 0 }}
            />
          </Link>
        ))}
      </div>

      {/* ── BORROWS + RECOMMENDATIONS ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Active Borrows Panel */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookMarked size={15} style={{ color: "var(--primary)" }} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--heading)",
                }}
              >
                Active Borrows
              </span>
              {active.length > 0 && (
                <span
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 8,
                    lineHeight: 1.6,
                  }}
                >
                  {active.length}
                </span>
              )}
            </div>
            <Link
              href="/member/borrows"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: "var(--primary)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {lb ? (
            <SkeletonList count={3} />
          ) : active.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              message="No active borrows"
              action={
                <Link href="/member/browse" className="btn btn-primary btn-sm">
                  Browse Catalog
                </Link>
              }
            />
          ) : (
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {active.map((b) => {
                const days = daysFromNow(b.dueDate);
                const isOverdue = days < 0;
                const isDueSoon = !isOverdue && days <= 3;
                return (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "11px 12px",
                      borderRadius: 10,
                      borderLeft: `3px solid ${
                        isOverdue
                          ? "var(--danger)"
                          : isDueSoon
                            ? "var(--warning)"
                            : "transparent"
                      }`,
                      background: isOverdue
                        ? "var(--danger-light)"
                        : isDueSoon
                          ? "var(--warning-light)"
                          : "transparent",
                    }}
                  >
                    <BookCover
                      title={b.bookTitle}
                      coverUrl={b.bookCoverUrl}
                      size={38}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--heading)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 2,
                        }}
                      >
                        {b.bookTitle}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginBottom: 6,
                        }}
                      >
                        {b.bookAuthor}
                      </div>
                      <StatusPill days={days} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommendations Panel */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} style={{ color: "#7c3aed" }} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--heading)",
                }}
              >
                Recommended for You
              </span>
            </div>
            <Link
              href="/member/recommendations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: "#7c3aed",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>

          {lr ? (
            <SkeletonList count={3} />
          ) : recs.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={22} />}
              message="No recommendations yet"
            />
          ) : (
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {recs.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 12px",
                    borderRadius: 10,
                  }}
                >
                  <BookCover
                    title={r.book.title}
                    coverUrl={r.book.coverUrl}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--heading)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 2,
                      }}
                    >
                      {r.book.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: r.reason ? 5 : 0,
                      }}
                    >
                      {r.book.author}
                    </div>
                    {r.reason && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 4,
                          fontSize: 11,
                          color: "#7c3aed",
                          lineHeight: 1.45,
                        }}
                      >
                        <Sparkles
                          size={10}
                          style={{ flexShrink: 0, marginTop: 1 }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {r.reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Link
                href="/member/browse"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  margin: "6px 0 2px",
                  padding: "10px",
                  borderRadius: 8,
                  border: "1px dashed var(--border)",
                  color: "var(--muted)",
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <Compass size={13} />
                Explore full catalog
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── KpiCard ──────────────────────────────────────────────── */
function KpiCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  valueColor,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "20px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: valueColor ?? "var(--heading)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {children}
    </div>
  );
}

/* ── SkeletonList ─────────────────────────────────────────── */
function SkeletonList({ count }: { count: number }) {
  return (
    <div style={{ padding: "12px 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            className="skeleton"
            style={{ width: 38, height: 55, borderRadius: 6, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="skeleton"
              style={{
                height: 12,
                borderRadius: 4,
                marginBottom: 7,
                width: "65%",
              }}
            />
            <div
              className="skeleton"
              style={{ height: 10, borderRadius: 4, width: "42%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── EmptyState ───────────────────────────────────────────── */
function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "var(--fill)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          color: "var(--muted)",
        }}
      >
        {icon}
      </div>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 13,
          fontWeight: 500,
          margin: "0 0 14px",
        }}
      >
        {message}
      </p>
      {action}
    </div>
  );
}
