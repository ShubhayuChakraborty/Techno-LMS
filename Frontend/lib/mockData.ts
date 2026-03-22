// ─── Mock Data ─────────────────────────────────────────────────────────────

export type Role = "admin" | "librarian" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  member?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    membershipNo: string;
    activeBorrows: number;
    totalBorrows: number;
    unpaidFines: number;
    isActive: boolean;
    membershipType?: string;
    expiryDate?: string;
    avatarColor?: string;
    avatarUrl?: string;
    joinedAt?: string;
  };
  librarian?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    department?: string;
    avatarColor?: string;
    avatarUrl?: string;
    createdAt?: string;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  description: string;
  totalCopies: number;
  availableCopies: number;
  rating: number;
  reviewCount: number;
  coverUrl?: string;
  publisher?: string;
}

export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  membershipNo: string;
  address: string;
  joinedAt: string;
  expiryDate: string;
  isActive: boolean;
  activeBorrows: number;
  unpaidFines: number;
  totalBorrows: number;
  // optional extended fields
  avatarColor?: string;
  avatarUrl?: string;
  membershipType?: "basic" | "premium" | "student" | "standard";
  totalFines?: number;
}

export interface BorrowRecord {
  id: string;
  memberId: string;
  memberName: string;
  membershipNo: string;
  memberAvatarUrl?: string;
  memberAvatarColor?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: "active" | "overdue" | "returned";
  extendedOnce: boolean;
  fine?: number;
  finePaid?: boolean;
}

export interface Fine {
  id: string;
  borrowId: string;
  memberId: string;
  memberName: string;
  bookTitle: string;
  overdueDays: number;
  amount: number;
  isPaid: boolean;
  createdAt: string;
  paidAt?: string;
  // optional extended fields
  status?: "paid" | "unpaid" | "waived" | "pending";
  membershipNo?: string;
}

export interface Recommendation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string;
  category: string;
  score: number;
  strategy: string;
  rating: number;
  availableCopies: number;
  memberName?: string;
  reason?: string;
}

// ── Users ──────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: "u1", name: "Ram Sharma", email: "ram@library.com", role: "admin" },
  { id: "u2", name: "Lata Nair", email: "lata@library.com", role: "librarian" },
  { id: "u3", name: "Priya Mehta", email: "priya@email.com", role: "member" },
];

export const CREDENTIALS: Record<string, { password: string; userId: string }> =
  {
    "ram@library.com": { password: "admin123", userId: "u1" },
    "lata@library.com": { password: "lib123", userId: "u2" },
    "priya@email.com": { password: "member123", userId: "u3" },
  };

// ── Categories ────────────────────────────────────────────────────────────
export const CATEGORIES = [
  "Premium",
  "Technology",
  "Science",
  "Fiction",
  "History",
  "Mathematics",
  "Psychology",
  "Business",
  "Philosophy",
  "Biography",
  "Arts",
  "Self-Help",
  "Economics",
  "Politics",
  "Religion",
  "Health",
];

// ── Books ─────────────────────────────────────────────────────────────────
export const MOCK_BOOKS: Book[] = [
  {
    id: "b1",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category: "Technology",
    year: 2008,
    description:
      "A Handbook of Agile Software Craftsmanship. A must-read for any developer.",
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.8,
    reviewCount: 124,
    publisher: "Prentice Hall",
  },
  {
    id: "b2",
    title: "Design Patterns",
    author: "Gang of Four",
    isbn: "978-0201633610",
    category: "Technology",
    year: 1994,
    description:
      "Elements of Reusable Object-Oriented Software. The classic patterns book.",
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.7,
    reviewCount: 98,
    publisher: "Addison-Wesley",
  },
  {
    id: "b3",
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    isbn: "978-0135957059",
    category: "Technology",
    year: 2019,
    description: "Your journey to mastery. From Journeyman to Master.",
    totalCopies: 3,
    availableCopies: 3,
    rating: 4.9,
    reviewCount: 87,
    publisher: "Pragmatic Bookshelf",
  },
  {
    id: "b4",
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson",
    isbn: "978-0262033848",
    category: "Mathematics",
    year: 2009,
    description: "The definitive reference for algorithms and data structures.",
    totalCopies: 6,
    availableCopies: 1,
    rating: 4.6,
    reviewCount: 203,
    publisher: "MIT Press",
  },
  {
    id: "b5",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "978-0062316097",
    category: "History",
    year: 2011,
    description: "A Brief History of Humankind spanning 70,000 years.",
    totalCopies: 8,
    availableCopies: 5,
    rating: 4.9,
    reviewCount: 341,
    publisher: "Harper",
  },
  {
    id: "b6",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "978-0374533557",
    category: "Psychology",
    year: 2011,
    description: "How we think and make decisions — two systems of thought.",
    totalCopies: 5,
    availableCopies: 4,
    rating: 4.7,
    reviewCount: 256,
    publisher: "Farrar, Straus and Giroux",
  },
  {
    id: "b7",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0743273565",
    category: "Fiction",
    year: 1925,
    description: "A story of wealth, obsession, and the American dream.",
    totalCopies: 7,
    availableCopies: 6,
    rating: 4.2,
    reviewCount: 189,
    publisher: "Scribner",
  },
  {
    id: "b8",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "978-0735211292",
    category: "Self-Help",
    year: 2018,
    description:
      "Tiny changes, remarkable results. Build good habits, break bad ones.",
    totalCopies: 6,
    availableCopies: 2,
    rating: 4.8,
    reviewCount: 412,
    publisher: "Avery",
  },
  {
    id: "b9",
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    isbn: "978-1505339116",
    category: "Economics",
    year: 1926,
    description: "Ancient wisdom for modern wealth building through parables.",
    totalCopies: 4,
    availableCopies: 4,
    rating: 4.5,
    reviewCount: 167,
    publisher: "Plume",
  },
  {
    id: "b10",
    title: "Brief Answers to Big Questions",
    author: "Stephen Hawking",
    isbn: "978-1984819192",
    category: "Science",
    year: 2018,
    description:
      "The final book from Stephen Hawking — his thoughts on the biggest questions.",
    totalCopies: 5,
    availableCopies: 0,
    rating: 4.6,
    reviewCount: 223,
    publisher: "Bantam Books",
  },
  {
    id: "b11",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0061935467",
    category: "Fiction",
    year: 1960,
    description:
      "A classic of modern American literature tackling racial injustice.",
    totalCopies: 6,
    availableCopies: 5,
    rating: 4.8,
    reviewCount: 298,
    publisher: "Harper Perennial",
  },
  {
    id: "b12",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "978-0553380163",
    category: "Science",
    year: 1988,
    description:
      "From the Big Bang to Black Holes — cosmology made accessible.",
    totalCopies: 4,
    availableCopies: 3,
    rating: 4.5,
    reviewCount: 178,
    publisher: "Bantam Books",
  },
  {
    id: "b13",
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    isbn: "978-1982137274",
    category: "Self-Help",
    year: 1989,
    description: "Powerful lessons for personal and professional change.",
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.4,
    reviewCount: 332,
    publisher: "Simon & Schuster",
  },
  {
    id: "b14",
    title: "Zero to One",
    author: "Peter Thiel, Blake Masters",
    isbn: "978-0804139021",
    category: "Business",
    year: 2014,
    description: "Notes on startups and how to build the future.",
    totalCopies: 3,
    availableCopies: 2,
    rating: 4.6,
    reviewCount: 145,
    publisher: "Crown Business",
  },
  {
    id: "b15",
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "978-0062315007",
    category: "Fiction",
    year: 1988,
    description: "A legendary tale of Santiago, an Andalusian shepherd boy.",
    totalCopies: 8,
    availableCopies: 7,
    rating: 4.3,
    reviewCount: 445,
    publisher: "HarperOne",
  },
  {
    id: "b16",
    title: "Dune",
    author: "Frank Herbert",
    isbn: "978-0441013593",
    category: "Fiction",
    year: 1965,
    description:
      "Epic science fiction set in the far future on a desert planet.",
    totalCopies: 4,
    availableCopies: 1,
    rating: 4.7,
    reviewCount: 267,
    publisher: "Ace",
  },
  {
    id: "b17",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    isbn: "978-0857197689",
    category: "Economics",
    year: 2020,
    description: "Timeless lessons on wealth, greed, and happiness.",
    totalCopies: 5,
    availableCopies: 4,
    rating: 4.8,
    reviewCount: 389,
    publisher: "Harriman House",
  },
  {
    id: "b18",
    title: "Deep Work",
    author: "Cal Newport",
    isbn: "978-1455586691",
    category: "Self-Help",
    year: 2016,
    description: "Rules for focused success in a distracted world.",
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.6,
    reviewCount: 234,
    publisher: "Grand Central Publishing",
  },
];

// ── Members ────────────────────────────────────────────────────────────────
export const MOCK_MEMBERS: Member[] = [
  {
    id: "m1",
    userId: "u3",
    name: "Priya Mehta",
    email: "priya@email.com",
    phone: "+91 98765 43210",
    membershipNo: "LIB-000042",
    address: "12, Andheri West, Mumbai",
    joinedAt: "2024-01-15",
    expiryDate: "2026-01-15",
    isActive: true,
    activeBorrows: 2,
    unpaidFines: 25,
    totalBorrows: 18,
  },
  {
    id: "m2",
    userId: "u4",
    name: "Arjun Kumar",
    email: "arjun@email.com",
    phone: "+91 87654 32109",
    membershipNo: "LIB-000043",
    address: "45, Koramangala, Bangalore",
    joinedAt: "2024-03-10",
    expiryDate: "2026-03-10",
    isActive: true,
    activeBorrows: 1,
    unpaidFines: 0,
    totalBorrows: 11,
  },
  {
    id: "m3",
    userId: "u5",
    name: "Sneha Reddy",
    email: "sneha@email.com",
    phone: "+91 76543 21098",
    membershipNo: "LIB-000044",
    address: "78, Banjara Hills, Hyderabad",
    joinedAt: "2023-11-20",
    expiryDate: "2025-11-20",
    isActive: true,
    activeBorrows: 3,
    unpaidFines: 70,
    totalBorrows: 24,
  },
  {
    id: "m4",
    userId: "u6",
    name: "Rahul Gupta",
    email: "rahul@email.com",
    phone: "+91 65432 10987",
    membershipNo: "LIB-000045",
    address: "23, Connaught Place, Delhi",
    joinedAt: "2024-06-01",
    expiryDate: "2025-04-01",
    isActive: true,
    activeBorrows: 0,
    unpaidFines: 0,
    totalBorrows: 7,
  },
  {
    id: "m5",
    userId: "u7",
    name: "Kavya Nair",
    email: "kavya@email.com",
    phone: "+91 54321 09876",
    membershipNo: "LIB-000046",
    address: "56, MG Road, Kochi",
    joinedAt: "2023-08-14",
    expiryDate: "2025-08-14",
    isActive: true,
    activeBorrows: 2,
    unpaidFines: 0,
    totalBorrows: 32,
  },
  {
    id: "m6",
    userId: "u8",
    name: "Vikram Singh",
    email: "vikram@email.com",
    phone: "+91 43210 98765",
    membershipNo: "LIB-000047",
    address: "12, Civil Lines, Jaipur",
    joinedAt: "2023-05-22",
    expiryDate: "2024-05-22",
    isActive: false,
    activeBorrows: 0,
    unpaidFines: 150,
    totalBorrows: 45,
  },
  {
    id: "m7",
    userId: "u9",
    name: "Meera Patel",
    email: "meera@email.com",
    phone: "+91 32109 87654",
    membershipNo: "LIB-000048",
    address: "89, Navrangpura, Ahmedabad",
    joinedAt: "2024-09-01",
    expiryDate: "2026-09-01",
    isActive: true,
    activeBorrows: 0,
    unpaidFines: 0,
    totalBorrows: 3,
  },
];

// ── Borrows ────────────────────────────────────────────────────────────────
export const MOCK_BORROWS: BorrowRecord[] = [
  {
    id: "br1",
    memberId: "m1",
    memberName: "Priya Mehta",
    membershipNo: "LIB-000042",
    bookId: "b1",
    bookTitle: "Clean Code",
    bookAuthor: "Robert C. Martin",
    issuedAt: "2026-02-17",
    dueDate: "2026-03-03",
    status: "overdue",
    extendedOnce: false,
    fine: 0,
  },
  {
    id: "br2",
    memberId: "m1",
    memberName: "Priya Mehta",
    membershipNo: "LIB-000042",
    bookId: "b8",
    bookTitle: "Atomic Habits",
    bookAuthor: "James Clear",
    issuedAt: "2026-02-28",
    dueDate: "2026-03-14",
    status: "active",
    extendedOnce: false,
  },
  {
    id: "br3",
    memberId: "m2",
    memberName: "Arjun Kumar",
    membershipNo: "LIB-000043",
    bookId: "b5",
    bookTitle: "Sapiens",
    bookAuthor: "Yuval Noah Harari",
    issuedAt: "2026-02-20",
    dueDate: "2026-03-06",
    status: "active",
    extendedOnce: false,
  },
  {
    id: "br4",
    memberId: "m3",
    memberName: "Sneha Reddy",
    membershipNo: "LIB-000044",
    bookId: "b2",
    bookTitle: "Design Patterns",
    bookAuthor: "Gang of Four",
    issuedAt: "2026-02-10",
    dueDate: "2026-02-24",
    status: "overdue",
    extendedOnce: true,
    fine: 80,
  },
  {
    id: "br5",
    memberId: "m3",
    memberName: "Sneha Reddy",
    membershipNo: "LIB-000044",
    bookId: "b6",
    bookTitle: "Thinking, Fast and Slow",
    bookAuthor: "Daniel Kahneman",
    issuedAt: "2026-02-25",
    dueDate: "2026-03-11",
    status: "active",
    extendedOnce: false,
  },
  {
    id: "br6",
    memberId: "m3",
    memberName: "Sneha Reddy",
    membershipNo: "LIB-000044",
    bookId: "b18",
    bookTitle: "Deep Work",
    bookAuthor: "Cal Newport",
    issuedAt: "2026-02-18",
    dueDate: "2026-03-04",
    status: "active",
    extendedOnce: false,
  },
  {
    id: "br7",
    memberId: "m5",
    memberName: "Kavya Nair",
    membershipNo: "LIB-000046",
    bookId: "b4",
    bookTitle: "Introduction to Algorithms",
    bookAuthor: "Cormen, Leiserson",
    issuedAt: "2026-02-22",
    dueDate: "2026-03-08",
    status: "active",
    extendedOnce: false,
  },
  {
    id: "br8",
    memberId: "m5",
    memberName: "Kavya Nair",
    membershipNo: "LIB-000046",
    bookId: "b16",
    bookTitle: "Dune",
    bookAuthor: "Frank Herbert",
    issuedAt: "2026-02-14",
    dueDate: "2026-02-28",
    status: "overdue",
    extendedOnce: false,
    fine: 30,
  },
  // History
  {
    id: "br9",
    memberId: "m1",
    memberName: "Priya Mehta",
    membershipNo: "LIB-000042",
    bookId: "b3",
    bookTitle: "The Pragmatic Programmer",
    bookAuthor: "David Thomas",
    issuedAt: "2026-01-10",
    dueDate: "2026-01-24",
    returnedAt: "2026-01-23",
    status: "returned",
    extendedOnce: false,
    fine: 0,
    finePaid: true,
  },
  {
    id: "br10",
    memberId: "m2",
    memberName: "Arjun Kumar",
    membershipNo: "LIB-000043",
    bookId: "b7",
    bookTitle: "The Great Gatsby",
    bookAuthor: "F. Scott Fitzgerald",
    issuedAt: "2026-01-05",
    dueDate: "2026-01-19",
    returnedAt: "2026-01-22",
    status: "returned",
    extendedOnce: false,
    fine: 15,
    finePaid: true,
  },
];

// ── Fines ──────────────────────────────────────────────────────────────────
export const MOCK_FINES: Fine[] = [
  {
    id: "f1",
    borrowId: "br1",
    memberId: "m1",
    memberName: "Priya Mehta",
    bookTitle: "Clean Code",
    overdueDays: 5,
    amount: 25,
    isPaid: false,
    createdAt: "2026-03-04",
  },
  {
    id: "f2",
    borrowId: "br4",
    memberId: "m3",
    memberName: "Sneha Reddy",
    bookTitle: "Design Patterns",
    overdueDays: 14,
    amount: 70,
    isPaid: false,
    createdAt: "2026-02-24",
  },
  {
    id: "f3",
    borrowId: "br8",
    memberId: "m5",
    memberName: "Kavya Nair",
    bookTitle: "Dune",
    overdueDays: 6,
    amount: 30,
    isPaid: false,
    createdAt: "2026-03-01",
  },
  {
    id: "f4",
    borrowId: "br10",
    memberId: "m2",
    memberName: "Arjun Kumar",
    bookTitle: "The Great Gatsby",
    overdueDays: 3,
    amount: 15,
    isPaid: true,
    createdAt: "2026-01-22",
    paidAt: "2026-01-25",
  },
  {
    id: "f5",
    borrowId: "br9",
    memberId: "m1",
    memberName: "Priya Mehta",
    bookTitle: "The Pragmatic Programmer",
    overdueDays: 0,
    amount: 0,
    isPaid: true,
    createdAt: "2026-01-23",
    paidAt: "2026-01-23",
  },
  {
    id: "f6",
    borrowId: "br6v",
    memberId: "m6",
    memberName: "Vikram Singh",
    bookTitle: "Atomic Habits",
    overdueDays: 30,
    amount: 150,
    isPaid: false,
    createdAt: "2025-05-22",
  },
];

// ── Monthly data for charts ────────────────────────────────────────────────
export const MONTHLY_DATA = [
  { month: "Apr", borrows: 28, returns: 24 },
  { month: "May", borrows: 35, returns: 30 },
  { month: "Jun", borrows: 42, returns: 38 },
  { month: "Jul", borrows: 38, returns: 35 },
  { month: "Aug", borrows: 45, returns: 42 },
  { month: "Sep", borrows: 52, returns: 48 },
  { month: "Oct", borrows: 48, returns: 45 },
  { month: "Nov", borrows: 55, returns: 50 },
  { month: "Dec", borrows: 40, returns: 38 },
  { month: "Jan", borrows: 60, returns: 56 },
  { month: "Feb", borrows: 65, returns: 58 },
  { month: "Mar", borrows: 47, returns: 32 },
];

export const CATEGORY_DATA = [
  { name: "Technology", value: 78, color: "#1D7FEC" },
  { name: "Fiction", value: 54, color: "#34C759" },
  { name: "Science", value: 42, color: "#AF52DE" },
  { name: "Self-Help", value: 38, color: "#FF9F0A" },
  { name: "Other", value: 130, color: "#C8102E" },
];

export const POPULAR_BOOKS = MOCK_BOOKS.slice(0, 8).map((b, i) => ({
  ...b,
  borrowCount: [124, 98, 87, 76, 65, 54, 48, 43][i],
}));

// ── Recommendations ────────────────────────────────────────────────────────
export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec1",
    bookId: "b3",
    bookTitle: "The Pragmatic Programmer",
    bookAuthor: "David Thomas",
    category: "Technology",
    score: 0.94,
    strategy: "Based on your history",
    rating: 4.9,
    availableCopies: 3,
    memberName: "Priya Mehta",
  },
  {
    id: "rec2",
    bookId: "b14",
    bookTitle: "Zero to One",
    bookAuthor: "Peter Thiel",
    category: "Business",
    score: 0.89,
    strategy: "Trending in your area",
    rating: 4.6,
    availableCopies: 2,
    memberName: "Arjun Patel",
  },
  {
    id: "rec3",
    bookId: "b17",
    bookTitle: "The Psychology of Money",
    bookAuthor: "Morgan Housel",
    category: "Economics",
    score: 0.87,
    strategy: "Popular this month",
    rating: 4.8,
    availableCopies: 4,
    memberName: "Kavya Sharma",
  },
  {
    id: "rec4",
    bookId: "b13",
    bookTitle: "The 7 Habits",
    bookAuthor: "Stephen R. Covey",
    category: "Self-Help",
    score: 0.85,
    strategy: "Based on your ratings",
    rating: 4.4,
    availableCopies: 3,
    memberName: "Rahul Singh",
  },
  {
    id: "rec5",
    bookId: "b12",
    bookTitle: "A Brief History of Time",
    bookAuthor: "Stephen Hawking",
    category: "Science",
    score: 0.82,
    strategy: "Readers like you loved",
    rating: 4.5,
    availableCopies: 3,
    memberName: "Sneha Iyer",
  },
  {
    id: "rec6",
    bookId: "b15",
    bookTitle: "The Alchemist",
    bookAuthor: "Paulo Coelho",
    category: "Fiction",
    score: 0.79,
    strategy: "Highly rated fiction",
    rating: 4.3,
    availableCopies: 7,
    memberName: "Priya Mehta",
  },
];
