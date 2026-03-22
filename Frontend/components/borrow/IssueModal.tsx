"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  BookOpen,
  CheckCircle,
  Check,
  Loader2,
  Calendar,
  Clock,
  QrCode,
  Download,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import {
  apiIssueBorrow,
  apiGetMembers,
  apiGetBooks,
  apiGetBorrowRequest,
  apiConfirmBorrow,
} from "@/lib/api";
import { Member, Book } from "@/lib/mockData";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";
import QRCodeLib from "qrcode";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedBook?: Book | null;
}

type Step = "member" | "book" | "duration" | "confirm" | "qr";

const DURATION_OPTIONS = [
  { months: 1, label: "1 Month", days: 30, note: "Free" },
  { months: 2, label: "2 Months", days: 60, note: "Free" },
  { months: 3, label: "3 Months", days: 90, note: "Free" },
  { months: 4, label: "4 Months", days: 120, note: "Free" },
  { months: 6, label: "6 Months", days: 180, note: "₹5/day after 4 months" },
];

const STEPS: Step[] = ["member", "book", "duration", "confirm", "qr"];
const STEP_LABELS: Record<Step, string> = {
  member: "Member",
  book: "Book",
  duration: "Duration",
  confirm: "Confirm",
  qr: "QR Code",
};

function dueDateFromMonths(months: number): string {
  const d = new Date();
  d.setDate(d.getDate() + months * 30);
  return d.toISOString();
}

export default function IssueModal({
  open,
  onClose,
  onSuccess,
  preselectedBook,
}: Props) {
  const { success, error } = useToast();
  const [step, setStep] = useState<Step>("member");
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(
    preselectedBook ?? null,
  );
  const [borrowDurationMonths, setBorrowDurationMonths] = useState(1);
  const [issuing, setIssuing] = useState(false);
  const [issuedBorrowId, setIssuedBorrowId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [borrowCodeInput, setBorrowCodeInput] = useState("");
  const [borrowCode, setBorrowCode] = useState<string | null>(null);
  const [codeLookupLoading, setCodeLookupLoading] = useState(false);
  const [codeLookupError, setCodeLookupError] = useState<string | null>(null);

  const { data: members = [] } = useFetch<Member[]>(
    () => apiGetMembers().then((r) => r.members),
    [],
  );
  const { data: books = [] } = useFetch<Book[]>(
    () => apiGetBooks({ limit: 1000 }).then((r) => r.books),
    [],
  );

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.membershipNo.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }, [members, memberSearch]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.toLowerCase();
    return books.filter(
      (b) =>
        b.availableCopies > 0 &&
        (b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q)),
    );
  }, [books, bookSearch]);

  // Generate QR when we reach the QR step
  useEffect(() => {
    if (step === "qr" && issuedBorrowId && !qrDataUrl) {
      setQrLoading(true);
      QRCodeLib.toDataURL(issuedBorrowId, {
        width: 240,
        margin: 2,
        color: { dark: "#1d1d1f", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {})
        .finally(() => setQrLoading(false));
    }
  }, [step, issuedBorrowId, qrDataUrl]);

  const handleCodeLookup = async () => {
    if (!borrowCodeInput.trim()) return;
    setCodeLookupLoading(true);
    setCodeLookupError(null);
    try {
      const data = await apiGetBorrowRequest(
        borrowCodeInput.trim().toUpperCase(),
      );
      const foundMember =
        members.find((m) => m.membershipNo === data.member.membershipNo) ??
        null;
      const foundBook = books.find((b) => b.id === data.book.id) ?? null;
      if (!foundMember) throw new Error("Member not found in system.");
      if (!foundBook) throw new Error("Book not found in system.");
      setSelectedMember(foundMember);
      setSelectedBook(foundBook);
      setBorrowCode(borrowCodeInput.trim().toUpperCase());
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Invalid or expired borrow code.";
      setCodeLookupError(msg);
      setBorrowCode(null);
      setSelectedMember(null);
      setSelectedBook(null);
    } finally {
      setCodeLookupLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedMember || !selectedBook) return;
    setIssuing(true);
    try {
      let borrowId: string;
      if (borrowCode) {
        const record = await apiConfirmBorrow({
          code: borrowCode,
          borrowDays: selectedDuration.days,
        });
        borrowId = record.borrowId;
      } else {
        const record = await apiIssueBorrow({
          memberId: selectedMember.id,
          bookId: selectedBook.id,
          borrowDays: selectedDuration.days,
        });
        borrowId = record.id;
      }
      setIssuedBorrowId(borrowId);
      success(`"${selectedBook.title}" issued to ${selectedMember.name}`);
      onSuccess();
      setStep("qr");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("limit"))
        error("Member has reached borrow limit (3 books)");
      else error("Failed to issue book. Please try again.");
    } finally {
      setIssuing(false);
    }
  };

  const handleClose = () => {
    setStep("member");
    setMemberSearch("");
    setBookSearch("");
    setSelectedMember(null);
    setSelectedBook(preselectedBook ?? null);
    setBorrowDurationMonths(1);
    setIssuedBorrowId(null);
    setQrDataUrl(null);
    setCodeMode(false);
    setBorrowCodeInput("");
    setBorrowCode(null);
    setCodeLookupError(null);
    onClose();
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `borrow-qr-${issuedBorrowId}.png`;
    a.click();
  };

  const nextStep = () => {
    const order: Step[] =
      preselectedBook || borrowCode
        ? ["member", "duration", "confirm"]
        : ["member", "book", "duration", "confirm"];
    const idx = order.indexOf(step);
    if (idx !== -1 && idx < order.length - 1) setStep(order[idx + 1]);
  };

  const prevStep = () => {
    const order: Step[] =
      preselectedBook || borrowCode
        ? ["member", "duration", "confirm"]
        : ["member", "book", "duration", "confirm"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const isNextDisabled = () => {
    if (step === "member") return !selectedMember;
    if (step === "book") return !selectedBook;
    return false;
  };

  const dueDate = dueDateFromMonths(borrowDurationMonths);
  const freePeriodDays = Math.min(borrowDurationMonths, 4) * 30;
  const selectedDuration =
    DURATION_OPTIONS.find((d) => d.months === borrowDurationMonths) ??
    DURATION_OPTIONS[0];
  const hasFinePeriod = borrowDurationMonths > 4;

  const visibleSteps: Step[] =
    preselectedBook || borrowCode
      ? ["member", "duration", "confirm", "qr"]
      : ["member", "book", "duration", "confirm", "qr"];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === "qr" ? "Book Issued — QR Code" : "Issue Book"}
      maxWidth={560}
      footer={
        step === "qr" ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={downloadQr}
              disabled={!qrDataUrl}
            >
              <Download size={14} /> Download QR
            </button>
            <button className="btn btn-primary" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Step indicators */}
            <div
              style={{
                display: "flex",
                gap: 8,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              {visibleSteps
                .filter((s) => s !== "qr")
                .map((s, i) => {
                  const idx = visibleSteps.indexOf(step);
                  const sIdx = visibleSteps.indexOf(s);
                  const done = sIdx < idx;
                  const active = s === step;
                  return (
                    <span
                      key={s}
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background:
                            done || active ? "var(--primary)" : "var(--fill)",
                          color: done || active ? "white" : "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {done ? <Check size={12} /> : i + 1}
                      </span>
                      <span
                        style={{
                          color: active ? "var(--heading)" : "var(--muted)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {STEP_LABELS[s]}
                      </span>
                    </span>
                  );
                })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {step !== "member" && (
                <button className="btn btn-outline" onClick={prevStep}>
                  Back
                </button>
              )}
              {step === "confirm" ? (
                <button
                  className="btn btn-primary"
                  onClick={handleIssue}
                  disabled={issuing}
                >
                  {issuing ? (
                    <>
                      <Loader2 size={14} className="spin" /> Issuing…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Confirm Issue
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={isNextDisabled()}
                  onClick={nextStep}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )
      }
    >
      {/* ── Step: Member ── */}
      {step === "member" && (
        <div>
          {/* Mode tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              background: "var(--fill)",
              borderRadius: 10,
              padding: 4,
            }}
          >
            <button
              onClick={() => {
                setCodeMode(false);
                setBorrowCode(null);
                setBorrowCodeInput("");
                setCodeLookupError(null);
                setSelectedMember(null);
                setSelectedBook(preselectedBook ?? null);
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: !codeMode ? "var(--card)" : "transparent",
                color: !codeMode ? "var(--heading)" : "var(--muted)",
                boxShadow: !codeMode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Search Member
            </button>
            <button
              onClick={() => {
                setCodeMode(true);
                setSelectedMember(null);
                setSelectedBook(null);
                setBorrowCode(null);
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: codeMode ? "var(--card)" : "transparent",
                color: codeMode ? "var(--heading)" : "var(--muted)",
                boxShadow: codeMode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <QrCode size={13} /> Use Borrow Code
            </button>
          </div>

          {/* ── Code lookup mode ── */}
          {codeMode && (
            <div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  marginBottom: 12,
                }}
              >
                Enter the member&apos;s borrow code to auto-fill details:
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  placeholder="e.g. LIB-ABCDE"
                  value={borrowCodeInput}
                  onChange={(e) => {
                    setBorrowCodeInput(e.target.value.toUpperCase());
                    setBorrowCode(null);
                    setCodeLookupError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCodeLookup();
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--fill)",
                    color: "var(--heading)",
                    fontFamily: "monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    outline: "none",
                  }}
                  autoFocus
                />
                <button
                  className="btn btn-primary"
                  onClick={handleCodeLookup}
                  disabled={codeLookupLoading || !borrowCodeInput.trim()}
                >
                  {codeLookupLoading ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    "Lookup"
                  )}
                </button>
              </div>
              {codeLookupError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(255,59,48,0.08)",
                    border: "1px solid rgba(255,59,48,0.2)",
                    marginBottom: 12,
                  }}
                >
                  <AlertCircle size={15} color="#FF3B30" />
                  <span style={{ fontSize: 13, color: "#FF3B30" }}>
                    {codeLookupError}
                  </span>
                </div>
              )}
              {borrowCode && selectedMember && selectedBook && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      background: "rgba(52,199,89,0.06)",
                      borderRadius: 10,
                      border: "1px solid rgba(52,199,89,0.2)",
                    }}
                  >
                    <CheckCircle
                      size={16}
                      color="rgb(52,199,89)"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--heading)",
                        }}
                      >
                        {selectedMember.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {selectedMember.membershipNo} ·{" "}
                        {selectedMember.activeBorrows}/3 books
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      background: "rgba(52,199,89,0.06)",
                      borderRadius: 10,
                      border: "1px solid rgba(52,199,89,0.2)",
                    }}
                  >
                    <BookOpen
                      size={16}
                      color="rgb(52,199,89)"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--heading)",
                        }}
                      >
                        {selectedBook.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {selectedBook.author}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Manual member search mode ── */}
          {!codeMode && (
            <div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  marginBottom: 12,
                }}
              >
                Select the member to borrow the book:
              </p>
              <div className="search-box" style={{ marginBottom: 12 }}>
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Search member…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className={`select-row ${selectedMember?.id === m.id ? "selected" : ""} ${m.activeBorrows >= 3 || !m.isActive ? "disabled" : ""}`}
                    onClick={() => {
                      if (m.activeBorrows < 3 && m.isActive)
                        setSelectedMember(m);
                    }}
                  >
                    <div
                      className={`avatar avatar-sm avatar-${m.avatarColor || "blue"}`}
                    >
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {m.membershipNo} · {m.activeBorrows}/3 books
                      </div>
                    </div>
                    {m.activeBorrows >= 3 && (
                      <span className="badge badge-danger">Limit reached</span>
                    )}
                    {!m.isActive && (
                      <span className="badge badge-muted">Inactive</span>
                    )}
                    {selectedMember?.id === m.id && (
                      <CheckCircle size={16} color="var(--primary)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Book ── */}
      {step === "book" && (
        <div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
            Select a book to issue:
          </p>
          <div className="search-box" style={{ marginBottom: 12 }}>
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search books…"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                className={`select-row ${selectedBook?.id === b.id ? "selected" : ""}`}
                onClick={() => setSelectedBook(b)}
              >
                <BookOpen size={18} color="var(--muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {b.author} · {b.availableCopies} available
                  </div>
                </div>
                {selectedBook?.id === b.id && (
                  <CheckCircle size={16} color="var(--primary)" />
                )}
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 32,
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              >
                No available books found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Duration ── */}
      {step === "duration" && (
        <div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            How long does <strong>{selectedMember?.name}</strong> want to borrow
            the book?
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {DURATION_OPTIONS.map((opt) => {
              const selected = borrowDurationMonths === opt.months;
              const hasFine = opt.months > 4;
              return (
                <div
                  key={opt.months}
                  onClick={() => setBorrowDurationMonths(opt.months)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: selected
                      ? "2px solid var(--primary)"
                      : "1.5px solid var(--border)",
                    background: selected
                      ? "rgba(200,16,46,0.05)"
                      : "var(--fill)",
                    transition: "all 150ms",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: selected ? "none" : "2px solid var(--border)",
                        background: selected ? "var(--primary)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#fff",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--heading)",
                      }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      ({opt.days} days)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: hasFine
                        ? "rgba(255,159,10,0.1)"
                        : "rgba(52,199,89,0.1)",
                      color: hasFine ? "rgb(255,159,10)" : "rgb(52,199,89)",
                      border: hasFine
                        ? "1px solid rgba(255,159,10,0.25)"
                        : "1px solid rgba(52,199,89,0.25)",
                    }}
                  >
                    {opt.note}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fine policy info box */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "var(--fill)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle
                size={16}
                color="var(--primary)"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div
                style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}
              >
                <strong style={{ color: "var(--heading)" }}>
                  Fine Policy:
                </strong>{" "}
                First <strong>4 months are completely free</strong>. After the
                due date, a fine of{" "}
                <strong style={{ color: "var(--primary)" }}>₹5 per day</strong>{" "}
                is charged until the book is returned.
                {hasFinePeriod && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "rgb(255,159,10)",
                    }}
                  >
                    Note: This loan exceeds 4 months — fine of ₹5/day will apply
                    from day {freePeriodDays + 1} onwards.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Confirm ── */}
      {step === "confirm" && selectedMember && selectedBook && (
        <div>
          <div
            style={{
              background: "var(--fill)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              Issuing to
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className={`avatar avatar-sm avatar-${selectedMember.avatarColor || "blue"}`}
              >
                {selectedMember.name[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {selectedMember.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {selectedMember.membershipNo}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--fill)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              Book
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {selectedBook.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {selectedBook.author}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                background: "var(--fill)",
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
              >
                Issue Date
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {formatDate(new Date().toISOString())}
              </div>
            </div>
            <div
              style={{
                background: "var(--fill)",
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
              >
                Duration
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {selectedDuration.label}
              </div>
            </div>
            <div
              style={{
                background: "var(--fill)",
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
              >
                Due Date
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {formatDate(dueDate)}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "rgba(200,16,46,0.06)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--primary)",
              border: "1px solid rgba(200,16,46,0.15)",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Calendar size={14} />
              {selectedDuration.label} borrowing period · Fine of{" "}
            </span>
            <strong>₹5/day</strong> after due date · A QR code will be generated
            after issue.
          </div>
        </div>
      )}

      {/* ── Step: QR Code ── */}
      {step === "qr" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(52,199,89,0.1)",
                border: "2px solid rgba(52,199,89,0.25)",
              }}
            >
              <CheckCircle size={28} color="rgb(52,199,89)" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                Book Issued Successfully!
              </div>
              <div
                style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}
              >
                Show this QR to the librarian when collecting or returning the
                book.
              </div>
            </div>

            {/* QR Code */}
            <div
              style={{
                padding: 20,
                background: "white",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                border: "1px solid var(--border)",
              }}
            >
              {qrLoading ? (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2 size={32} className="spin" color="var(--muted)" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Borrow QR Code"
                  style={{ width: 200, height: 200, display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  QR unavailable
                </div>
              )}
            </div>

            {/* Borrow summary */}
            <div
              style={{
                width: "100%",
                background: "var(--fill)",
                borderRadius: 12,
                padding: 16,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  { label: "Book", value: selectedBook?.title },
                  { label: "Member", value: selectedMember?.name },
                  { label: "Duration", value: selectedDuration.label },
                  { label: "Due Date", value: formatDate(dueDate) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--heading)",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {issuedBorrowId && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                }}
              >
                Borrow ID: {issuedBorrowId}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
