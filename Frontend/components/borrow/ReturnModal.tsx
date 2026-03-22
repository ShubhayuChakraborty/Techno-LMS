"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { apiReturnBook } from "@/lib/api";
import { BorrowRecord } from "@/lib/mockData";
import { formatDate, calcFine, getOverdueDays } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  borrow: BorrowRecord | null;
}

export default function ReturnModal({
  open,
  onClose,
  onSuccess,
  borrow,
}: Props) {
  const { success, error } = useToast();
  const [returning, setReturning] = useState(false);

  if (!borrow) return null;

  const overdueDays = getOverdueDays(borrow.dueDate);
  const fine = calcFine(borrow.dueDate);
  const isOverdue = overdueDays > 0;

  const handleReturn = async () => {
    setReturning(true);
    try {
      await apiReturnBook(borrow.id);
      success(
        `"${borrow.bookTitle}" returned successfully${isOverdue ? `. Fine of Rs.${fine} applied.` : "!"}`,
      );
      onSuccess();
      onClose();
    } catch {
      error("Failed to process return. Please try again.");
    } finally {
      setReturning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Return Book"
      maxWidth={460}
      footer={
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${isOverdue ? "btn-warning" : "btn-success"}`}
            onClick={handleReturn}
            disabled={returning}
          >
            {returning ? (
              <>
                <Loader2 size={14} className="spin" /> Processing…
              </>
            ) : (
              <>
                <CheckCircle size={14} /> Confirm Return
              </>
            )}
          </button>
        </div>
      }
    >
      <div>
        {/* Book + Member info */}
        <div
          style={{
            background: "var(--fill)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{ fontWeight: 600, fontSize: 14, color: "var(--heading)" }}
          >
            {borrow.bookTitle}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {borrow.bookAuthor}
          </div>
          <div
            style={{ height: 1, background: "var(--border)", margin: "10px 0" }}
          />
          <div style={{ fontSize: 13, color: "var(--body)" }}>
            Borrowed by <strong>{borrow.memberName}</strong>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {borrow.membershipNo}
          </div>
        </div>

        {/* Dates */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{ background: "var(--fill)", borderRadius: 10, padding: 12 }}
          >
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Issue Date
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
              {formatDate(borrow.issuedAt)}
            </div>
          </div>
          <div
            style={{
              background: isOverdue ? "rgba(255,59,48,0.07)" : "var(--fill)",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: isOverdue ? "var(--danger)" : "var(--muted)",
              }}
            >
              Due Date
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                marginTop: 4,
                color: isOverdue ? "var(--danger)" : "var(--body)",
              }}
            >
              {formatDate(borrow.dueDate)}
            </div>
          </div>
        </div>

        {/* Fine summary */}
        {isOverdue ? (
          <div
            style={{
              background: "rgba(255,59,48,0.07)",
              borderRadius: 12,
              padding: 14,
              border: "1px solid rgba(255,59,48,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <AlertTriangle size={16} color="var(--danger)" />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--danger)",
                }}
              >
                Overdue Fine
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Overdue Days", `${overdueDays} days`],
                ["Rate", "Rs.5 / day"],
                ["Total Fine", `Rs.${fine}`],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{l}</span>
                  <strong
                    style={{
                      color:
                        l === "Total Fine" ? "var(--danger)" : "var(--body)",
                    }}
                  >
                    {v}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(52,199,89,0.07)",
              borderRadius: 12,
              padding: 14,
              border: "1px solid rgba(52,199,89,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} color="var(--success)" />
            <span
              style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}
            >
              Returned on time — no fine
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
