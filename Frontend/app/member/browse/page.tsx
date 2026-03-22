"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen } from "lucide-react";
import { apiGetBooks } from "@/lib/api";
import { Book, CATEGORIES } from "@/lib/mockData";
import BookCard from "@/components/books/BookCard";
import { SkeletonBooksGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import BorrowCodeModal from "@/components/borrow/BorrowCodeModal";
import { useFetch } from "@/lib/useFetch";

const PER_PAGE = 12;

export default function MemberBrowsePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState<"all" | "available">("all");
  const [page, setPage] = useState(1);
  const [borrowBook, setBorrowBook] = useState<Book | null>(null);
  const { data: books = [], loading } = useFetch<Book[]>(
    () => apiGetBooks({ limit: 1000 }).then((r) => r.books),
    [],
  );

  const filtered = useMemo(() => {
    let b = books;
    if (search)
      b = b.filter(
        (bk) =>
          bk.title.toLowerCase().includes(search.toLowerCase()) ||
          bk.author.toLowerCase().includes(search.toLowerCase()),
      );
    if (category) b = b.filter((bk) => bk.category === category);
    if (availability === "available")
      b = b.filter((bk) => bk.availableCopies > 0);
    return b;
  }, [books, search, category, availability]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Books</h1>
          <p className="page-subtitle">{filtered.length} books available</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input select"
          style={{ width: 180 }}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="filter-tabs" style={{ margin: 0 }}>
          {(
            [
              ["all", "All"],
              ["available", "Available Only"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab ${availability === v ? "active" : ""}`}
              onClick={() => {
                setAvailability(v);
                setPage(1);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonBooksGrid />
      ) : paged.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} color="var(--muted)" />}
          title="No books found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="books-grid">
          {paged.map((b) => {
            return (
              <BookCard
                key={b.id}
                book={b}
                href={`/member/browse/${b.id}`}
                showBorrow={b.availableCopies > 0}
                onBorrow={() => setBorrowBook(b)}
              />
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={PER_PAGE}
        onPage={setPage}
      />

      <BorrowCodeModal
        open={!!borrowBook}
        book={borrowBook}
        onClose={() => setBorrowBook(null)}
      />
    </div>
  );
}
