"use client";

import React, { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { apiGetMembers } from "@/lib/api";
import { Member } from "@/lib/mockData";
import { MemberStatusBadge } from "@/components/ui/Badge";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import MemberPanel from "@/components/members/MemberPanel";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";

const PER_PAGE = 12;

export default function LibrarianMembersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Member | null>(null);
  const { data: members = [], loading } = useFetch<Member[]>(
    () => apiGetMembers().then((r) => r.members),
    [],
  );

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.membershipNo.toLowerCase().includes(q),
    );
  }, [members, search]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{filtered.length} members</p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, email, membership ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      {loading ? (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <tbody>
                <SkeletonTableRows rows={8} cols={5} />
              </tbody>
            </table>
          </div>
        </div>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={<Users size={40} color="var(--muted)" />}
          title="No members found"
          description="Try a different search"
        />
      ) : (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="hide-mobile">Membership No.</th>
                  <th>Status</th>
                  <th>Active Borrows</th>
                  <th className="hide-mobile">Joined</th>
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
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
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
                    <td
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
                    </td>
                    <td style={{ fontSize: 13 }} className="hide-mobile">
                      {formatDate(m.joinedAt)}
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
      <MemberPanel member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
