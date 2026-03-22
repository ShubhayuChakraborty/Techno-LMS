"use client";

import Navbar from "@/components/layout/Navbar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useRequireAuth } from "@/contexts/AuthContext";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/librarians", label: "Librarians" },
  { href: "/admin/borrow", label: "Borrow" },
  { href: "/admin/fines", label: "Fines" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/recommendations", label: "Recs" },
  { href: "/admin/profile", label: "Profile" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth("admin");
  if (loading) return <LoadingScreen />;
  return (
    <>
      <Navbar items={ADMIN_NAV} basePath="/admin" />
      <main>{children}</main>
      <ThemeToggle />
    </>
  );
}
