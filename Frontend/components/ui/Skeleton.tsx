"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-[var(--fill)]", className)}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "70%" : "100%"}
          height={14}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      className="card card-body"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="80%" />
      <Skeleton height={14} width="40%" />
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <Skeleton
            width={40}
            height={40}
            radius={10}
            style={{ marginBottom: 12 }}
          />
          <Skeleton width={80} height={28} style={{ marginBottom: 6 }} />
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRows({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <Skeleton
                width={c === 0 ? 140 : c === cols - 1 ? 60 : 100}
                height={14}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonBooksGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="books-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton
            height={160}
            radius={12}
            style={{ borderRadius: "11px 11px 0 0" }}
          />
          <div style={{ padding: 14 }}>
            <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={13} style={{ marginBottom: 10 }} />
            <Skeleton width={60} height={20} radius={20} />
          </div>
        </div>
      ))}
    </div>
  );
}
