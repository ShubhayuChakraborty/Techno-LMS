"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  RotateCcw,
  BookMarked,
  AlertTriangle,
  BookOpen,
  Users,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { greetingTime, todayString, formatDate } from "@/lib/utils";
import {
  apiGetReportsSummary,
  apiGetMonthlyBorrows,
  apiGetRecentBorrows,
  apiReturnBook,
  type ReportsSummary,
  type MonthlyBorrowData,
} from "@/lib/api";
import { BorrowStatusBadge } from "@/components/ui/Badge";
import IssueModal from "@/components/borrow/IssueModal";
import ReturnModal from "@/components/borrow/ReturnModal";
import { BorrowRecord } from "@/lib/mockData";

export default function LibrarianDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartColor = "#C8102E";
  const gridColor = isDark ? "#2c2c2e" : "#e5e5ea";
  const tickColor = isDark ? "#636366" : "#8E8E93";
  const tooltipBg = isDark ? "#1c1c1e" : "#ffffff";

  const [issueOpen, setIssueOpen] = useState(false);
  const [returnBorrow, setReturnBorrow] = useState<BorrowRecord | null>(null);

  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyBorrowData[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, monthly, recent] = await Promise.all([
        apiGetReportsSummary(),
        apiGetMonthlyBorrows(),
        apiGetRecentBorrows(5),
      ]);
      setSummary(summaryData);
      setMonthlyData(monthly);
      setRecentBorrows(recent);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greetingTime()}, {user?.name?.split(" ")[0] || "Librarian"}
          </h1>
          <p className="page-subtitle">{todayString()}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => setIssueOpen(true)}
          >
            <Plus size={16} /> Issue Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          {
            icon: <BookOpen size={20} />,
            label: "Active Borrows",
            value: loading ? "—" : (summary?.activeBorrows ?? 0),
          },
          {
            icon: <AlertTriangle size={20} />,
            label: "Overdue Books",
            value: loading ? "—" : (summary?.overdueBorrows ?? 0),
          },
          {
            icon: <IndianRupee size={20} />,
            label: "Pending Fines",
            value: loading ? "—" : `₹${summary?.pendingFines ?? 0}`,
          },
          {
            icon: <RefreshCw size={20} />,
            label: "Returns Today",
            value: loading ? "—" : (summary?.returnsToday ?? 0),
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top">
              <div className="stat-value">{s.value}</div>
              <div className="stat-icon">{s.icon}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">Borrow Activity (Last 12 Months)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={monthlyData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="libBorrowsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
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
                color: isDark ? "#f5f5f7" : "#1d1d1f",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="borrows"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#libBorrowsGrad)"
              name="Borrows"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Quick Actions</div>
        <div className="quick-actions-grid">
          {[
            {
              href: "/librarian/books/new",
              icon: <Plus size={20} />,
              title: "Add Book",
              desc: "Add new book to catalog",
            },
            {
              href: "/librarian/borrow",
              icon: <BookMarked size={20} />,
              title: "Borrow Desk",
              desc: "Issue and return books",
            },
            {
              href: "/librarian/members",
              icon: <Users size={20} />,
              title: "Members",
              desc: "View member profiles",
            },
            {
              href: "/librarian/fines",
              icon: <IndianRupee size={20} />,
              title: "Collect Fine",
              desc: "Mark fines as paid",
            },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="quick-action-btn">
              <div className="quick-action-icon">
                {typeof a.icon === "string" ? (
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                ) : (
                  a.icon
                )}
              </div>
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>Recent Borrows</span>
          <Link
            href="/librarian/borrow"
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
          style={{ border: "none", borderRadius: 0 }}
        >
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: 24, opacity: 0.5 }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : recentBorrows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: 24, opacity: 0.5 }}
                  >
                    No borrows found.
                  </td>
                </tr>
              ) : (
                recentBorrows.map((b) => (
                  <tr
                    key={b.id}
                    className={b.status === "overdue" ? "row-overdue" : ""}
                  >
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      {b.memberName}
                    </td>
                    <td style={{ fontSize: 13 }}>{b.bookTitle}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(b.dueDate)}</td>
                    <td>
                      <BorrowStatusBadge
                        dueDate={b.dueDate}
                        returnedAt={b.returnedAt}
                      />
                    </td>
                    <td>
                      {!b.returnedAt && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setReturnBorrow(b)}
                        >
                          <RotateCcw size={13} /> Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSuccess={fetchDashboard}
      />
      <ReturnModal
        open={!!returnBorrow}
        borrow={returnBorrow}
        onClose={() => setReturnBorrow(null)}
        onSuccess={fetchDashboard}
      />
    </div>
  );
}
