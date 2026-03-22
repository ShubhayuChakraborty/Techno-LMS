"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  UserPlus,
  BookMarked,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Library,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { greetingTime, todayString, formatDate } from "@/lib/utils";
import {
  apiGetReportsSummary,
  apiGetMonthlyBorrows,
  apiGetCategoryStats,
  apiGetRecentBorrows,
  type ReportsSummary,
  type MonthlyBorrowData,
  type CategoryStat,
  type BorrowRecord,
} from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { BorrowStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

const QUICK_ACTIONS = [
  {
    href: "/admin/books/new",
    icon: <Plus size={20} />,
    title: "Add Book",
    desc: "Add new book to catalog",
  },
  {
    href: "/admin/members/new",
    icon: <UserPlus size={20} />,
    title: "Register Member",
    desc: "Add new library member",
  },
  {
    href: "/admin/borrow",
    icon: <BookMarked size={20} />,
    title: "Issue Book",
    desc: "Issue book to member",
  },
  {
    href: "/admin/reports",
    icon: <BarChart3 size={20} />,
    title: "View Reports",
    desc: "Analytics & insights",
  },
];

function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div
          style={{
            height: 32,
            width: 80,
            borderRadius: 6,
            background: "var(--fill)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 36,
            width: 36,
            borderRadius: 8,
            background: "var(--fill)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          height: 14,
          width: 100,
          borderRadius: 4,
          background: "var(--fill)",
          marginTop: 8,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          height: 12,
          width: 120,
          borderRadius: 4,
          background: "var(--fill)",
          marginTop: 6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#2c2c2e" : "#e5e5ea";
  const tickColor = isDark ? "#636366" : "#8E8E93";
  const tooltipBg = isDark ? "#1c1c1e" : "#ffffff";
  const tooltipTextColor = isDark ? "#f5f5f7" : "#1d1d1f";

  const { data: summary, loading: summaryLoading } = useFetch<ReportsSummary>(
    apiGetReportsSummary,
    [],
  );

  const { data: monthlyData = [], loading: monthlyLoading } = useFetch<
    MonthlyBorrowData[]
  >(apiGetMonthlyBorrows, []);

  const { data: categoryData = [], loading: categoryLoading } = useFetch<
    CategoryStat[]
  >(apiGetCategoryStats, []);

  const { data: recentBorrows = [], loading: borrowsLoading } = useFetch<
    BorrowRecord[]
  >(() => apiGetRecentBorrows(5), []);

  const stats = summary
    ? [
        {
          icon: <Library size={20} />,
          label: "Total Books",
          value: summary.totalBooks.toLocaleString(),
          trend: `${summary.activeBorrows} currently borrowed`,
          up: true,
        },
        {
          icon: <Users size={20} />,
          label: "Members",
          value: summary.totalMembers.toLocaleString(),
          trend: `${summary.activeMembers} active`,
          up: true,
        },
        {
          icon: <RotateCcw size={20} />,
          label: "Active Borrows",
          value: summary.activeBorrows.toLocaleString(),
          trend: `${summary.returnsToday} returned today`,
          up: false,
        },
        {
          icon: <AlertTriangle size={20} />,
          label: "Overdue",
          value: summary.overdueBorrows.toLocaleString(),
          trend: `₹${summary.pendingFines.toLocaleString()} pending fines`,
          up: false,
        },
      ]
    : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greetingTime()}, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="page-subtitle">{todayString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {summaryLoading || !stats
          ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-top">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-icon">{s.icon}</div>
                </div>
                <div className="stat-label">{s.label}</div>
                <div
                  className={`stat-trend ${s.up ? "stat-trend-up" : "stat-trend-down"}`}
                >
                  {s.up ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}
                  {s.trend}
                </div>
              </div>
            ))}
      </div>

      {/* Charts */}
      <div className="two-col-60" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Monthly Borrows vs Returns</div>
          {monthlyLoading ? (
            <div
              style={{
                height: 220,
                borderRadius: 8,
                background: "var(--fill)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="borrowsGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#C8102E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="returnsGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#34C759"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "#2c2c2e" : "#e5e5ea"}`,
                      background: tooltipBg,
                      color: tooltipTextColor,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="borrows"
                    stroke="#C8102E"
                    strokeWidth={2}
                    fill="url(#borrowsGrad)"
                    name="Borrows"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="returns"
                    stroke="#34C759"
                    strokeWidth={2}
                    fill="url(#returnsGrad)"
                    name="Returns"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div
                style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12 }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 3,
                      background: "#C8102E",
                      borderRadius: 2,
                      display: "block",
                    }}
                  />{" "}
                  Borrows
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 3,
                      background: "#34C759",
                      borderRadius: 2,
                      display: "block",
                    }}
                  />{" "}
                  Returns
                </span>
              </div>
            </>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">Books by Category</div>
          {categoryLoading ? (
            <div
              style={{
                height: 260,
                borderRadius: 8,
                background: "var(--fill)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={82}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "#2c2c2e" : "#e5e5ea"}`,
                      background: tooltipBg,
                      color: "#ffffff",
                      fontSize: 13,
                    }}
                    formatter={(value, name) => [`${value} books`, name]}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                  marginTop: 12,
                }}
              >
                {categoryData.map((entry) => (
                  <div
                    key={entry.name}
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: entry.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--body)",
                        fontWeight: 600,
                        marginLeft: "auto",
                      }}
                    >
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Quick Actions</div>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="quick-action-btn">
              <div className="quick-action-icon">{a.icon}</div>
              <div>
                <div className="quick-action-title">{a.title}</div>
                <div className="quick-action-desc">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Borrows */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ fontWeight: 600, fontSize: 15, color: "var(--heading)" }}
          >
            Recent Borrows
          </span>
          <Link
            href="/admin/borrow"
            style={{
              fontSize: 13,
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View all →
          </Link>
        </div>
        <div
          className="table-container"
          style={{ borderRadius: 0, border: "none" }}
        >
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th className="hide-mobile">Issued</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowsLoading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : (
                recentBorrows.map((b) => (
                  <tr
                    key={b.id}
                    className={b.status === "overdue" ? "row-overdue" : ""}
                  >
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--heading)",
                          fontSize: 13,
                        }}
                      >
                        {b.memberName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.membershipNo}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "var(--body)",
                          fontSize: 13,
                        }}
                      >
                        {b.bookTitle}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.bookAuthor}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }} className="hide-mobile">
                      {formatDate(b.issuedAt)}
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(b.dueDate)}</td>
                    <td>
                      <BorrowStatusBadge
                        dueDate={b.dueDate}
                        returnedAt={b.returnedAt}
                      />
                    </td>
                    <td>
                      <Link
                        href="/admin/borrow"
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
