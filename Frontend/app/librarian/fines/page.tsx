"use client";

import React, { useState, useMemo } from "react";
import { Search, CheckCircle, Eye } from "lucide-react";
import { apiGetFines, apiMarkFinePaid } from "@/lib/api";
import { Fine } from "@/lib/mockData";
import { useToast } from "@/contexts/ToastContext";
import { FineStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PaymentModal from "@/components/fines/PaymentModal";
import PaymentInfoModal from "@/components/fines/PaymentInfoModal";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";

export default function LibrarianFinesPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<"all" | "pending" | "paid">("pending");
  const [search, setSearch] = useState("");
  const [payId, setPayId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payModalFine, setPayModalFine] = useState<Fine | null>(null);
  const [infoFine, setInfoFine] = useState<Fine | null>(null);
  const {
    data: fines = [],
    loading,
    refresh,
  } = useFetch<Fine[]>(() => apiGetFines(), []);

  const filtered = useMemo(() => {
    let f = fines;
    if (tab === "pending") f = f.filter((x) => x.status === "pending");
    if (tab === "paid") f = f.filter((x) => x.status === "paid");
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((x) => x.memberName.toLowerCase().includes(q));
    }
    return f;
  }, [fines, tab, search]);

  const handleMarkPaid = async () => {
    if (!payId) return;
    setPaying(true);
    try {
      await apiMarkFinePaid(payId);
      success("Fine collected!");
      refresh();
    } catch {
      error("Failed to update fine");
    } finally {
      setPaying(false);
      setPayId(null);
    }
  };

  const pending = fines.filter((f) => f.status === "pending");
  const totalPending = pending.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fines</h1>
          <p className="page-subtitle">
            Rs.{totalPending} pending across {pending.length} members
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div className="filter-tabs" style={{ margin: 0 }}>
          {(["all", "pending", "paid"] as const).map((t) => (
            <button
              key={t}
              className={`filter-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-box" style={{ maxWidth: 280, flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search member…"
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
                <SkeletonTableRows rows={8} cols={6} />
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={40} color="var(--muted)" />}
          title="No fines"
          description={
            tab === "pending" ? "All fines are collected!" : "No records found"
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
                  <th>Overdue Days</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    className={f.status === "pending" ? "row-overdue" : ""}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {f.memberName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {f.membershipNo}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{f.bookTitle}</td>
                    <td style={{ fontSize: 13 }}>{f.overdueDays}d</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color:
                          f.status === "pending"
                            ? "var(--danger)"
                            : "var(--success)",
                        fontSize: 13,
                      }}
                    >
                      Rs.{f.amount}
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(f.createdAt)}</td>
                    <td>
                      <FineStatusBadge status={f.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {f.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setPayModalFine(f)}
                            >
                              <CheckCircle size={13} /> Collect
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setPayId(f.id)}
                              title="Mark as cash collected"
                            >
                              Cash
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setInfoFine(f)}
                            title="View payment info"
                          >
                            <Eye size={13} /> View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!payId}
        onClose={() => setPayId(null)}
        onConfirm={handleMarkPaid}
        title="Collect Fine (Cash)"
        message="Confirm cash payment received for this fine."
        confirmLabel="Mark Collected"
        variant="warning"
        loading={paying}
      />

      <PaymentModal
        key={payModalFine?.id ?? "__lib_none__"}
        open={!!payModalFine}
        fine={payModalFine}
        onClose={() => setPayModalFine(null)}
        onSuccess={() => {
          refresh();
          setPayModalFine(null);
        }}
      />

      <PaymentInfoModal
        open={!!infoFine}
        fine={infoFine}
        onClose={() => setInfoFine(null)}
      />
    </div>
  );
}
