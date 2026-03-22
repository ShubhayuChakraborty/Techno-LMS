"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  function getPages(): (number | "...")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total} results
      </span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          style={{ display: "flex", gap: 4 }}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span
              key={`dot-${i}`}
              style={{ padding: "0 4px", color: "var(--muted)" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === page ? "active" : ""}`}
              onClick={() => onPage(p as number)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          style={{ display: "flex", gap: 4 }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
