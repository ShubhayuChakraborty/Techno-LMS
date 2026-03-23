"use client";

import React from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Member, type BorrowRecord } from "@/lib/mockData";
import { apiGetMemberBorrows } from "@/lib/api";
import { MemberStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useFetch } from "@/lib/useFetch";

interface Props {
  member: Member | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export default function MemberPanel({
  member,
  onClose,
  onEdit,
  onDeactivate,
}: Props) {
  const memberId = member?.id ?? "";
  const { data: borrows = [], loading: borrowsLoading } = useFetch<
    BorrowRecord[]
  >(
    () => (memberId ? apiGetMemberBorrows(memberId) : Promise.resolve([])),
    [memberId],
  );

  if (!member) return null;
  const active = borrows.filter((b) => !b.returnedAt);
  const history = borrows.filter((b) => b.returnedAt);

  return (
    <>
      {/* Backdrop */}
      <div className="panel-backdrop" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="side-panel">
        <div className="side-panel-header">
          <span
            style={{ fontWeight: 700, fontSize: 16, color: "var(--heading)" }}
          >
            Member Profile
          </span>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="side-panel-body">
          {/* Avatar + primary info */}
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "0 auto 12px",
                  display: "block",
                  border: "2px solid var(--border)",
                }}
              />
            ) : (
              <div
                className={`avatar avatar-xl avatar-${member.avatarColor || "blue"}`}
                style={{ margin: "0 auto 12px", fontSize: 28 }}
              >
                {member.name[0]}
              </div>
            )}
            <div
              style={{ fontWeight: 700, fontSize: 18, color: "var(--heading)" }}
            >
              {member.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {member.membershipNo}
            </div>
            <div style={{ marginTop: 8 }}>
              <MemberStatusBadge
                isActive={member.isActive}
                expiryDate={member.expiryDate}
              />
            </div>
          </div>

          {/* Contact info */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[
                { icon: <Mail size={14} />, value: member.email },
                { icon: <Phone size={14} />, value: member.phone || "—" },
                { icon: <MapPin size={14} />, value: member.address || "—" },
                {
                  icon: <Calendar size={14} />,
                  value: `Joined ${formatDate(member.joinedAt)}`,
                },
              ].map(({ icon, value }) => (
                <div
                  key={value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "var(--body)",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{icon}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              {
                label: "Active",
                value: member.activeBorrows,
                color: "var(--warning)",
              },
              {
                label: "Total",
                value: member.totalBorrows || borrows.length,
                color: "var(--primary)",
              },
              {
                label: "Fines",
                value: `Rs.${member.totalFines || 0}`,
                color: "var(--danger)",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: "var(--fill)",
                  borderRadius: 10,
                  padding: "12px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 700, color }}>
                  {value}
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Borrowed Books */}
          <div style={{ marginBottom: 14 }}>
            <div
              className="section-label"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <BookOpen size={12} /> Borrowed Books
            </div>

            {borrowsLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 8,
                      background: "var(--fill)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : active.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  padding: "10px 0",
                  textAlign: "center",
                }}
              >
                No active borrows
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {active.map((b) => {
                  const overdue = new Date(b.dueDate) < new Date();
                  return (
                    <div
                      key={b.id}
                      style={{
                        background: overdue
                          ? "rgba(255,59,48,0.05)"
                          : "var(--fill)",
                        border: `1px solid ${overdue ? "rgba(255,59,48,0.15)" : "var(--border)"}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--heading)",
                        }}
                      >
                        {b.bookTitle}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          marginTop: 2,
                        }}
                      >
                        {b.bookAuthor}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: overdue ? "var(--danger)" : "var(--muted)",
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {overdue ? <AlertTriangle size={11} /> : null}
                        {overdue ? "Overdue · " : "Due "}
                        {formatDate(b.dueDate)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          {!borrowsLoading && history.length > 0 && (
            <div>
              <div className="section-label">Borrow History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--body)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.bookTitle}
                    </span>
                    <span
                      style={{ color: "var(--muted)", whiteSpace: "nowrap" }}
                    >
                      {b.returnedAt ? formatDate(b.returnedAt) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="side-panel-footer">
          {onEdit && (
            <button
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={() => onEdit(member.id)}
            >
              Edit Member
            </button>
          )}
          {onDeactivate && member.isActive && (
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={member.activeBorrows > 0}
              onClick={() => onDeactivate(member.id)}
              title={
                member.activeBorrows > 0
                  ? "Cannot deactivate: has active borrows"
                  : ""
              }
            >
              Deactivate
            </button>
          )}
        </div>
      </div>
    </>
  );
}
