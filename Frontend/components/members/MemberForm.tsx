"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { apiCreateMember, apiUpdateMember } from "@/lib/api";
import { Member } from "@/lib/mockData";

interface MemberFormProps {
  member?: Partial<Member>;
  returnPath: string;
  isEdit?: boolean;
}

const EMPTY: Partial<Member> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  membershipType: "standard",
  isActive: true,
};

export default function MemberForm({
  member,
  returnPath,
  isEdit = false,
}: MemberFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [form, setForm] = useState<Partial<Member>>(member ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) setForm(member);
  }, [member]);

  const set = (key: keyof Member, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Full name is required";
    if (!form.email?.trim()) e.email = "Email is required";
    else if (!/@technoindiaeducation\.com$/i.test(form.email))
      e.email = "Email must be a @technoindiaeducation.com address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && member?.id) {
        await apiUpdateMember(member.id, form);
        success("Member updated successfully!");
      } else {
        await apiCreateMember(form);
        success("Member registered successfully!");
      }
      router.push(returnPath);
    } catch {
      error("Failed to save member. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div className="section-label" style={{ marginBottom: 16 }}>
          Personal Information
        </div>

        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            className={`input ${errors.name ? "input-error" : ""}`}
            value={form.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Priya Sharma"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            className={`input ${errors.email ? "input-error" : ""}`}
            type="email"
            value={form.email || ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="priya@technoindiaeducation.com"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="input"
              value={form.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Membership Type</label>
            <select
              className="input select"
              value={form.membershipType || "standard"}
              onChange={(e) => set("membershipType", e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea
            className="input textarea"
            rows={2}
            value={form.address || ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Full address…"
          />
        </div>

        {isEdit && (
          <div className="form-group">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span className="form-label" style={{ margin: 0 }}>
                Active Member
              </span>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (
            <>
              <Loader2 size={15} className="spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={15} /> {isEdit ? "Update Member" : "Register Member"}
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => router.push(returnPath)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
