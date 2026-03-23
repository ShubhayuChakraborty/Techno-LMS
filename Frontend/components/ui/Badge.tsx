import React from "react";
import { Star } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { borrowStatusBadge, memberStatusBadge, daysFromNow } from "@/lib/utils";

// ─── CVA Badge (shadcn-style) ───────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-white",
        secondary: "border-transparent bg-[var(--fill)] text-[var(--body)]",
        destructive:
          "border-transparent bg-[var(--danger-light)] text-[var(--danger)]",
        outline: "border-[var(--border)] text-[var(--body)] bg-transparent",
        success:
          "border-transparent bg-[var(--success-light)] text-[var(--success)]",
        warning:
          "border-transparent bg-[var(--warning-light)] text-[var(--warning)]",
        // legacy variant aliases
        danger:
          "border-transparent bg-[var(--danger-light)] text-[var(--danger)]",
        muted: "border-transparent bg-[var(--fill)] text-[var(--muted)]",
        blue: "border-transparent bg-[var(--primary-light)] text-[var(--primary)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label?: string;
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({
  variant,
  label,
  dot = true,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      )}
      {label ?? children}
    </span>
  );
}

export { badgeVariants };

// ─── Borrow Status Badge ───────────────────────────────────────────────────

export function BorrowStatusBadge({
  dueDate,
  returnedAt,
}: {
  dueDate: string;
  returnedAt?: string;
}) {
  if (returnedAt) return <Badge variant="muted" label="Returned" dot />;
  const days = daysFromNow(dueDate);
  const { cls, label } = borrowStatusBadge(days);
  const variant = cls.replace("badge-", "") as BadgeProps["variant"];
  return <Badge variant={variant} label={label} dot />;
}

// ─── Member Status Badge ───────────────────────────────────────────────────

export function MemberStatusBadge({
  expiryDate,
  isActive,
}: {
  expiryDate?: string;
  isActive: boolean;
}) {
  const exp = expiryDate ?? "2099-12-31T00:00:00.000Z";
  const { cls, label } = memberStatusBadge(exp, isActive);
  const variant = cls.replace("badge-", "") as BadgeProps["variant"];
  return <Badge variant={variant} label={label} dot />;
}

// ─── Fine Status Badge ─────────────────────────────────────────────────────

export function FineStatusBadge({
  isPaid,
  status,
}: {
  isPaid?: boolean;
  status?: string;
}) {
  if (status === "waived") {
    return <Badge variant="warning" label="Waived" dot />;
  }

  const paid = isPaid || status === "paid";
  if (paid) {
    return <Badge variant="success" label="Paid" dot />;
  }

  return <Badge variant="danger" label="Pending" dot />;
}

// ─── Availability Badge ────────────────────────────────────────────────────

export function AvailabilityBadge({ available }: { available: number }) {
  return available > 0 ? (
    <Badge variant="success" label="Available" dot />
  ) : (
    <Badge variant="danger" label="Unavailable" dot />
  );
}

// ─── Category Chip ─────────────────────────────────────────────────────────

export function CategoryChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: "rgba(29,127,236,0.1)",
        color: "var(--primary)",
      }}
    >
      {label}
    </span>
  );
}

// ─── Star Rating ───────────────────────────────────────────────────────────

export function StarRating({
  rating,
  size = 14,
  reviewCount,
}: {
  rating: number;
  size?: number;
  reviewCount?: number;
}) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const filled = Math.floor(safeRating);
  const empty = 5 - filled;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: size,
      }}
    >
      {Array.from({ length: filled }).map((_, index) => (
        <Star
          key={`filled-${index}`}
          size={size - 1}
          fill="currentColor"
          strokeWidth={1.8}
        />
      ))}
      {Array.from({ length: empty }).map((_, index) => (
        <Star
          key={`empty-${index}`}
          size={size - 1}
          strokeWidth={1.8}
          style={{ opacity: 0.3 }}
        />
      ))}
      <span
        style={{ fontSize: size - 2, color: "var(--body)", fontWeight: 500 }}
      >
        {safeRating.toFixed(1)}
      </span>
      {reviewCount != null && (
        <span style={{ fontSize: size - 2, color: "var(--muted)" }}>
          ({reviewCount})
        </span>
      )}
    </span>
  );
}
