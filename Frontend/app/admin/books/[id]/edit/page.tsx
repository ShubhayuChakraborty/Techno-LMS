"use client";

import React from "react";
import BookForm from "@/components/books/BookForm";
import { apiGetBook } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";

export default function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: book, loading } = useFetch(() => apiGetBook(id), [id]);

  return (
    <BookForm
      book={loading ? undefined : (book ?? undefined)}
      returnPath={`/admin/books/${id}`}
      isEdit
    />
  );
}
