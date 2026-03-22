"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, UserCheck, UserX } from "lucide-react";
import {
  apiGetMember,
  apiToggleMemberActive,
  apiDeleteMember,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import {
  MemberStatusBadge,
  BorrowStatusBadge,
  FineStatusBadge,
} from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MemberForm from "@/components/members/MemberForm";
import { useFetch } from "@/lib/useFetch";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import { MOCK_BORROWS, MOCK_FINES } from "@/lib/mockData";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { success, error } = useToast();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    data: member,
    loading,
    refresh,
  } = useFetch(() => apiGetMember(id), [id]);

  const borrows = MOCK_BORROWS.filter((b) => b.memberId === id);
  const fines = MOCK_FINES.filter((f) => f.memberId === id);

  const handleToggle = async () => {
    if (!member) return;
    setDeactivating(true);
    const isDeactivating = member.isActive;
    try {
      await apiToggleMemberActive(member.id);
      success(isDeactivating ? "Member deactivated" : "Member activated");
      refresh();
    } catch {
      error(isDeactivating ? "Failed to deactivate" : "Failed to activate");
    } finally {
      setDeactivating(false);
      setConfirmDeactivate(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    setDeleting(true);
    try {
      await apiDeleteMember(member.id);
      success(`${member.name} has been deleted`);
      router.push("/admin/members");
    } catch {
      error("Failed to delete member");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading)
    return (
      <div className="page">
        <SkeletonCard />
      </div>
    );
  if (!member)
    return (
      <div className="page">
        <p>Member not found.</p>
      </div>
    );

  if (editMode)
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <button
              onClick={() => setEditMode(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginBottom: 6,
              }}
            >
              <ArrowLeft size={14} /> Back to Member
            </button>
            <h1 className="page-title">Edit Member</h1>
          </div>
        </div>
        <MemberForm
          member={member}
          returnPath={`/admin/members/${member.id}`}
          isEdit
        />
      </div>
    );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link
            href="/admin/members"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--muted)",
              textDecoration: "none",
              marginBottom: 6,
            }}
          >
            <ArrowLeft size={14} /> Members
          </Link>
          <h1 className="page-title">{member.name}</h1>
          <p className="page-subtitle">{member.membershipNo}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setEditMode(true)}>
            <Edit3 size={15} /> Edit
          </button>
          <button
            className="btn btn-danger"
            disabled={member.activeBorrows > 0}
            onClick={() => setConfirmDelete(true)}
            title={
              member.activeBorrows > 0
                ? "Cannot delete: has active borrows"
                : "Delete member"
            }
          >
            <Trash2 size={15} /> Delete
          </button>
          <button
            className={`btn ${member.isActive ? "btn-danger" : "btn-outline"}`}
            disabled={member.isActive && member.activeBorrows > 0}
            onClick={() => setConfirmDeactivate(true)}
            title={
              member.isActive && member.activeBorrows > 0
                ? "Has active borrows"
                : ""
            }
          >
            {member.isActive ? (
              <>
                <UserX size={15} /> Deactivate
              </>
            ) : (
              <>
                <UserCheck size={15} /> Activate
              </>
            )}
          </button>
        </div>
      </div>

      <div className="two-col-60">
        {/* Profile */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                className={`avatar avatar-xl avatar-${member.avatarColor || "blue"}`}
              >
                {member.name[0]}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "var(--heading)",
                  }}
                >
                  {member.name}
                </div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>
                  {member.email}
                </div>
                {member.phone && (
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {member.phone}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <MemberStatusBadge
                    isActive={member.isActive}
                    expiryDate={member.expiryDate}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid var(--border)",
                padding: "14px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {[
                ["Active Borrows", member.activeBorrows, "var(--warning)"],
                [
                  "Total Borrows",
                  member.totalBorrows ?? borrows.length,
                  "var(--primary)",
                ],
                [
                  "Total Fines",
                  `Rs.${member.totalFines ?? 0}`,
                  "var(--danger)",
                ],
              ].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: c as string,
                    }}
                  >
                    {v as string}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Borrow History */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Borrow History
              </span>
            </div>
            {borrows.length === 0 ? (
              <p
                style={{
                  padding: "20px",
                  fontSize: 13,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                No borrow records
              </p>
            ) : (
              <div
                className="table-container"
                style={{ borderRadius: 0, border: "none" }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrows.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {b.bookTitle}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {b.bookAuthor}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {formatDate(b.issuedAt)}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {formatDate(b.dueDate)}
                        </td>
                        <td>
                          <BorrowStatusBadge
                            dueDate={b.dueDate}
                            returnedAt={b.returnedAt}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Membership Details
              </span>
            </div>
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[
                ["Membership No.", member.membershipNo],
                [
                  "Type",
                  member.membershipType?.charAt(0).toUpperCase() +
                    (member.membershipType?.slice(1) ?? ""),
                ],
                ["Joined", formatDate(member.joinedAt)],
                ["Expires", formatDate(member.expiryDate)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <span style={{ color: "var(--body)", fontWeight: 500 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Fines</span>
            </div>
            {fines.length === 0 ? (
              <p
                style={{
                  padding: "20px",
                  fontSize: 13,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                No fines
              </p>
            ) : (
              <div style={{ padding: "8px 16px 16px" }}>
                {fines.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>Rs.{f.amount}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {formatDate(f.createdAt)}
                      </div>
                    </div>
                    <FineStatusBadge status={f.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Permanently delete ${member.name}? This cannot be undone. All their data will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleToggle}
        title={member.isActive ? "Deactivate Member" : "Activate Member"}
        message={
          member.isActive
            ? `Deactivate ${member.name}? They won't be able to borrow books until reactivated.`
            : `Activate ${member.name}? They will regain full library access.`
        }
        confirmLabel={member.isActive ? "Deactivate" : "Activate"}
        variant="warning"
        loading={deactivating}
      />
    </div>
  );
}
