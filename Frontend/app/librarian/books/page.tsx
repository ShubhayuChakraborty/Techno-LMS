"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, LayoutGrid, List, BookOpen } from "lucide-react";
import { apiGetBooks } from "@/lib/api";
import { Book, CATEGORIES } from "@/lib/mockData";
import BookCard from "@/components/books/BookCard";
import { SkeletonBooksGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { useFetch } from "@/lib/useFetch";

const PER_PAGE = 12;

export default function LibrarianBooksPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
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
    return b;
  }, [books, search, category]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Books Catalog</h1>
          <p className="page-subtitle">{filtered.length} books</p>
        </div>
        <Link href="/librarian/books/new" className="btn btn-primary">
          <Plus size={16} /> Add Book
        </Link>
      </div>
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search books…"
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
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 4,
            background: "var(--fill)",
            borderRadius: 8,
            padding: 3,
          }}
        >
          <button
            className={`view-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`view-btn ${view === "list" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      {loading ? (
        <SkeletonBooksGrid />
      ) : paged.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} color="var(--muted)" />}
          title="No books"
          description="Try adjusting search"
          action={
            <Link href="/librarian/books/new" className="btn btn-primary">
              Add Book
            </Link>
          }
        />
      ) : view === "grid" ? (
        <div className="books-grid">
          {paged.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              href={`/librarian/books/${b.id}`}
              showEdit
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div
            className="table-container"
            style={{ border: "none", borderRadius: 0 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Category</th>
                  <th>Copies</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.author}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted">{b.category}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.totalCopies}</td>
                    <td
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          b.availableCopies > 0
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      {b.availableCopies}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link
                          href={`/librarian/books/${b.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/librarian/books/${b.id}/edit`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
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
    </div>
  );
}
