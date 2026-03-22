"use client";

import React, { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { BorrowRecord } from "@/lib/mockData";
import { BorrowStatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ReturnModal from "@/components/borrow/ReturnModal";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { formatDate, daysFromNow } from "@/lib/utils";
import { apiGetMemberBorrows } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function MemberBorrowsPage() {
  const { user } = useAuth();
  const memberId = user?.member?.id ?? "";
  const [returnBorrow, setReturnBorrow] = useState<BorrowRecord | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const {
    data: allBorrows = [],
    loading,
    refresh,
  } = useFetch<BorrowRecord[]>(
    () => (memberId ? apiGetMemberBorrows(memberId) : Promise.resolve([])),
    [memberId],
  );

  const active = useMemo(
    () => allBorrows.filter((b) => b.status !== "returned"),
    [allBorrows],
  );
  const history = useMemo(
    () => allBorrows.filter((b) => b.status === "returned"),
    [allBorrows],
  );
  const data = tab === "active" ? active : history;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Borrows</h1>
          <p className="page-subtitle">
            {active.length} active · {history.length} returned
          </p>
        </div>
        <Link href="/member/browse" className="btn btn-primary">
          Browse Books
        </Link>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Active ({active.length})
        </button>
        <button
          className={`filter-tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          History ({history.length})
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <tbody>
                <SkeletonTableRows rows={4} cols={3} />
              </tbody>
            </table>
          </div>
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} color="var(--muted)" />}
          title={tab === "active" ? "No active borrows" : "No returned books"}
          description={
            tab === "active"
              ? "Visit the catalog to borrow books"
              : "Books you return will appear here"
          }
          action={
            tab === "active" ? (
              <Link href="/member/browse" className="btn btn-primary">
                Browse Books
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((b) => {
            const days = daysFromNow(b.dueDate);
            const isOverdue =
              b.status === "overdue" || (!b.returnedAt && days < 0);
            return (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: "16px 20px",
                  border: isOverdue
                    ? "1.5px solid rgba(255,59,48,0.2)"
                    : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--heading)",
                      }}
                    >
                      {b.bookTitle}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      by {b.bookAuthor}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 20,
                        marginTop: 10,
                        flexWrap: "wrap",
                        fontSize: 13,
                        color: "var(--muted)",
                      }}
                    >
                      <span>
                        Issued:{" "}
                        <strong style={{ color: "var(--body)" }}>
                          {formatDate(b.issuedAt)}
                        </strong>
                      </span>
                      <span>
                        Due:{" "}
                        <strong
                          style={{
                            color: isOverdue ? "var(--danger)" : "var(--body)",
                          }}
                        >
                          {formatDate(b.dueDate)}
                        </strong>
                      </span>
                      {b.returnedAt && (
                        <span>
                          Returned:{" "}
                          <strong style={{ color: "var(--success)" }}>
                            {formatDate(b.returnedAt)}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    <BorrowStatusBadge
                      dueDate={b.dueDate}
                      returnedAt={b.returnedAt}
                    />
                    {!b.returnedAt && (
                      <div
                        style={{
                          fontSize: 12,
                          color: isOverdue
                            ? "var(--danger)"
                            : days <= 3
                              ? "var(--warning)"
                              : "var(--muted)",
                          fontWeight: 500,
                        }}
                      >
                        {isOverdue
                          ? `?? ${Math.abs(days)} days overdue`
                          : days === 0
                            ? "? Due today!"
                            : `${days} days left`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReturnModal
        open={!!returnBorrow}
        borrow={returnBorrow}
        onClose={() => setReturnBorrow(null)}
        onSuccess={refresh}
      />
    </div>
  );
}
