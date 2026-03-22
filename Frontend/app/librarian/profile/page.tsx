"use client";

import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import ProfileBase from "@/components/profile/ProfileBase";
import { useAuth } from "@/contexts/AuthContext";

export default function LibrarianProfilePage() {
  const { user } = useAuth();
  const librarian = user?.librarian;

  const [phone, setPhone] = useState(librarian?.phone ?? "");
  const [department, setDepartment] = useState(librarian?.department ?? "");
  const [address, setAddress] = useState(librarian?.address ?? "");

  // Sync local state when user context refreshes after a save
  useEffect(() => {
    if (librarian?.phone !== undefined) setPhone(librarian.phone ?? "");
    if (librarian?.department !== undefined)
      setDepartment(librarian.department ?? "");
    if (librarian?.address !== undefined) setAddress(librarian.address ?? "");
  }, [librarian?.phone, librarian?.department, librarian?.address]);

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your librarian account details and security
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(52,199,89,0.1)",
            color: "#34C759",
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <BookOpen size={16} />
          Librarian
        </div>
      </div>

      <ProfileBase
        extraInfoRows={[
          { label: "Phone", value: phone || "—" },
          { label: "Department", value: department || "—" },
          { label: "Address", value: address || "—" },
          { label: "Role", value: "Librarian" },
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
            key: "department",
            label: "Department",
            type: "text",
            value: department,
            onChange: setDepartment,
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
        {/* Librarian-specific info */}
        <div className="card" style={{ padding: 24, marginTop: 20 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "var(--heading)",
              marginBottom: 16,
            }}
          >
            Librarian Access
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Manage Books", active: true },
              { label: "Issue & Return Books", active: true },
              { label: "View Members", active: true },
              { label: "Manage Fines", active: true },
              { label: "Delete Members", active: false },
              { label: "System Settings", active: false },
            ].map((p) => (
              <div
                key={p.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "var(--surface)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: p.active ? 1 : 0.5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: p.active ? "#34C759" : "var(--muted)",
                    flexShrink: 0,
                  }}
                />
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </ProfileBase>
    </div>
  );
}
