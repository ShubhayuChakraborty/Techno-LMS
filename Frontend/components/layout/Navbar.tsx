"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X, ChevronDown, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeMediaUrl } from "@/lib/utils";
import { apiGetNotifications, type AppNotification } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
}

interface NavbarProps {
  items: NavItem[];
  basePath: string;
}

export default function Navbar({ items, basePath }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarUrl = normalizeMediaUrl(
    user?.member?.avatarUrl ?? user?.librarian?.avatarUrl ?? "",
  );

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadNotifications = async () => {
      try {
        const data = await apiGetNotifications();
        if (!active) return;
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      } catch {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.id]);

  const navItems = items;

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = user?.email?.split("@")[0].slice(0, 2).toUpperCase() ?? "U";
  const roleBadge =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "librarian"
        ? "Librarian"
        : "Member";

  return (
    <>
      <nav className="navbar">
        {/* Logo + Brand */}
        <Link
          href={`${basePath}/dashboard`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            marginRight: 28,
            flexShrink: 0,
          }}
        >
          <Image
            src="/tiulogo.png"
            alt="Tathagat Logo"
            width={36}
            height={36}
            style={{ borderRadius: "50%", flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "white",
                letterSpacing: "0.2px",
                fontFamily: "var(--font-playfair), Georgia, serif",
              }}
            >
              Techno India
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Library
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "rgba(255,255,255,0.25)",
            marginRight: 20,
            flexShrink: 0,
          }}
        />

        {/* Desktop nav links */}
        <div className="nav-links" style={{ display: "flex" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: user + logout */}
        <div className="nav-right">
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,0.35)",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                position: "relative",
              }}
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: "#FF3B30",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 40,
                  width: 340,
                  maxHeight: 380,
                  overflowY: "auto",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  zIndex: 200,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  Notifications
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: 14,
                      fontSize: 13,
                      color: "var(--muted)",
                    }}
                  >
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.actionUrl}
                      onClick={() => setNotifOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--border)",
                        textDecoration: "none",
                        background: "var(--card)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--heading)",
                          marginBottom: 2,
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {notification.message}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 24,
              padding: "4px 12px 4px 4px",
              cursor: "pointer",
              transition: "background 150ms",
            }}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                color: "#C8102E",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
                {user?.name?.split(" ")[0] ?? user?.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>
                {roleBadge}
              </div>
            </div>
            <ChevronDown
              size={13}
              color="rgba(255,255,255,0.7)"
              style={{ marginLeft: 2 }}
            />
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="logout-btn-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.4)",
              background: "transparent",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 150ms, border-color 150ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
            }}
          >
            <LogOut size={14} />
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="hamburger-btn"
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 270,
              background: "var(--card)",
              boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
              overflowY: "auto",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drawer header */}
            <div
              style={{
                background: "#C8102E",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Image
                src="/tiulogo.png"
                alt="Tathagat Logo"
                width={32}
                height={32}
                style={{ borderRadius: "50%", flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "white",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                  }}
                >
                  Techno India
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Library
                </div>
              </div>
            </div>

            {/* User info */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#C8102E",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--heading)",
                  }}
                >
                  {user?.name ?? user?.email}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}
                >
                  {roleBadge}
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: "8px 0" }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "11px 20px",
                    fontSize: 14,
                    fontWeight: isActive(item.href) ? 600 : 500,
                    color: isActive(item.href) ? "#C8102E" : "var(--body)",
                    textDecoration: "none",
                    background: isActive(item.href)
                      ? "rgba(200,16,46,0.06)"
                      : "transparent",
                    borderLeft: isActive(item.href)
                      ? "3px solid #C8102E"
                      : "3px solid transparent",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  height: 38,
                  borderRadius: 8,
                  border: "1.5px solid #C8102E",
                  background: "transparent",
                  color: "#C8102E",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background-color 150ms, color 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#C8102E";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#C8102E";
                }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hamburger-btn { display: none; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .logout-btn-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
