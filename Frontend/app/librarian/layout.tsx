"use client";

import Navbar from "@/components/layout/Navbar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useRequireAuth } from "@/contexts/AuthContext";

const LIBRARIAN_NAV = [
  { href: "/librarian/dashboard", label: "Dashboard" },
  { href: "/librarian/books", label: "Books" },
  { href: "/librarian/members", label: "Members" },
  { href: "/librarian/borrow", label: "Borrow & Return" },
  { href: "/librarian/fines", label: "Fines" },
  { href: "/librarian/profile", label: "Profile" },
];

export default function LibrarianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth("librarian");
  if (loading) return <LoadingScreen />;
  return (
    <>
      <Navbar items={LIBRARIAN_NAV} basePath="/librarian" />
      <main>{children}</main>
      <ThemeToggle />
    </>
  );
}
