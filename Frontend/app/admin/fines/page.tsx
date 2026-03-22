"use client";

import React, { useState, useMemo } from "react";
import { Search, CheckCircle, Eye, Wallet } from "lucide-react";
import { apiGetFines, apiMarkFinePaid, apiWaiveFine } from "@/lib/api";
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

type Tab = "all" | "pending" | "paid" | "waived";

export default function AdminFinesPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [payId, setPayId] = useState<string | null>(null);
  const [waiveId, setWaiveId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [waiving, setWaiving] = useState(false);
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
    if (tab === "waived") f = f.filter((x) => x.status === "waived");
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (x) =>
          x.memberName.toLowerCase().includes(q) ||
          x.bookTitle.toLowerCase().includes(q),
      );
    }
    return f;
  }, [fines, tab, search]);

  const pending = fines.filter((f) => f.status === "pending");
  const totalPending = pending.reduce((s, f) => s + f.amount, 0);
  const totalCollected = fines
    .filter((f) => f.status === "paid")
    .reduce((s, f) => s + f.amount, 0);

  const handleMarkPaid = async () => {
    if (!payId) return;
    setPaying(true);
    try {
      await apiMarkFinePaid(payId);
      success("Fine marked as paid");
      refresh();
    } catch {
      error("Failed to update fine");
    } finally {
      setPaying(false);
      setPayId(null);
    }
  };

  const handleWaive = async () => {
    if (!waiveId) return;
    setWaiving(true);
    try {
      await apiWaiveFine(waiveId);
      success("Fine waived successfully");
      refresh();
    } catch {
      error("Failed to waive fine");
    } finally {
      setWaiving(false);
      setWaiveId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fine Management</h1>
          <p className="page-subtitle">Track and collect overdue fines</p>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          {
            label: "Pending Fines",
            value: `Rs.${totalPending}`,
            count: pending.length,
            color: "#FF3B30",
            bg: "rgba(255,59,48,0.1)",
          },
          {
            label: "Collected",
            value: `Rs.${totalCollected}`,
            count: fines.filter((f) => f.status === "paid").length,
            color: "#34C759",
            bg: "rgba(52,199,89,0.1)",
          },
          {
            label: "Total Records",
            value: fines.length,
            count: null,
            color: "#1D7FEC",
            bg: "rgba(29,127,236,0.1)",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="stat-value"
              style={{ color: s.color, fontSize: 22 }}
            >
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
            {s.count != null && (
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}
              >
                {s.count} records
              </div>
            )}
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
          {(["all", "pending", "paid", "waived"] as Tab[]).map((t) => (
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
                <SkeletonTableRows rows={8} cols={7} />
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet size={40} color="var(--muted)" />}
          title="No fines found"
          description="Adjust filters or search to find fines"
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
                  <th>Actions</th>
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
                    <td style={{ fontSize: 13 }}>{f.overdueDays} days</td>
                    <td
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color:
                          f.status === "pending"
                            ? "var(--danger)"
                            : "var(--success)",
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
                              <CheckCircle size={13} /> Pay
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setPayId(f.id)}
                              title="Mark as cash paid"
                            >
                              Cash
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setWaiveId(f.id)}
                              title="Waive this fine"
                            >
                              Waive
                            </button>
                          </>
                        ) : f.status === "paid" ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setInfoFine(f)}
                            title="View payment info"
                          >
                            <Eye size={13} /> View
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            —
                          </span>
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
        title="Mark Fine as Paid (Cash)"
        message="Confirm that the fine has been collected in cash."
        confirmLabel="Mark Paid"
        variant="warning"
        loading={paying}
      />

      <ConfirmDialog
        open={!!waiveId}
        onClose={() => setWaiveId(null)}
        onConfirm={handleWaive}
        title="Waive Fine"
        message="This will clear the fine without payment. Continue?"
        confirmLabel="Waive"
        variant="danger"
        loading={waiving}
      />

      <PaymentModal
        key={payModalFine?.id ?? "__admin_none__"}
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
