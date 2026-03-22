import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Utility Functions ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function daysFromNow(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function daysAgo(dateStr: string): number {
  return -daysFromNow(dateStr);
}

export function calcFine(
  dueDateStr: string,
  returnDateStr?: string,
  rate = 5,
): number {
  const dueDate = new Date(dueDateStr);
  const returnDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diff = returnDate.getTime() - dueDate.getTime();
  const overdueDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return overdueDays * rate;
}

export function getOverdueDays(
  dueDateStr: string,
  returnDateStr?: string,
): number {
  const dueDate = new Date(dueDateStr);
  const returnDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diff = returnDate.getTime() - dueDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getAvatarColor(name: string): string {
  const colors = [
    "avatar-blue",
    "avatar-amber",
    "avatar-green",
    "avatar-purple",
    "avatar-pink",
    "avatar-teal",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function getBookCoverClass(id: number | string): string {
  const n = typeof id === "string" ? id.charCodeAt(0) : id;
  return `cover-${(n % 6) + 1}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function validateISBN(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, "");
  return clean.length === 10 || clean.length === 13;
}

export function greetingTime(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function todayString(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function dueDateFromNow(days = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function progressColor(daysLeft: number): string {
  if (daysLeft < 0) return "progress-red";
  if (daysLeft <= 3) return "progress-red";
  if (daysLeft <= 7) return "progress-amber";
  return "progress-green";
}

export function borrowStatusBadge(daysLeft: number): {
  cls: string;
  label: string;
} {
  if (daysLeft < 0) return { cls: "badge-danger", label: "Overdue" };
  if (daysLeft === 0) return { cls: "badge-warning", label: "Due Today" };
  if (daysLeft <= 3)
    return { cls: "badge-warning", label: `Due in ${daysLeft}d` };
  return { cls: "badge-success", label: "Active" };
}

export function memberStatusBadge(
  expiry: string,
  isActive: boolean,
): { cls: string; label: string } {
  if (!isActive) return { cls: "badge-muted", label: "Deactivated" };
  const daysLeft = daysFromNow(expiry);
  if (daysLeft < 0) return { cls: "badge-danger", label: "Expired" };
  if (daysLeft <= 30) return { cls: "badge-warning", label: "Expiring Soon" };
  return { cls: "badge-success", label: "Active" };
}

export function paginate<T>(
  items: T[],
  page: number,
  perPage = 20,
): { items: T[]; total: number; pages: number } {
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total: items.length,
    pages: Math.ceil(items.length / perPage),
  };
}
