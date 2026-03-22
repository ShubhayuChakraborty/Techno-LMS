"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { apiGetLibrarians, type LibrarianProfile } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const palette = [
    "#1D7FEC",
    "#34C759",
    "#FF9500",
    "#FF3B30",
    "#AF52DE",
    "#00C7BE",
  ];
  const idx = name.charCodeAt(0) % palette.length;
  return palette[idx];
}

export default function AdminLibrariansPage() {
  const [search, setSearch] = useState("");

  const { data: listData, loading: listLoading } = useFetch<{
    librarians: LibrarianProfile[];
    total: number;
  }>(() => apiGetLibrarians({ limit: 200 }), []);

  const librarians = listData?.librarians ?? [];

  const filteredLibrarians = useMemo(() => {
    if (!search.trim()) return librarians;
    const q = search.toLowerCase();
    return librarians.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.department ?? "").toLowerCase().includes(q),
    );
  }, [librarians, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Librarians</h1>
          <p className="page-subtitle">
            Manage librarian accounts and view staff details
          </p>
        </div>
        <Link href="/admin/librarians/new" className="btn btn-primary">
          <Plus size={16} /> Add Librarian
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--muted)",
          }}
        >
          {listLoading
            ? "Loading librarians..."
            : `${filteredLibrarians.length} of ${librarians.length} librarians`}
        </div>

        <div className="search-box" style={{ maxWidth: 320, width: "100%" }}>
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div
          className="table-container"
          style={{ border: "none", borderRadius: 0 }}
        >
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", padding: "28px 10px" }}
                  >
                    Loading librarians...
                  </td>
                </tr>
              ) : filteredLibrarians.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", padding: "28px 10px" }}
                  >
                    No librarians found.
                  </td>
                </tr>
              ) : (
                filteredLibrarians.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: l.avatarColor || getAvatarColor(l.name),
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {l.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={l.avatarUrl}
                              alt={l.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            getInitials(l.name)
                          )}
                        </div>
                        <span>{l.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{l.email}</td>
                    <td style={{ fontSize: 13 }}>{l.department || "—"}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(l.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
