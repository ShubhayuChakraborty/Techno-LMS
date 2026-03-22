"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MemberForm from "@/components/members/MemberForm";

export default function NewMemberPage() {
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
            <ArrowLeft size={14} /> Back to Members
          </Link>
          <h1 className="page-title">Register New Member</h1>
          <p className="page-subtitle">Add a new member to the library</p>
        </div>
      </div>
      <MemberForm returnPath="/admin/members" />
    </div>
  );
}
