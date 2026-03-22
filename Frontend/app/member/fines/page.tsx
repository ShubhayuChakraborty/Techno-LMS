"use client";

import React, { useMemo, useState } from "react";
import { CreditCard, Receipt, Clock, BadgeCheck } from "lucide-react";
import { Fine } from "@/lib/mockData";
import { FineStatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import PaymentModal from "@/components/fines/PaymentModal";
import { apiGetMyFines, apiMarkFinePaid, apiPayAllMyFines } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/contexts/AuthContext";

export default function MemberFinesPage() {
  const { user } = useAuth();
  const memberId = user?.member?.id ?? "";

  const {
    data: fines = [],
    loading,
    refresh,
  } = useFetch<Fine[]>(
    () => (memberId ? apiGetMyFines(memberId) : Promise.resolve([])),
    [memberId],
  );

  const [payFine, setPayFine] = useState<Fine | null>(null);
  const [payAllOpen, setPayAllOpen] = useState(false);

  const pending = useMemo(() => fines.filter((f) => !f.isPaid), [fines]);
  const pendingAmt = useMemo(
    () => pending.reduce((s, f) => s + f.amount, 0),
    [pending],
  );
  const totalAmt = fines.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Fines</h1>
          <p className="page-subtitle">
            {fines.length} records · {pending.length} pending
          </p>
        </div>
      </div>

      {pendingAmt > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: 24,
            background: "rgba(255,59,48,0.04)",
            border: "1.5px solid rgba(255,59,48,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}
            >
              Pending Fine Balance
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 800, color: "var(--danger)" }}
            >
              Rs. {pendingAmt}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setPayAllOpen(true)}
            style={{ fontWeight: 700 }}
          >
            <CreditCard size={14} /> Pay All — Rs. {pendingAmt}
          </button>
        </div>
      )}

      {pendingAmt === 0 && fines.length > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: 24,
            background: "rgba(52,199,89,0.04)",
            border: "1.5px solid rgba(52,199,89,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <BadgeCheck size={22} color="var(--success)" />
          <div
            style={{ fontSize: 14, color: "var(--success)", fontWeight: 600 }}
          >
            All fines cleared!
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Total Fines",
            value: fines.length,
            icon: <Receipt size={22} />,
            color: "var(--primary)",
          },
          {
            label: "Pending",
            value: `Rs. ${pendingAmt}`,
            icon: <Clock size={22} />,
            color: "var(--danger)",
          },
          {
            label: "Paid",
            value: `Rs. ${totalAmt - pendingAmt}`,
            icon: <BadgeCheck size={22} />,
            color: "var(--success)",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {fines.length === 0 && !loading ? (
        <EmptyState
          icon={<Receipt size={40} color="var(--muted)" />}
          title="No fines"
          description="You have no fines on record. Keep returning books on time!"
        />
      ) : loading ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}
        >
          Loading fines…
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Overdue Days</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>
                    {f.bookTitle || "Unknown Book"}
                  </td>
                  <td style={{ color: "var(--danger)" }}>
                    {f.overdueDays ?? Math.round(f.amount / 5)} days
                  </td>
                  <td style={{ fontWeight: 700 }}>Rs. {f.amount}</td>
                  <td style={{ color: "var(--muted)" }}>
                    {formatDate(f.createdAt)}
                  </td>
                  <td>
                    <FineStatusBadge isPaid={f.isPaid} />
                  </td>
                  <td>
                    {!f.isPaid && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setPayFine(f)}
                      >
                        <CreditCard size={12} /> Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
        Fine rate: Rs. 5 per day per overdue book. Contact the library counter
        to clear pending fines.
      </p>

      {/* Single fine payment */}
      <PaymentModal
        key={payFine?.id ?? "__none__"}
        open={!!payFine}
        fine={payFine}
        onClose={() => setPayFine(null)}
        onSuccess={() => {
          setPayFine(null);
          refresh();
        }}
      />

      {/* Pay all */}
      <PaymentModal
        key={payAllOpen ? "__all__" : "__all_closed__"}
        open={payAllOpen}
        fine={null}
        allPending={{
          ids: pending.map((f) => f.id),
          total: pendingAmt,
          memberId,
        }}
        onClose={() => setPayAllOpen(false)}
        onSuccess={() => {
          setPayAllOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
