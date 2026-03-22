"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Copy,
  CheckCircle,
  Clock,
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

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { remaining, label: `${mins}:${secs.toString().padStart(2, "0")}` };
}

export default function BorrowCodeModal({ open, book, onClose }: Props) {
  const { success } = useToast();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { remaining, label: countdownLabel } = useCountdown(expiresAt);

  const requestCode = (bookId: string) => {
    setCode(null);
    setExpiresAt(null);
    setErrorMsg(null);
    setLoading(true);
    apiRequestBorrow(bookId)
      .then(({ code: c, expiresAt: exp }) => {
        setCode(c);
        setExpiresAt(exp);
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to generate borrow code.";
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  };

  // Automatically request the borrow code when the modal opens
  useEffect(() => {
    if (!open || !book) return;
    requestCode(book.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book?.id]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setCode(null);
    setExpiresAt(null);
    setErrorMsg(null);
    setCopied(false);
    onClose();
  };

  const expired = remaining === 0 && !!expiresAt;
  const urgency = remaining > 0 && remaining <= 120; // last 2 minutes

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
      {/* Book info */}
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

      {/* Error state */}
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
              Failed to generate code
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{errorMsg}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => book && requestCode(book.id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
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
            Generating your borrow code…
          </p>
        </div>
      )}

      {/* Code display */}
      {!loading && code && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Success icon */}
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
              Show this code to the librarian to confirm your borrow
            </p>

            {/* The code itself */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 24px",
                background: expired
                  ? "rgba(255,59,48,0.06)"
                  : "rgba(200,16,46,0.06)",
                border: `2px solid ${expired ? "rgba(255,59,48,0.3)" : "rgba(200,16,46,0.25)"}`,
                borderRadius: 14,
                cursor: expired ? "not-allowed" : "pointer",
              }}
              onClick={!expired ? handleCopy : undefined}
              title={expired ? "Code expired" : "Click to copy"}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  color: expired ? "var(--muted)" : "var(--primary)",
                  textDecoration: expired ? "line-through" : "none",
                }}
              >
                {code}
              </span>
              {!expired &&
                (copied ? (
                  <CheckCircle
                    size={18}
                    color="rgb(52,199,89)"
                    style={{ flexShrink: 0 }}
                  />
                ) : (
                  <Copy
                    size={18}
                    color="var(--muted)"
                    style={{ flexShrink: 0 }}
                  />
                ))}
            </div>
          </div>

          {/* Countdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 20,
              background: expired
                ? "rgba(255,59,48,0.08)"
                : urgency
                  ? "rgba(255,159,10,0.1)"
                  : "var(--fill)",
              border: `1px solid ${
                expired
                  ? "rgba(255,59,48,0.2)"
                  : urgency
                    ? "rgba(255,159,10,0.25)"
                    : "var(--border)"
              }`,
            }}
          >
            <Clock
              size={14}
              color={expired ? "#FF3B30" : urgency ? "#FF9F0A" : "var(--muted)"}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: expired
                  ? "#FF3B30"
                  : urgency
                    ? "#FF9F0A"
                    : "var(--muted)",
              }}
            >
              {expired ? "Code expired" : `Expires in ${countdownLabel}`}
            </span>
          </div>

          {expired && (
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              Your code has expired. Close and click Borrow again to get a new
              one.
            </p>
          )}

          {/* Instructions */}
          {!expired && (
            <div
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--fill)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "var(--heading)" }}>How it works:</strong>
              <ol style={{ margin: "6px 0 0 16px", padding: 0 }}>
                <li>Go to the library counter with this code</li>
                <li>The librarian enters the code to confirm the borrow</li>
                <li>They&apos;ll let you know the return due date</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
