"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BorrowRecord } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";
import { Badge, MemberStatusBadge } from "@/components/ui/Badge";
import ProfileBase from "@/components/profile/ProfileBase";
import { BookOpen, Clock, BookCheck, Coins } from "lucide-react";
import { useFetch } from "@/lib/useFetch";
import { apiGetMemberBorrows } from "@/lib/api";

export default function MemberProfilePage() {
  const { user } = useAuth();
  const member = user?.member;
  const memberId = member?.id ?? "";

  const { data: borrows = [] } = useFetch<BorrowRecord[]>(
    () => (memberId ? apiGetMemberBorrows(memberId) : Promise.resolve([])),
    [memberId],
  );

  const overdue = borrows.filter(
    (b) => !b.returnedAt && new Date(b.dueDate) < new Date(),
  ).length;

  const [phone, setPhone] = useState(member?.phone ?? "");
  const [address, setAddress] = useState(member?.address ?? "");

  const isSubscribed = false; // Subscriptions removed
  const currentPlan = "standard";

  if (!user || !member) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            View and manage your membership details
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isSubscribed ? (
            <Badge
              variant="blue"
              label={currentPlan.toUpperCase()}
              dot={false}
            />
          ) : null}
          <MemberStatusBadge
            isActive={member.isActive}
            expiryDate={member.expiryDate ?? ""}
          />
        </div>
      </div>

      <ProfileBase
        avatarBadge={
          isSubscribed ? (
            <span
              title={`${currentPlan.toUpperCase()} Member`}
              aria-label="Verified subscriber"
              style={{
                display: "inline-flex",
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outer dark blue border */}
                <path
                  d="M50 8 C60 2 70 2 78 10 C85 18 92 25 92 35 C98 45 98 55 92 65 C92 75 85 82 78 90 C70 98 60 98 50 92 C40 98 30 98 22 90 C15 82 8 75 8 65 C2 55 2 45 8 35 C8 25 15 18 22 10 C30 2 40 2 50 8 Z"
                  fill="#003D99"
                />
                {/* Inner light blue */}
                <path
                  d="M50 18 C58 13 66 13 72 19 C78 25 82 32 82 40 C87 48 87 52 82 60 C82 68 78 75 72 81 C66 87 58 87 50 82 C42 87 34 87 28 81 C22 75 18 68 18 60 C13 52 13 48 18 40 C18 32 22 25 28 19 C34 13 42 13 50 18 Z"
                  fill="#5DADE2"
                />
                {/* Dark blue checkmark */}
                <g transform="translate(50, 50)">
                  <path
                    d="M -12 0 L -4 8 L 12 -8"
                    stroke="#003D99"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>
              </svg>
            </span>
          ) : null
        }
        extraInfoRows={[
          { label: "Member ID", value: member.membershipNo },
          { label: "Phone", value: phone || "—" },
          { label: "Address", value: address || "—" },
          {
            label: "Joined",
            value: member.joinedAt ? formatDate(member.joinedAt) : "—",
          },
        ]}
        extraFields={[
          {
            key: "phone",
            label: "Phone Number",
            type: "tel",
            value: phone,
            onChange: setPhone,
          },
          {
            key: "address",
            label: "Address",
            type: "text",
            value: address,
            onChange: setAddress,
          },
        ]}
      >
        {/* Member stats */}
        <div
          className="stats-grid"
          style={{
            marginTop: 20,
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          }}
        >
          {[
            {
              label: "Active Borrows",
              value: member.activeBorrows,
              icon: <BookOpen size={26} />,
              color: "var(--primary)",
            },
            {
              label: "Overdue",
              value: overdue,
              icon: <Clock size={26} />,
              color: "#FF9500",
            },
            {
              label: "Total Borrowed",
              value: member.totalBorrows,
              icon: <BookCheck size={26} />,
              color: "#34C759",
            },
            {
              label: "Pending Fines",
              value: `Rs. ${member.unpaidFines}`,
              icon: <Coins size={26} />,
              color: (member.unpaidFines ?? 0) > 0 ? "#FF3B30" : "var(--muted)",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 6, color: s.color }}>{s.icon}</div>
              <div
                className="stat-value"
                style={{ fontSize: 20, color: s.color }}
              >
                {s.value}
              </div>
              <div className="stat-label" style={{ fontSize: 11 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent borrows */}
        {borrows.length > 0 && (
          <div className="card" style={{ padding: 24, marginTop: 20 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--heading)",
                marginBottom: 14,
              }}
            >
              Recent Borrows
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {borrows.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--surface)",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--heading)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
                      {b.bookAuthor} · Issued {formatDate(b.issuedAt)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                      flexShrink: 0,
                      background:
                        b.status === "returned"
                          ? "rgba(52,199,89,0.12)"
                          : b.status === "overdue"
                            ? "rgba(255,59,48,0.12)"
                            : "rgba(29,127,236,0.12)",
                      color:
                        b.status === "returned"
                          ? "#34C759"
                          : b.status === "overdue"
                            ? "#FF3B30"
                            : "var(--primary)",
                    }}
                  >
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProfileBase>
    </div>
  );
}
