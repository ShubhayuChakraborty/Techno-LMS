"use client";

import Navbar from "@/components/layout/Navbar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useRequireAuth } from "@/contexts/AuthContext";

const MEMBER_NAV = [
  { href: "/member/browse", label: "Browse Books" },
  { href: "/member/borrows", label: "My Borrows" },
  { href: "/member/fines", label: "My Fines" },
  { href: "/member/recommendations", label: "Recommendations" },
  { href: "/member/profile", label: "Profile" },
];

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth("member");
  if (loading) return <LoadingScreen />;
  return (
    <>
      <Navbar items={MEMBER_NAV} basePath="/member" />
      <main>{children}</main>
      <ThemeToggle />
    </>
  );
}
