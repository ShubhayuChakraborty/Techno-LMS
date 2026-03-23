"use client";

import React, { useEffect, useState } from "react";
import { Download, BarChart3, TrendingUp, BookOpen, Users } from "lucide-react";
import {
  BarChart,
  Bar,
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
  Legend,
} from "recharts";
import {
  apiGetAdminAnalytics,
  type CategoryStat,
  type MonthlyBorrowData,
  type MemberGrowthData,
  type ReportPopularBook,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function AdminReportsPage() {
  const { info, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    booksCirculated: 0,
    activeMembers: 0,
    avgBorrowsPerMonth: 0,
    finesCollected: 0,
    joinedThisMonth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyBorrowData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowthData[]>([]);
  const [popularBooks, setPopularBooks] = useState<ReportPopularBook[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await apiGetAdminAnalytics();
        if (!active) return;

        setKpis(data.analytics);
        setMonthlyData(data.monthlyBorrows);
        setCategoryData(data.categoryStats);
        setMemberGrowth(data.memberGrowth);
        setPopularBooks(data.popularBooks);
      } catch {
        if (!active) return;
        error("Unable to load reports analytics");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [error]);

  const handleExportPdf = async () => {
    if (loading) {
      info("Please wait for analytics to finish loading");
      return;
    }

    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const tableDoc = doc as typeof doc & {
        lastAutoTable?: { finalY: number };
      };
      const generatedAt = new Date().toLocaleString();

      doc.setFontSize(18);
      doc.text("Library Reports & Analytics", 40, 42);
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Generated: ${generatedAt}`, 40, 60);

      autoTable(doc, {
        startY: 76,
        head: [["Metric", "Value"]],
        body: [
          ["Books Circulated", kpis.booksCirculated.toLocaleString()],
          ["Active Members", kpis.activeMembers.toLocaleString()],
          ["Joined This Month", kpis.joinedThisMonth.toLocaleString()],
          [
            "Avg Borrows / Month",
            Math.round(kpis.avgBorrowsPerMonth).toString(),
          ],
          [
            "Fines Collected",
            `Rs.${Math.round(kpis.finesCollected).toLocaleString()}`,
          ],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [200, 16, 46] },
      });

      autoTable(doc, {
        startY: tableDoc.lastAutoTable?.finalY
          ? tableDoc.lastAutoTable.finalY + 16
          : 220,
        head: [["Month", "Borrows", "Returns"]],
        body: monthlyData.map((m) => [
          m.month,
          String(m.borrows),
          String(m.returns),
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [29, 127, 236] },
      });

      autoTable(doc, {
        startY: tableDoc.lastAutoTable?.finalY
          ? tableDoc.lastAutoTable.finalY + 16
          : 380,
        head: [["Category", "Books"]],
        body: categoryData.map((c) => [c.name, String(c.value)]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [52, 199, 89] },
      });

      autoTable(doc, {
        startY: tableDoc.lastAutoTable?.finalY
          ? tableDoc.lastAutoTable.finalY + 16
          : 500,
        head: [["#", "Title", "Author", "Borrows"]],
        body: popularBooks
          .slice(0, 10)
          .map((book, index) => [
            String(index + 1),
            book.title,
            book.author,
            String(book.borrowCount),
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [255, 159, 10] },
      });

      doc.save(`admin-reports-${new Date().toISOString().slice(0, 10)}.pdf`);
      info("PDF exported successfully");
    } catch {
      error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Library performance overview</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={handleExportPdf}
          disabled={exporting}
        >
          <Download size={16} /> {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      {/* KPI row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            icon: <BookOpen size={20} />,
            label: "Books Circulated",
            value: loading ? "…" : kpis.booksCirculated.toLocaleString(),
            sub: "This financial year",
            color: "#1D7FEC",
            bg: "rgba(29,127,236,0.1)",
          },
          {
            icon: <Users size={20} />,
            label: "Active Members",
            value: loading ? "…" : kpis.activeMembers.toLocaleString(),
            sub: loading
              ? ""
              : `${kpis.joinedThisMonth.toLocaleString()} joined this month`,
            color: "#34C759",
            bg: "rgba(52,199,89,0.1)",
          },
          {
            icon: <TrendingUp size={20} />,
            label: "Avg Borrows/Month",
            value: loading
              ? "…"
              : Math.round(kpis.avgBorrowsPerMonth).toString(),
            sub: "Last 12 months",
            color: "#FF9F0A",
            bg: "rgba(255,159,10,0.1)",
          },
          {
            icon: <BarChart3 size={20} />,
            label: "Fines Collected",
            value: loading
              ? "…"
              : `Rs.${Math.round(kpis.finesCollected).toLocaleString()}`,
            sub: "All time",
            color: "#FF3B30",
            bg: "rgba(255,59,48,0.1)",
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
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Monthly + Category */}
      <div className="two-col-60" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">
            Monthly Circulation (Borrows vs Returns)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={monthlyData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#8E8E93" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8E8E93" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="borrows"
                fill="#1D7FEC"
                name="Borrows"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="returns"
                fill="#34C759"
                name="Returns"
                radius={[3, 3, 0, 0]}
              />
              <Legend
                formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-title">Books by Category</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                dataKey="value"
                paddingAngle={3}
              >
                {categoryData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                }}
              />
              <Legend
                formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Member Growth + Popular Books */}
      <div className="two-col-60" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">Member Growth</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={memberGrowth}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34C759" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#8E8E93" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8E8E93" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="members"
                stroke="#34C759"
                strokeWidth={2}
                fill="url(#memGrad)"
                name="Members"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Most Popular Books</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
            }}
          >
            {popularBooks.slice(0, 5).map((b, i) => (
              <div
                key={b.id}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--fill)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--heading)",
                    }}
                  >
                    {b.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {b.author}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <div className="progress-bar">
                      <div
                        className="fill"
                        style={{
                          width: `${(b.borrowCount / (popularBooks[0]?.borrowCount || 1)) * 100}%`,
                          background: "#1D7FEC",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  {b.borrowCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
