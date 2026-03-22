"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import ProfileBase from "@/components/profile/ProfileBase";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetAdminProfile } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

const DEFAULT_PRIVILEGES = [
  "Manage Members",
  "Manage Books",
  "Manage Borrows",
  "Manage Fines",
  "View Reports",
  "System Settings",
];

export default function AdminProfilePage() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Library Administration");
  const [privileges, setPrivileges] = useState(DEFAULT_PRIVILEGES);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    let active = true;
    (async () => {
      try {
        const profile = await apiGetAdminProfile();
        if (!active) return;

        setPhone(profile.phone ?? "");
        setDepartment(profile.department ?? "Library Administration");
        setPrivileges(
          profile.privileges?.length ? profile.privileges : DEFAULT_PRIVILEGES,
        );
      } catch {
        if (!active) return;
        toastError("Unable to load admin profile details");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, toastError]);

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your admin account details and security
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(29,127,236,0.1)",
            color: "var(--primary)",
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={16} />
          Administrator
        </div>
      </div>

      <ProfileBase
        extraInfoRows={[
          { label: "Phone", value: phone },
          { label: "Department", value: department },
          { label: "Role", value: "Administrator" },
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
        ]}
      >
        {/* Admin-specific info */}
        <div className="card" style={{ padding: 24, marginTop: 20 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "var(--heading)",
              marginBottom: 16,
            }}
          >
            Admin Privileges
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            {privileges.map((label) => (
              <div
                key={label}
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
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#34C759",
                    flexShrink: 0,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </ProfileBase>
    </div>
  );
}
