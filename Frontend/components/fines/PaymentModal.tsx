"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Lock,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { apiMarkFinePaid, apiPayAllMyFines } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import type { Fine } from "@/lib/mockData";

type Stage = "select" | "processing" | "success" | "failed";

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Single fine or null to pay all */
  fine: Fine | null;
  /** When paying all, pass total amount + ids + memberId for bulk API */
  allPending?: { ids: string[]; total: number; memberId?: string };
}

export default function PaymentModal({
  open,
  onClose,
  onSuccess,
  fine,
  allPending,
}: Props) {
  const { success: toastSuccess } = useToast();
  const [txnId] = useState(
    () =>
      `TXN${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0")}`,
  );

  const amount = fine ? fine.amount : (allPending?.total ?? 0);
  const label = fine
    ? `Fine — ${fine.bookTitle}`
    : `All Pending Fines (${allPending?.ids.length ?? 0})`;

  const [stage, setStage] = useState<Stage>("select");

  const handleClose = () => {
    if (stage === "processing") return;
    onClose();
  };

  // ── TODO: Replace this with Razorpay SDK call ─────────────────────────────
  // Example integration point:
  //   const options = {
  //     key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  //     amount: amount * 100, // paise
  //     currency: "INR",
  //     name: "City Library",
  //     description: label,
  //     handler: async (response) => {
  //       await verifyRazorpayPayment(response);
  //       markFinesPaid();
  //     },
  //   };
  //   const rzp = new window.Razorpay(options);
  //   rzp.open();
  // ─────────────────────────────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setStage("processing");
    try {
      // TODO: Open Razorpay checkout here. For now, mark paid directly.
      if (fine) {
        await apiMarkFinePaid(fine.id);
      } else if (allPending) {
        if (allPending.memberId) {
          await apiPayAllMyFines(allPending.memberId);
        } else {
          for (const id of allPending.ids) {
            await apiMarkFinePaid(id);
          }
        }
      }
      setStage("success");
    } catch {
      setStage("failed");
    }
  };

  const renderBody = () => {
    // ── Processing ──────────────────────────────────────────────────────────
    if (stage === "processing") {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Loader2
            size={44}
            className="spin"
            style={{ color: "var(--primary)" }}
          />
          <div
            style={{ fontWeight: 700, fontSize: 16, color: "var(--heading)" }}
          >
            Processing Payment…
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Please do not close this window
          </div>
        </div>
      );
    }

    // ── Success ─────────────────────────────────────────────────────────────
    if (stage === "success") {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(52,199,89,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={40} color="#34C759" />
          </div>
          <div
            style={{ fontWeight: 800, fontSize: 18, color: "var(--heading)" }}
          >
            Payment Successful!
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            Rs. {amount} paid successfully
          </div>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 13,
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            Transaction ID:{" "}
            <strong style={{ color: "var(--body)", fontFamily: "monospace" }}>
              {txnId}
            </strong>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8, minWidth: 140 }}
            onClick={() => {
              toastSuccess("Fine cleared successfully");
              onSuccess();
              onClose();
            }}
          >
            Done
          </button>
        </div>
      );
    }

    // ── Failed ───────────────────────────────────────────────────────────────
    if (stage === "failed") {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <AlertCircle size={44} color="#FF3B30" />
          <div
            style={{ fontWeight: 700, fontSize: 16, color: "var(--heading)" }}
          >
            Payment Failed
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Something went wrong. Please try again.
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setStage("select")}
          >
            Try Again
          </button>
        </div>
      );
    }

    // ── Razorpay checkout ────────────────────────────────────────────────────
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Amount banner */}
        <div
          style={{
            background: "linear-gradient(135deg,#1D7FEC,#0A5FBF)",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
              Amount to Pay
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Rs. {amount}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              {label}
            </div>
          </div>
          <CreditCard size={40} />
        </div>

        {/* Razorpay pay button */}
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRadius: 10,
          }}
          onClick={handleRazorpayPayment}
        >
          {/* Razorpay logo mark */}
          <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
            <path d="M18 0L0 36h10.8L18 18.9 25.2 36H36L18 0z" fill="white" />
          </svg>
          Pay Rs. {amount} with Razorpay
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          <Lock size={14} /> Secured by Razorpay
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 0.9s linear infinite; }
        .input-error { border-color: var(--danger) !important; }
      `}</style>
      <Modal
        open={open}
        onClose={handleClose}
        title={
          stage === "success"
            ? "Payment Successful"
            : stage === "processing"
              ? "Processing…"
              : `Pay Fine – Rs. ${amount}`
        }
        maxWidth={480}
      >
        {renderBody()}
      </Modal>
    </>
  );
}
