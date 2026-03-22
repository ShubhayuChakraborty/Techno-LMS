// ─── API Layer ─────────────────────────────────────────────────────────────
import axios, { AxiosError } from "axios";
import {
  MOCK_MEMBERS,
  MOCK_BORROWS,
  MOCK_FINES,
  MOCK_RECOMMENDATIONS,
  type Book,
  type Member,
  type BorrowRecord,
  type Fine,
  type Recommendation,
  type User,
} from "./mockData";

// Backend runs on port 4000; set NEXT_PUBLIC_API_URL to override in production
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// ──────────────────────────────────────────────────────────────────────────────
// In-memory access-token store
// Storing in memory (not localStorage) prevents XSS attacks from stealing
// the access token. The refresh token lives in an HTTP-only cookie.
// ──────────────────────────────────────────────────────────────────────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

// ──────────────────────────────────────────────────────────────────────────────
// Axios instance
// withCredentials: true is required so the browser sends the HTTP-only
// refreshToken cookie on every request to the same origin.
// ──────────────────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  withCredentials: true, // send/receive cookies cross-origin
});

// Longer timeout for AI generation endpoints (Gemini can take 30-60s)
const aiApi = axios.create({
  baseURL: BASE,
  timeout: 90000,
  withCredentials: true,
});

// ── Request interceptor: attach Bearer access token ──────────────────────────
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

aiApi.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor: automatic token refresh on 401 ─────────────────────
// Handles the common pattern where the access token has expired mid-session.
// Multiple concurrent 401s are resolved with a single refresh call.
let _isRefreshing = false;
let _refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
  timerId: ReturnType<typeof setTimeout>;
}> = [];

function processRefreshQueue(token: string) {
  _refreshQueue.forEach(({ resolve, timerId }) => {
    clearTimeout(timerId);
    resolve(token);
  });
  _refreshQueue = [];
}

function rejectRefreshQueue(err: unknown) {
  _refreshQueue.forEach(({ reject, timerId }) => {
    clearTimeout(timerId);
    reject(err);
  });
  _refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      // Avoid retrying the refresh call itself
      if (original.url === "/auth/refresh") {
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        // Queue this request — it will be retried once the refresh completes
        return new Promise((resolve, reject) => {
          const timerId = setTimeout(() => reject(error), 30000);
          _refreshQueue.push({
            timerId,
            resolve: (token) => {
              original.headers = original.headers ?? {};
              original.headers.Authorization = `Bearer ${token}`;
              original._retry = true;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh");
        const { accessToken } = res.data.data as { accessToken: string };
        setAccessToken(accessToken);
        processRefreshQueue(accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        rejectRefreshQueue(refreshError);
        setAccessToken(null);
        // Signal the AuthContext to clear user state and redirect to login
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:session-expired"));
        }
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Give aiApi the same 401 auto-refresh behaviour
aiApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const res = await api.post("/auth/refresh");
        const { accessToken } = res.data.data as { accessToken: string };
        setAccessToken(accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return aiApi(original);
      } catch {
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:session-expired"));
        }
      }
    }
    return Promise.reject(error);
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// Auth
// No mock fallbacks here — auth must always call the real backend.
// ──────────────────────────────────────────────────────────────────────────────

export async function apiLogin(
  email: string,
  password: string,
  _role?: string, // role is determined server-side; parameter kept for backwards compat
): Promise<User> {
  try {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user } = res.data.data as {
      accessToken: string;
      user: User;
    };
    setAccessToken(accessToken);
    return user;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        throw new Error("Incorrect email or password");
      }

      const serverMessage =
        (err.response?.data as { message?: string; error?: string } | undefined)
          ?.message ??
        (err.response?.data as { message?: string; error?: string } | undefined)
          ?.error;

      if (serverMessage) {
        throw new Error(serverMessage);
      }
    }

    throw err instanceof Error
      ? err
      : new Error("Login failed. Please try again.");
  }
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<User> {
  const res = await api.post("/auth/register", data);
  // Registration does not issue tokens — user must log in after registering
  return res.data.data as User;
}

export async function apiMe(): Promise<User | null> {
  try {
    const res = await api.get("/auth/me");
    return res.data.data as User;
  } catch {
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    /* cookie cleared server-side; ignore network errors */
  }
  setAccessToken(null);
}

export async function apiChangePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put("/auth/change-password", data);
  // After password change all sessions are revoked — clear local token
  setAccessToken(null);
}

export async function apiUpdateProfile(
  data: Partial<{
    name: string;
    phone: string;
    address: string;
    department: string;
    avatarColor: string;
    avatarUrl: string;
  }>,
): Promise<User> {
  const res = await api.patch("/auth/profile", data);
  return res.data.data as User;
}

export async function apiUploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post("/upload/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (res.data.data as { url: string }).url;
}

export interface AdminProfile {
  id: string | null;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  department: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  role: "admin";
  privileges: string[];
  createdAt: string;
  updatedAt: string;
}

export async function apiGetAdminProfile(): Promise<AdminProfile> {
  const res = await api.get("/admin/profile");
  return res.data.data as AdminProfile;
}

// OTP-based registration
export async function apiSendRegistrationOtp(
  email: string,
  name: string,
): Promise<void> {
  await api.post("/auth/send-registration-otp", { email, name });
}

export async function apiVerifyAndRegister(data: {
  email: string;
  otp: string;
  name: string;
  password: string;
}): Promise<User> {
  const res = await api.post("/auth/verify-and-register", data);
  return res.data.data as User;
}

// Forgot / reset password
export async function apiForgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function apiResetPassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  await api.post("/auth/reset-password", { email, otp, newPassword });
}

// Admin: register a librarian account
export async function apiRegisterLibrarian(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await api.post("/auth/register-librarian", data);
  return res.data.data as User;
}

export interface LibrarianProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetLibrarians(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ librarians: LibrarianProfile[]; total: number }> {
  const res = await api.get("/librarian", { params });
  const data = res.data.data ?? res.data;
  return {
    librarians: (data.librarians ?? []) as LibrarianProfile[],
    total: Number(data.total ?? 0),
  };
}

// Google OAuth
export async function apiGoogleAuth(idToken: string): Promise<User> {
  const res = await api.post("/auth/google", { idToken });
  const { accessToken, user } = res.data.data as {
    accessToken: string;
    user: User;
  };
  setAccessToken(accessToken);
  return user;
}

// ──────────────────────────────────────────────────────────────────────────────
// Books  (mock fallback for offline/dev use)
// ──────────────────────────────────────────────────────────────────────────────

export async function apiGetBooks(params?: {
  search?: string;
  category?: string;
  availability?: string;
  page?: number;
  limit?: number;
}): Promise<{ books: Book[]; total: number }> {
  const res = await api.get("/books", { params });
  return res.data.data ?? res.data;
}

export async function apiGetBook(id: string): Promise<Book> {
  const res = await api.get(`/books/${id}`);
  return res.data.data ?? res.data;
}

export async function apiCreateBook(data: Partial<Book>): Promise<Book> {
  const res = await api.post("/books", data);
  return res.data.data ?? res.data;
}

export async function apiUpdateBook(
  id: string,
  data: Partial<Book>,
): Promise<Book> {
  const res = await api.put(`/books/${id}`, data);
  return res.data.data ?? res.data;
}

export async function apiDeleteBook(id: string): Promise<void> {
  await api.delete(`/books/${id}`);
}

export async function apiSearchBooks(q: string): Promise<Book[]> {
  const res = await api.get("/books/search", { params: { q } });
  return res.data.data ?? res.data;
}

export async function apiUploadBookCover(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("cover", file);
  const res = await api.post("/upload/book-cover", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (res.data.data as { url: string }).url;
}

// ──────────────────────────────────────────────────────────────────────────────
// Reviews
// ──────────────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: { name: string; avatarColor?: string | null; membershipNo: string };
}

export async function apiGetBookReviews(
  bookId: string,
  params?: { page?: number; limit?: number },
): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
  const res = await api.get(`/books/${bookId}/reviews`, { params });
  return res.data.data ?? res.data;
}

export async function apiGetMyReview(bookId: string): Promise<Review | null> {
  const res = await api.get(`/books/${bookId}/reviews/mine`);
  return res.data.data ?? null;
}

export async function apiUpsertReview(
  bookId: string,
  data: { rating: number; comment?: string },
): Promise<Review> {
  const res = await api.post(`/books/${bookId}/reviews`, data);
  return res.data.data ?? res.data;
}

export async function apiDeleteReview(bookId: string): Promise<void> {
  await api.delete(`/books/${bookId}/reviews`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Members
// ──────────────────────────────────────────────────────────────────────────────

export async function apiGetMembers(params?: {
  search?: string;
  status?: string;
  page?: number;
}): Promise<{ members: Member[]; total: number }> {
  try {
    const res = await api.get("/members", { params });
    return res.data.data ?? res.data;
  } catch {
    let members = [...MOCK_MEMBERS];
    if (params?.search) {
      const q = params.search.toLowerCase();
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.membershipNo.toLowerCase().includes(q),
      );
    }
    if (params?.status === "active")
      members = members.filter((m) => m.isActive);
    if (params?.status === "inactive")
      members = members.filter((m) => !m.isActive);
    return { members, total: members.length };
  }
}

export async function apiGetMember(id: string): Promise<Member> {
  try {
    const res = await api.get(`/members/${id}`);
    return res.data.data ?? res.data;
  } catch {
    const m = MOCK_MEMBERS.find((m) => m.id === id);
    if (!m) throw new Error("Member not found");
    return m;
  }
}

export async function apiCreateMember(data: Partial<Member>): Promise<Member> {
  try {
    const res = await api.post("/members", data);
    return res.data.data ?? res.data;
  } catch {
    const no = `LIB-${String(MOCK_MEMBERS.length + 42).padStart(6, "0")}`;
    const member: Member = {
      id: `m${Date.now()}`,
      membershipNo: no,
      activeBorrows: 0,
      unpaidFines: 0,
      totalBorrows: 0,
      joinedAt: new Date().toISOString().split("T")[0],
      isActive: true,
      userId: "",
      ...data,
    } as Member;
    MOCK_MEMBERS.push(member);
    return member;
  }
}

export async function apiUpdateMember(
  id: string,
  data: Partial<Member>,
): Promise<Member> {
  try {
    const res = await api.put(`/members/${id}`, data);
    return res.data.data ?? res.data;
  } catch {
    const idx = MOCK_MEMBERS.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Member not found");
    MOCK_MEMBERS[idx] = { ...MOCK_MEMBERS[idx], ...data };
    return MOCK_MEMBERS[idx];
  }
}

export async function apiDeleteMember(id: string): Promise<void> {
  try {
    await api.delete(`/members/${id}`);
  } catch {
    const idx = MOCK_MEMBERS.findIndex((m) => m.id === id);
    if (idx !== -1) MOCK_MEMBERS.splice(idx, 1);
  }
}

export async function apiToggleMemberActive(id: string): Promise<Member> {
  try {
    const res = await api.patch(`/members/${id}/toggle-active`);
    return res.data.data ?? res.data;
  } catch {
    const idx = MOCK_MEMBERS.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Member not found");
    MOCK_MEMBERS[idx] = {
      ...MOCK_MEMBERS[idx],
      isActive: !MOCK_MEMBERS[idx].isActive,
    };
    return MOCK_MEMBERS[idx];
  }
}

export async function apiSearchMembers(q: string): Promise<Member[]> {
  try {
    const res = await api.get("/members", { params: { search: q, limit: 8 } });
    const data = res.data.data ?? res.data;
    return data.members ?? data;
  } catch {
    const query = q.toLowerCase();
    return MOCK_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.membershipNo.toLowerCase().includes(query),
    ).slice(0, 8);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Borrows
// ──────────────────────────────────────────────────────────────────────────────

// Normalize the nested DB shape (borrows table) → flat BorrowRecord used by the UI
function normalizeBorrowRecord(r: Record<string, unknown>): BorrowRecord {
  // borrows table: user { member { id, name, membershipNo } } + book + fine
  const user = r.user as {
    name?: string;
    member?: {
      id?: string;
      name?: string;
      membershipNo?: string;
      avatarUrl?: string;
      avatarColor?: string;
    };
  } | null;
  const book = r.book as {
    id?: string;
    title?: string;
    author?: string;
    coverUrl?: string;
  } | null;
  const fine = r.fine as { amount?: number; status?: string } | null;

  // Compute status from returned flag + dueDate
  const returned = Boolean(r.returned);
  const computedStatus: BorrowRecord["status"] = returned
    ? "returned"
    : new Date(r.dueDate as string) < new Date()
      ? "overdue"
      : "active";

  return {
    id: r.id as string,
    memberId: (user?.member?.id ?? r.memberId ?? "") as string,
    memberName:
      user?.member?.name ?? user?.name ?? (r.memberName as string) ?? "",
    membershipNo:
      user?.member?.membershipNo ?? (r.membershipNo as string) ?? "",
    memberAvatarUrl:
      user?.member?.avatarUrl ?? (r.memberAvatarUrl as string | undefined),
    memberAvatarColor:
      user?.member?.avatarColor ?? (r.memberAvatarColor as string | undefined),
    bookId: (book?.id ?? r.bookId) as string,
    bookTitle: book?.title ?? (r.bookTitle as string) ?? "",
    bookAuthor: book?.author ?? (r.bookAuthor as string) ?? "",
    bookCoverUrl: book?.coverUrl ?? (r.bookCoverUrl as string | undefined),
    issuedAt: (r.borrowDate ?? r.issuedAt) as string,
    dueDate: r.dueDate as string,
    returnedAt: (r.returnedAt as string | undefined) ?? undefined,
    status: (r.status as BorrowRecord["status"]) ?? computedStatus,
    extendedOnce: Boolean(r.extendedOnce),
    fine: fine?.amount,
    finePaid: fine?.status === "paid",
  };
}

export async function apiGetActiveBorrows(): Promise<BorrowRecord[]> {
  const res = await api.get("/borrows", {
    params: { status: "active", limit: 200 },
  });
  const records: unknown[] = res.data.data?.records ?? res.data.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeBorrowRecord);
}

export async function apiGetOverdueBorrows(): Promise<BorrowRecord[]> {
  const res = await api.get("/borrows/overdue");
  const records: unknown[] = res.data.data ?? res.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeBorrowRecord);
}

export async function apiGetBorrowHistory(): Promise<BorrowRecord[]> {
  const res = await api.get("/borrows", {
    params: { status: "returned", limit: 200 },
  });
  const records: unknown[] = res.data.data?.records ?? res.data.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeBorrowRecord);
}

export async function apiGetMemberBorrows(
  memberId: string,
): Promise<BorrowRecord[]> {
  const res = await api.get(`/members/${memberId}/borrows`, {
    params: { limit: 200 },
  });
  const records: unknown[] = res.data.data?.records ?? res.data.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeBorrowRecord);
}

// ─── Borrow Code System (member-initiated) ────────────────────────────────────

export async function apiRequestBorrow(bookId: string): Promise<{
  code: string;
  expiresAt: string;
}> {
  const res = await api.post("/borrow/request", { bookId });
  return res.data.data as { code: string; expiresAt: string };
}

export async function apiGetBorrowRequest(code: string): Promise<{
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  member: { name: string; membershipNo: string | null };
  book: { id: string; title: string; author: string };
}> {
  const res = await api.get(`/borrow/request/${code}`);
  return res.data.data;
}

export async function apiConfirmBorrow(data: {
  code: string;
  borrowDays: number;
}): Promise<{ borrowId: string; dueDate: string }> {
  const res = await api.post("/borrow/confirm", data);
  return res.data.data;
}

export async function apiReturnBorrowCode(borrowId: string): Promise<void> {
  await api.post("/borrow/return", { borrowId });
}

export async function apiIssueBorrow(data: {
  memberId: string;
  bookId: string;
  borrowDays?: number;
}): Promise<BorrowRecord> {
  const res = await api.post("/borrows/issue", {
    memberId: data.memberId,
    bookId: data.bookId,
    borrowDays: data.borrowDays ?? 14,
  });
  return normalizeBorrowRecord(res.data.data as Record<string, unknown>);
}

export async function apiReturnBook(
  borrowId: string,
): Promise<{ record: BorrowRecord; fine: number }> {
  const res = await api.patch(`/borrows/${borrowId}/return`);
  const d = res.data.data as { fineAmount?: number };
  return { record: {} as BorrowRecord, fine: d?.fineAmount ?? 0 };
}

export async function apiExtendBorrow(borrowId: string): Promise<BorrowRecord> {
  const res = await api.patch(`/borrows/${borrowId}/extend`);
  return normalizeBorrowRecord(res.data.data as Record<string, unknown>);
}

// ──────────────────────────────────────────────────────────────────────────────
// Fines
// ──────────────────────────────────────────────────────────────────────────────

function normalizeFine(r: Record<string, unknown>): Fine {
  const borrow = r.borrow as {
    id?: string;
    dueDate?: string;
    returnedAt?: string;
    book?: { id?: string; title?: string; author?: string };
  } | null;
  const member = r.member as {
    id?: string;
    name?: string;
    membershipNo?: string;
  } | null;

  const dueDate = borrow?.dueDate ? new Date(borrow.dueDate) : null;
  const returnedAt = borrow?.returnedAt ? new Date(borrow.returnedAt) : null;
  const refDate = returnedAt ?? new Date();
  const overdueDays =
    dueDate && refDate > dueDate
      ? Math.ceil((refDate.getTime() - dueDate.getTime()) / 86400000)
      : 0;

  return {
    id: r.id as string,
    borrowId: (r.borrowId ?? borrow?.id ?? "") as string,
    memberId: (r.memberId ?? member?.id ?? "") as string,
    memberName: (member?.name ?? r.memberName ?? "") as string,
    membershipNo: (member?.membershipNo ?? r.membershipNo ?? "") as string,
    bookTitle: (borrow?.book?.title ?? r.bookTitle ?? "Unknown Book") as string,
    overdueDays: (r.overdueDays as number | undefined) ?? overdueDays,
    amount: Number(r.amount ?? 0),
    isPaid: Boolean(r.isPaid),
    status:
      ((r.status === "unpaid" ? "pending" : r.status) as Fine["status"]) ??
      (r.isPaid ? "paid" : "pending"),
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
    paidAt: (r.paidAt as string | undefined) ?? undefined,
  };
}

export async function apiGetFines(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  memberId?: string;
}): Promise<Fine[]> {
  const res = await api.get("/fines", {
    params: {
      limit: params?.limit ?? 200,
      page: params?.page ?? 1,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.memberId ? { memberId: params.memberId } : {}),
    },
  });
  const records: unknown[] =
    res.data.data?.fines ?? res.data.data ?? res.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeFine);
}

export async function apiGetMyFines(memberId: string): Promise<Fine[]> {
  const res = await api.get("/fines/my");
  const records: unknown[] =
    res.data.data?.fines ?? res.data.data ?? res.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeFine);
}

export async function apiMarkFinePaid(fineId: string): Promise<Fine> {
  const res = await api.patch(`/fines/${fineId}/pay`);
  const raw = res.data.data ?? res.data;
  return normalizeFine(raw as Record<string, unknown>);
}

export async function apiWaiveFine(fineId: string): Promise<Fine> {
  const res = await api.patch(`/fines/${fineId}/waive`);
  const raw = res.data.data ?? res.data;
  return normalizeFine(raw as Record<string, unknown>);
}

export async function apiPayAllMyFines(
  memberId: string,
): Promise<{ paidCount: number; totalAmount: number }> {
  const res = await api.post(`/fines/pay-all/${memberId}`);
  return res.data.data as { paidCount: number; totalAmount: number };
}

// ──────────────────────────────────────────────────────────────────────────────
// Recommendations
// ──────────────────────────────────────────────────────────────────────────────

export async function apiGetRecommendations(
  memberId: string,
): Promise<Recommendation[]> {
  try {
    const res = await api.get(`/recommendations/${memberId}`);
    return res.data.data ?? res.data;
  } catch {
    return MOCK_RECOMMENDATIONS;
  }
}

export async function apiGetPopularBooks(): Promise<Book[]> {
  try {
    const res = await api.get("/recommendations/popular");
    return res.data.data ?? res.data;
  } catch {
    return [];
  }
}

export async function apiRateBook(data: {
  bookId: string;
  rating: number;
}): Promise<void> {
  try {
    await api.post("/recommendations/rate", data);
  } catch {
    /* mock: ignore */
  }
}

// ─── AI Recommendation Endpoints ─────────────────────────────────────────────

export interface AIRecsStats {
  totalRecommendations: number;
  membersWithRecommendations: number;
  averageScore: number;
  trendingBooks: Array<{
    id: string;
    title: string;
    author: string;
    category: string;
    rating: string | number;
    coverUrl?: string;
    borrows: number;
  }>;
  trendingInsight: string;
}

export interface AIRecommendation {
  id: string;
  score: number;
  strategy: string;
  reason?: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    category: string;
    rating: string | number;
    availableCopies: number;
  };
  member: {
    id: string;
    name: string;
    membershipNo: string;
  };
}

export async function apiGetAIStats(): Promise<AIRecsStats | null> {
  try {
    const res = await api.get("/recommendations/ai/stats");
    return res.data.data ?? res.data;
  } catch {
    return null;
  }
}

export async function apiGetAllRecommendations(params?: {
  memberId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  recommendations: AIRecommendation[];
  total: number;
  totalPages: number;
}> {
  try {
    const res = await api.get("/recommendations", { params });
    return res.data.data ?? res.data;
  } catch {
    return { recommendations: [], total: 0, totalPages: 0 };
  }
}

export async function apiGenerateAIForMember(
  memberId: string,
  count = 5,
): Promise<{
  recommendations: AIRecommendation[];
  member: { id: string; name: string };
}> {
  const res = await aiApi.post(
    `/recommendations/ai/generate/${memberId}?count=${count}`,
  );
  return res.data.data ?? res.data;
}

export async function apiGenerateAIForAll(countPerMember = 3): Promise<{
  results: Array<{
    memberId: string;
    name: string;
    count?: number;
    error?: string;
  }>;
  total: number;
}> {
  const res = await aiApi.post(
    `/recommendations/ai/generate-all?count=${countPerMember}`,
  );
  return res.data.data ?? res.data;
}

export interface TrendingBook {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: string | number;
  coverUrl?: string;
  availableCopies: number;
  description?: string;
  borrows: number;
}

export interface MyRecommendationsData {
  recommendations: AIRecommendation[];
  trending: TrendingBook[];
  member: { id: string; name: string };
}

export async function apiGetMyRecommendations(): Promise<MyRecommendationsData | null> {
  try {
    const res = await aiApi.get("/recommendations/me");
    return res.data.data ?? res.data;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────────────────────────────────────

export async function apiGetReports() {
  try {
    const res = await api.get("/reports/dashboard");
    return res.data.data ?? res.data;
  } catch {
    return {
      totalBooks: 342,
      totalBorrows: 1247,
      finesCollected: 4200,
      overdueMembers: 12,
    };
  }
}

export interface ReportsSummary {
  totalBooks: number;
  totalMembers: number;
  activeMembers: number;
  activeBorrows: number;
  overdueBorrows: number;
  returnsToday: number;
  pendingFines: number;
  collectedFines: number;
}

export async function apiGetReportsSummary(): Promise<ReportsSummary> {
  const res = await api.get("/reports/summary");
  return res.data.data as ReportsSummary;
}

export interface MonthlyBorrowData {
  month: string; // short month name e.g. "Apr"
  borrows: number;
  returns: number;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function apiGetMonthlyBorrows(): Promise<MonthlyBorrowData[]> {
  const res = await api.get("/reports/monthly-borrows");
  const raw: Array<{ month: string; borrows: number; returns: number }> =
    res.data.data ?? [];
  return raw.map((r) => {
    // Backend returns "YYYY-MM"; convert to short name
    const monthIdx = parseInt(r.month.split("-")[1], 10) - 1;
    return {
      month: SHORT_MONTHS[monthIdx] ?? r.month,
      borrows: r.borrows,
      returns: r.returns,
    };
  });
}

export async function apiGetRecentBorrows(limit = 5): Promise<BorrowRecord[]> {
  const res = await api.get("/borrows", { params: { limit, page: 1 } });
  const records: unknown[] = res.data.data?.records ?? res.data.data ?? [];
  return (records as Record<string, unknown>[]).map(normalizeBorrowRecord);
}

export interface CategoryStat {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS = [
  "#1D7FEC",
  "#34C759",
  "#AF52DE",
  "#FF9F0A",
  "#C8102E",
  "#FF6B6B",
  "#8E8E93",
];

const TOP_N = 6;

export async function apiGetCategoryStats(): Promise<CategoryStat[]> {
  const res = await api.get("/reports/category-stats");
  const raw: Array<{ category: string; count: number }> = res.data.data ?? [];
  const sorted = [...raw].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const result: CategoryStat[] = top.map((r, i) => ({
    name: r.category,
    value: r.count,
    color: CATEGORY_COLORS[i],
  }));
  if (rest.length > 0) {
    result.push({
      name: "Other",
      value: rest.reduce((s, r) => s + r.count, 0),
      color: CATEGORY_COLORS[TOP_N],
    });
  }
  return result;
}

export interface MemberGrowthData {
  month: string;
  members: number;
}

export interface ReportPopularBook {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  coverUrl?: string | null;
  borrowCount: number;
}

export interface AdminAnalyticsResponse {
  summary: ReportsSummary;
  analytics: {
    booksCirculated: number;
    activeMembers: number;
    avgBorrowsPerMonth: number;
    finesCollected: number;
    joinedThisMonth: number;
  };
  monthlyBorrows: Array<{ month: string; borrows: number; returns: number }>;
  categoryStats: Array<{ category: string; count: number }>;
  memberGrowth: Array<{ month: string; members: number }>;
  popularBooks: ReportPopularBook[];
}

export interface AdminAnalyticsData {
  summary: ReportsSummary;
  analytics: AdminAnalyticsResponse["analytics"];
  monthlyBorrows: MonthlyBorrowData[];
  categoryStats: CategoryStat[];
  memberGrowth: MemberGrowthData[];
  popularBooks: ReportPopularBook[];
}

export async function apiGetAdminAnalytics(): Promise<AdminAnalyticsData> {
  const res = await api.get("/reports/analytics");
  const raw = res.data.data as AdminAnalyticsResponse;

  const monthlyBorrows: MonthlyBorrowData[] = (raw.monthlyBorrows ?? []).map(
    (r) => {
      const monthIdx = parseInt(r.month.split("-")[1], 10) - 1;
      return {
        month: SHORT_MONTHS[monthIdx] ?? r.month,
        borrows: r.borrows,
        returns: r.returns,
      };
    },
  );

  const memberGrowth: MemberGrowthData[] = (raw.memberGrowth ?? []).map((r) => {
    const monthIdx = parseInt(r.month.split("-")[1], 10) - 1;
    return {
      month: SHORT_MONTHS[monthIdx] ?? r.month,
      members: r.members,
    };
  });

  const sorted = [...(raw.categoryStats ?? [])].sort(
    (a, b) => b.count - a.count,
  );
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const categoryStats: CategoryStat[] = top.map((r, i) => ({
    name: r.category,
    value: r.count,
    color: CATEGORY_COLORS[i],
  }));
  if (rest.length > 0) {
    categoryStats.push({
      name: "Other",
      value: rest.reduce((sum, r) => sum + r.count, 0),
      color: CATEGORY_COLORS[TOP_N],
    });
  }

  return {
    summary: raw.summary,
    analytics: raw.analytics,
    monthlyBorrows,
    categoryStats,
    memberGrowth,
    popularBooks: raw.popularBooks ?? [],
  };
}
