"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, RotateCcw, Clock, BookOpen } from "lucide-react";
import {
  apiGetActiveBorrows,
  apiGetOverdueBorrows,
  apiGetBorrowHistory,
} from "@/lib/api";
import { BorrowRecord } from "@/lib/mockData";
import { useToast } from "@/contexts/ToastContext";
import { BorrowStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import IssueModal from "@/components/borrow/IssueModal";
import ReturnModal from "@/components/borrow/ReturnModal";
import { useFetch } from "@/lib/useFetch";
import { formatDate, calcFine, getOverdueDays } from "@/lib/utils";

type Tab = "active" | "overdue" | "history";

export default function AdminBorrowPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnBorrow, setReturnBorrow] = useState<BorrowRecord | null>(null);

  const {
    data: active = [],
    loading: la,
    refresh: ra,
  } = useFetch<BorrowRecord[]>(() => apiGetActiveBorrows(), []);
  const {
    data: overdue = [],
    loading: lo,
    refresh: ro,
  } = useFetch<BorrowRecord[]>(() => apiGetOverdueBorrows(), []);
  const {
    data: history = [],
    loading: lh,
    refresh: rh,
  } = useFetch<BorrowRecord[]>(() => apiGetBorrowHistory(), []);

  const refreshAll = () => {
    ra();
    ro();
    rh();
  };

  const data =
    tab === "active" ? active : tab === "overdue" ? overdue : history;
  const loading = tab === "active" ? la : tab === "overdue" ? lo : lh;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        b.memberName.toLowerCase().includes(q) ||
        b.bookTitle.toLowerCase().includes(q) ||
        b.membershipNo.toLowerCase().includes(q),
    );
  }, [data, search]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: active.length },
    { key: "overdue", label: "Overdue", count: overdue.length },
    { key: "history", label: "History", count: history.length },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrow Management</h1>
          <p className="page-subtitle">Issue, return, and track books</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIssueOpen(true)}>
          <Plus size={16} /> Issue Book
        </button>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          {
            label: "Active Borrows",
            value: active.length,
            icon: <BookOpen size={20} />,
            color: "#1D7FEC",
            bg: "rgba(29,127,236,0.1)",
          },
          {
            label: "Overdue",
            value: overdue.length,
            icon: <Clock size={20} />,
            color: "#FF3B30",
            bg: "rgba(255,59,48,0.1)",
          },
          {
            label: "Total Fines Pending",
            value: `Rs.${overdue.reduce((s, b) => s + calcFine(b.dueDate), 0)}`,
            icon: "₹",
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

      {/* Tabs + search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div className="filter-tabs" style={{ margin: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`filter-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => {
                setTab(t.key);
                setSearch("");
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background:
                      tab === t.key ? "var(--primary-light)" : "var(--fill)",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: tab === t.key ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="search-box" style={{ maxWidth: 280, flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search member or book…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <tbody>
                <SkeletonTableRows rows={8} cols={6} />
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} color="var(--muted)" />}
          title={`No ${tab} borrows`}
          description="Try adjusting your search"
          action={
            tab === "active" ? (
              <button
                className="btn btn-primary"
                onClick={() => setIssueOpen(true)}
              >
                <Plus size={16} /> Issue Book
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th className="hide-mobile">Issued</th>
                  <th>Due Date</th>
                  {tab === "history" && <th>Returned</th>}
                  <th>Status</th>
                  {tab !== "history" && <th>Actions</th>}
                  {tab === "overdue" && <th>Fine</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={tab === "overdue" ? "row-overdue" : ""}
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {b.memberAvatarUrl ? (
                          <img
                            src={b.memberAvatarUrl}
                            alt={b.memberName}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: "1px solid var(--border)",
                            }}
                          />
                        ) : (
                          <div
                            className={`avatar avatar-sm avatar-${b.memberAvatarColor || "blue"}`}
                          >
                            {b.memberName[0]}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {b.memberName}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {b.membershipNo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
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
                    {tab === "history" && (
                      <td style={{ fontSize: 13 }}>
                        {b.returnedAt ? formatDate(b.returnedAt) : "—"}
                      </td>
                    )}
                    <td>
                      <BorrowStatusBadge
                        dueDate={b.dueDate}
                        returnedAt={b.returnedAt}
                      />
                    </td>
                    {tab !== "history" && (
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setReturnBorrow(b)}
                          >
                            <RotateCcw size={13} /> Return
                          </button>
                        </div>
                      </td>
                    )}
                    {tab === "overdue" && (
                      <td
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--danger)",
                        }}
                      >
                        Rs.{calcFine(b.dueDate)}
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            fontWeight: 400,
                          }}
                        >
                          {getOverdueDays(b.dueDate)}d overdue
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSuccess={refreshAll}
      />
      <ReturnModal
        open={!!returnBorrow}
        borrow={returnBorrow}
        onClose={() => setReturnBorrow(null)}
        onSuccess={refreshAll}
      />
    </div>
  );
}
