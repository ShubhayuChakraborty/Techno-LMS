"use client";

import React from "react";
import {
  CheckCircle,
  Receipt,
  User,
  BookOpen,
  Calendar,
  Hash,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Fine } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  fine: Fine | null;
}

function deriveTransactionId(fine: Fine): string {
  // Deterministic mock txn id based on fine id
  const hash = fine.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `TXN${String(hash * 7 + 1337)
    .padStart(8, "0")
    .slice(-8)}`;
}

const ROW = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "var(--primary)",
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>
        {value}
      </div>
    </div>
  </div>
);

export default function PaymentInfoModal({ open, onClose, fine }: Props) {
  if (!fine) return null;

  const txnId = deriveTransactionId(fine);
  const paidDate = fine.paidAt ?? fine.createdAt;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment Information"
      maxWidth={420}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Paid badge banner */}
        <div
          style={{
            background: "rgba(52,199,89,0.08)",
            border: "1.5px solid rgba(52,199,89,0.25)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(52,199,89,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={22} color="#34C759" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#34C759" }}>
              Payment Confirmed
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              This fine has been paid successfully
            </div>
          </div>
        </div>

        {/* Details */}
        <ROW
          icon={<Hash size={15} />}
          label="Transaction ID"
          value={
            <span style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
              {txnId}
            </span>
          }
        />
        <ROW
          icon={<IndianRupee size={15} />}
          label="Amount Paid"
          value={
            <span style={{ color: "#34C759", fontSize: 15 }}>
              Rs. {fine.amount}
            </span>
          }
        />
        <ROW
          icon={<CreditCard size={15} />}
          label="Payment Method"
          value="Razorpay"
        />
        <ROW
          icon={<User size={15} />}
          label="Member"
          value={
            <>
              {fine.memberName}
              {fine.membershipNo && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    fontWeight: 400,
                    marginLeft: 6,
                  }}
                >
                  ({fine.membershipNo})
                </span>
              )}
            </>
          }
        />
        <ROW
          icon={<BookOpen size={15} />}
          label="Book"
          value={fine.bookTitle}
        />
        <ROW
          icon={<Receipt size={15} />}
          label="Overdue Days"
          value={`${fine.overdueDays} days`}
        />
        <ROW
          icon={<Calendar size={15} />}
          label="Fine Issued"
          value={formatDate(fine.createdAt)}
        />
        <div style={{ borderBottom: "none" }}>
          <ROW
            icon={<Calendar size={15} />}
            label="Paid On"
            value={formatDate(paidDate)}
          />
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: 20 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
