"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, UserCheck, UserX, Users } from "lucide-react";
import {
  apiGetMembers,
  apiToggleMemberActive,
  apiDeleteMember,
} from "@/lib/api";
import { Member } from "@/lib/mockData";
import { useToast } from "@/contexts/ToastContext";
import { MemberStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MemberPanel from "@/components/members/MemberPanel";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

const PER_PAGE = 10;

export default function AdminMembersPage() {
  const { success, error } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Member | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Member | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    data: members = [],
    loading,
    refresh,
  } = useFetch<Member[]>(() => apiGetMembers().then((r) => r.members), []);

  const filtered = useMemo(() => {
    let m = members;
    if (search) {
      const q = search.toLowerCase();
      m = m.filter(
        (mem) =>
          mem.name.toLowerCase().includes(q) ||
          mem.email.toLowerCase().includes(q) ||
          mem.membershipNo.toLowerCase().includes(q),
      );
    }
    if (statusFilter === "active") m = m.filter((mem) => mem.isActive);
    if (statusFilter === "inactive") m = m.filter((mem) => !mem.isActive);
    return m;
  }, [members, search, statusFilter]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteMember(deleteTarget.id);
      success(`${deleteTarget.name} has been deleted`);
      refresh();
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch {
      error("Failed to delete member");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    const isDeactivating = toggleTarget.isActive;
    try {
      await apiToggleMemberActive(toggleTarget.id);
      success(isDeactivating ? "Member deactivated" : "Member activated");
      refresh();
      if (selected?.id === toggleTarget.id) setSelected(null);
    } catch {
      error(
        isDeactivating
          ? "Failed to deactivate member"
          : "Failed to activate member",
      );
    } finally {
      setToggling(false);
      setToggleTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{filtered.length} members found</p>
        </div>
        <Link href="/admin/members/new" className="btn btn-primary">
          <Plus size={16} /> Register Member
        </Link>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, email, ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="filter-tabs" style={{ margin: 0 }}>
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? "active" : ""}`}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card">
          <div
            className="table-container"
            style={{ borderRadius: 0, border: "none" }}
          >
            <table>
              <tbody>
                <SkeletonTableRows rows={8} cols={6} />
              </tbody>
            </table>
          </div>
        </div>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={<Users size={40} color="var(--muted)" />}
          title="No members found"
          description="Try adjusting your search filters"
          action={
            <Link href="/admin/members/new" className="btn btn-primary">
              <Plus size={16} /> Register Member
            </Link>
          }
        />
      ) : (
        <div className="card">
          <div
            className="table-container"
            style={{ borderRadius: 0, border: "none" }}
          >
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="hide-mobile">Membership No.</th>
                  <th>Status</th>
                  <th>Active Borrows</th>
                  <th className="hide-mobile">Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: "1px solid var(--border)",
                            }}
                          />
                        ) : (
                          <div
                            className={`avatar avatar-sm avatar-${m.avatarColor || "blue"}`}
                          >
                            {m.name[0]}
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--heading)",
                              fontSize: 13,
                            }}
                          >
                            {m.name}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }} className="hide-mobile">
                      {m.membershipNo}
                    </td>
                    <td>
                      <MemberStatusBadge
                        isActive={m.isActive}
                        expiryDate={m.expiryDate}
                      />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            m.activeBorrows > 0
                              ? "var(--warning)"
                              : "var(--muted)",
                        }}
                      >
                        {m.activeBorrows}/3
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }} className="hide-mobile">
                      {formatDate(m.joinedAt)}
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                        <button
                          className={`btn btn-sm ${
                            m.isActive ? "btn-danger" : "btn-outline"
                          }`}
                          disabled={m.isActive && m.activeBorrows > 0}
                          onClick={() => setToggleTarget(m)}
                          title={
                            m.isActive && m.activeBorrows > 0
                              ? "Cannot deactivate: has active borrows"
                              : m.isActive
                                ? "Deactivate member"
                                : "Activate member"
                          }
                        >
                          {m.isActive ? (
                            <UserX size={13} />
                          ) : (
                            <UserCheck size={13} />
                          )}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={m.activeBorrows > 0}
                          onClick={() => setDeleteTarget(m)}
                          title={
                            m.activeBorrows > 0
                              ? "Cannot delete: has active borrows"
                              : "Delete member"
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={PER_PAGE}
        onPage={setPage}
      />

      <MemberPanel
        member={selected}
        onClose={() => setSelected(null)}
        onEdit={(id) => router.push(`/admin/members/${id}`)}
        onDeactivate={(id) => {
          const m = members.find((mem) => mem.id === id) ?? null;
          setSelected(null);
          setToggleTarget(m);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Permanently delete ${deleteTarget?.name}? This cannot be undone. All their data will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? "Deactivate Member" : "Activate Member"}
        message={
          toggleTarget?.isActive
            ? "This will suspend the member's access to the library. They won't be able to borrow books until reactivated."
            : "This will restore the member's library access. They will be able to borrow books again."
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        variant="warning"
        loading={toggling}
      />
    </div>
  );
}
