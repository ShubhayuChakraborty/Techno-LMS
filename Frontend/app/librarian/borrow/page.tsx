"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, RotateCcw, BookOpen } from "lucide-react";
import {
  apiGetActiveBorrows,
  apiGetOverdueBorrows,
  apiGetBorrowHistory,
  apiGetBorrowRequests,
  apiApproveBorrowRequest,
  apiDeclineBorrowRequest,
  type BorrowRequestItem,
} from "@/lib/api";
import { BorrowRecord } from "@/lib/mockData";
import { BorrowStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import IssueModal from "@/components/borrow/IssueModal";
import ReturnModal from "@/components/borrow/ReturnModal";
import { useFetch } from "@/lib/useFetch";
import { formatDate, calcFine } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";

type Tab = "requests" | "active" | "overdue" | "history";

export default function LibrarianBorrowPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnBorrow, setReturnBorrow] = useState<BorrowRecord | null>(null);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);

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
  const {
    data: requestData,
    loading: lr,
    refresh: rr,
  } = useFetch<{ items: BorrowRequestItem[]; total: number }>(
    () => apiGetBorrowRequests({ status: "pending", limit: 200 }),
    [],
  );

  const requests = requestData?.items ?? [];

  const refreshAll = () => {
    rr();
    ra();
    ro();
    rh();
  };
  const data =
    tab === "active"
      ? active
      : tab === "overdue"
        ? overdue
        : tab === "history"
          ? history
          : [];
  const loading =
    tab === "active"
      ? la
      : tab === "overdue"
        ? lo
        : tab === "history"
          ? lh
          : lr;

  const filtered = useMemo(() => {
    if (tab === "requests") {
      if (!search) return requests;
      const q = search.toLowerCase();
      return requests.filter(
        (r) =>
          r.member.name.toLowerCase().includes(q) ||
          (r.member.membershipNo ?? "").toLowerCase().includes(q) ||
          r.book.title.toLowerCase().includes(q),
      );
    }

    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        b.memberName.toLowerCase().includes(q) ||
        b.bookTitle.toLowerCase().includes(q) ||
        b.membershipNo.toLowerCase().includes(q),
    );
  }, [tab, requests, data, search]);

  const handleApprove = async (requestId: string) => {
    setActingRequestId(requestId);
    try {
      await apiApproveBorrowRequest(requestId, 14);
      success("Borrow request approved");
      refreshAll();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed to approve request");
    } finally {
      setActingRequestId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActingRequestId(requestId);
    try {
      await apiDeclineBorrowRequest(requestId);
      success("Borrow request declined");
      refreshAll();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed to decline request");
    } finally {
      setActingRequestId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrow & Return</h1>
          <p className="page-subtitle">
            Issue books to members and process returns
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIssueOpen(true)}>
          <Plus size={16} /> Issue Book
        </button>
      </div>

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
          {(
            [
              ["requests", requests.length],
              ["active", active.length],
              ["overdue", overdue.length],
              ["history", history.length],
            ] as [Tab, number][]
          ).map(([t, count]) => (
            <button
              key={t}
              className={`filter-tab ${tab === t ? "active" : ""}`}
              onClick={() => {
                setTab(t);
                setSearch("");
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 5,
                    background:
                      tab === t ? "var(--primary-light)" : "var(--fill)",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: tab === t ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="search-box" style={{ maxWidth: 280, flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search member ID, name, or book…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <tbody>
                <SkeletonTableRows rows={8} cols={5} />
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} color="var(--muted)" />}
          title={`No ${tab} borrows`}
          description="Try adjusting search"
          action={
            tab === "active" ? (
              <button
                className="btn btn-primary"
                onClick={() => setIssueOpen(true)}
              >
                Issue Book
              </button>
            ) : undefined
          }
        />
      ) : tab === "requests" ? (
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
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(filtered as BorrowRequestItem[]).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {r.member.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {r.member.membershipNo ?? "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {r.book.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {r.book.author}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {formatDate(r.requestedAt)}
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actingRequestId === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={actingRequestId === r.id}
                          onClick={() => handleDecline(r.id)}
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                  {tab === "overdue" && <th>Fine</th>}
                  {tab !== "history" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {(filtered as BorrowRecord[]).map((b) => (
                  <tr
                    key={b.id}
                    className={tab === "overdue" ? "row-overdue" : ""}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {b.memberName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.membershipNo}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.bookTitle}</td>
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
                    {tab === "overdue" && (
                      <td
                        style={{
                          fontWeight: 700,
                          color: "var(--danger)",
                          fontSize: 13,
                        }}
                      >
                        Rs.{calcFine(b.dueDate)}
                      </td>
                    )}
                    {tab !== "history" && (
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setReturnBorrow(b)}
                        >
                          <RotateCcw size={13} /> Return
                        </button>
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
