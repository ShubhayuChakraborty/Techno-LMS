"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { apiRequestBorrow } from "@/lib/api";
import { Book } from "@/lib/mockData";

interface Props {
  open: boolean;
  book: Book | null;
  onClose: () => void;
}

export default function BorrowCodeModal({ open, book, onClose }: Props) {
  const { success } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestBorrow = (bookId: string) => {
    setRequestId(null);
    setErrorMsg(null);
    setLoading(true);
    apiRequestBorrow(bookId)
      .then(({ requestId: id }) => {
        setRequestId(id);
        success("Borrow request submitted to librarian");
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to submit borrow request.";
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || !book) return;
    requestBorrow(book.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book?.id]);

  const handleClose = () => {
    setRequestId(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Borrow Request"
      maxWidth={460}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={handleClose}>
            Close
          </button>
        </div>
      }
    >
      {book && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "var(--fill)",
            borderRadius: 10,
            marginBottom: 20,
            border: "1px solid var(--border)",
          }}
        >
          <BookOpen
            size={20}
            color="var(--primary)"
            style={{ flexShrink: 0 }}
          />
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, color: "var(--heading)" }}
            >
              {book.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {book.author}
            </div>
          </div>
        </div>
      )}

      {!loading && errorMsg && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "28px 0",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(255,59,48,0.1)",
              border: "2px solid rgba(255,59,48,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle size={26} color="#FF3B30" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontWeight: 700,
                color: "var(--heading)",
                marginBottom: 6,
              }}
            >
              Failed to submit request
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{errorMsg}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => book && requestBorrow(book.id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "32px 0",
          }}
        >
          <Loader2 size={36} className="animate-spin" color="var(--primary)" />
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Submitting your request…
          </p>
        </div>
      )}

      {!loading && requestId && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(52,199,89,0.12)",
              border: "2px solid rgba(52,199,89,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={26} color="rgb(52,199,89)" />
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}
            >
              Request submitted successfully. Librarian/Admin will approve or
              decline this request.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                background: "rgba(200,16,46,0.06)",
                border: "2px solid rgba(200,16,46,0.25)",
                borderRadius: 14,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  color: "var(--primary)",
                }}
              >
                REQ-{requestId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
