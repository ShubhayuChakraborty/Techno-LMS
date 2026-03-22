const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { generateBorrowCode } = require("../utils/generateBorrowCode");

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_BORROW_LIMIT = 5; // Default limit for all members

const PREMIUM_CATEGORY = "Premium";

const resolveBorrowLimit = async (db, memberId) => {
  return DEFAULT_BORROW_LIMIT;
};

const resolveActivePlan = async (db, memberId) => {
  return "standard"; // All members have standard plan
};

// ─── Request selection fragment ───────────────────────────────────────────────
const REQUEST_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      member: { select: { membershipNo: true } },
    },
  },
  book: {
    select: { id: true, title: true, author: true, isbn: true, coverUrl: true },
  },
};

// ─── Member: create a borrow request ─────────────────────────────────────────

/**
 * Creates a pending BorrowRequest for the authenticated member.
 * Validates book availability and active borrow limits before generating
 * the LIB-XXXXX code.
 *
 * @param {string} userId  - ID of the requesting User
 * @param {string} bookId  - ID of the book to borrow
 * @returns {{ code: string, expiresAt: Date }}
 */
const createRequest = async (userId, bookId) => {
  // Resolve the Member profile linked to this User
  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) throw new ApiError(404, "Member profile not found.");
  if (!member.isActive)
    throw new ApiError(403, "Your account has been deactivated.");

  const borrowLimit = await resolveBorrowLimit(prisma, member.id);

  if (member.activeBorrows >= borrowLimit) {
    throw new ApiError(
      400,
      `You have reached the maximum of ${borrowLimit} active borrows.`,
    );
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new ApiError(404, "Book not found.");
  if (book.availableCopies < 1)
    throw new ApiError(400, "No available copies for this book.");

  const activePlan = await resolveActivePlan(prisma, member.id);
  if (book.category === PREMIUM_CATEGORY && activePlan !== "max") {
    throw new ApiError(
      403,
      "Premium books are available only for Max subscription members.",
    );
  }

  // Prevent duplicate pending requests for the same book by this user
  const existing = await prisma.borrowRequest.findFirst({
    where: { userId, bookId, status: "pending" },
  });
  if (existing) {
    throw new ApiError(
      409,
      "You already have a pending borrow request for this book.",
    );
  }

  // Prevent double-borrowing the same book
  const activeBorrow = await prisma.borrow.findFirst({
    where: { userId, bookId, returned: false },
  });
  if (activeBorrow) {
    throw new ApiError(400, "You already have this book borrowed.");
  }

  // Generate a collision-resistant code (retry up to 5 times on collision)
  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateBorrowCode();
    const collision = await prisma.borrowRequest.findUnique({
      where: { code: candidate },
    });
    if (!collision) {
      code = candidate;
      break;
    }
  }
  if (!code)
    throw new ApiError(
      500,
      "Failed to generate a unique borrow code. Please try again.",
    );

  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const request = await prisma.borrowRequest.create({
    data: { code, userId, bookId, expiresAt },
  });

  return { code: request.code, expiresAt: request.expiresAt };
};

// ─── Librarian: look up a request by code ────────────────────────────────────

/**
 * Fetches a BorrowRequest by its code for the librarian to review.
 */
const getRequestByCode = async (code) => {
  if (!code) throw new ApiError(400, "Borrow code is required.");

  const request = await prisma.borrowRequest.findUnique({
    where: { code },
    include: REQUEST_INCLUDE,
  });
  if (!request) throw new ApiError(404, "Borrow request not found.");

  // Auto-expire stale pending requests on read
  if (request.status === "pending" && request.expiresAt < new Date()) {
    await prisma.borrowRequest.update({
      where: { id: request.id },
      data: { status: "expired" },
    });
    throw new ApiError(410, "This borrow code has expired.");
  }

  if (request.status === "used")
    throw new ApiError(409, "This borrow code has already been used.");
  if (request.status === "expired")
    throw new ApiError(410, "This borrow code has expired.");

  return {
    id: request.id,
    code: request.code,
    status: request.status,
    expiresAt: request.expiresAt,
    member: {
      name: request.user.name,
      membershipNo: request.user.member?.membershipNo ?? null,
    },
    book: request.book,
  };
};

// ─── Librarian: confirm borrow ────────────────────────────────────────────────

/**
 * Validates the borrow code, creates a confirmed Borrow record, and
 * decrements the available copies counter. All mutations run in a single
 * database transaction.
 *
 * @param {string} code        - The LIB-XXXXX code the member showed
 * @param {number} borrowDays  - Number of days until the due date
 * @returns {{ borrowId: string, dueDate: Date }}
 */
const confirmBorrow = async (code, borrowDays) => {
  if (!code) throw new ApiError(400, "Borrow code is required.");
  if (!borrowDays || borrowDays < 1 || borrowDays > 180) {
    throw new ApiError(400, "borrowDays must be between 1 and 180.");
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { code },
      include: REQUEST_INCLUDE,
    });
    if (!request) throw new ApiError(404, "Borrow request not found.");

    if (request.status === "used")
      throw new ApiError(409, "This borrow code has already been used.");
    if (request.status === "expired" || request.expiresAt < new Date())
      throw new ApiError(410, "This borrow code has expired.");

    // Re-validate book availability inside the transaction to prevent TOCTOU
    const book = await tx.book.findUnique({ where: { id: request.bookId } });
    if (!book) throw new ApiError(404, "Book not found.");
    if (book.availableCopies < 1)
      throw new ApiError(400, "No available copies for this book.");

    // Re-validate member is still within borrow limits
    const member = await tx.member.findUnique({
      where: { userId: request.userId },
    });
    if (!member) throw new ApiError(404, "Member profile not found.");
    if (!member.isActive)
      throw new ApiError(403, "Member account has been deactivated.");

    const borrowLimit = await resolveBorrowLimit(tx, member.id);
    const activePlan = await resolveActivePlan(tx, member.id);

    if (book.category === PREMIUM_CATEGORY && activePlan !== "max") {
      throw new ApiError(403, "Premium books are not available for borrowing.");
    }

    if (member.activeBorrows >= borrowLimit) {
      throw new ApiError(
        400,
        `Member has already reached the limit of ${borrowLimit} active borrows.`,
      );
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(borrowDays));

    const [borrow] = await Promise.all([
      tx.borrow.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          borrowRequestId: request.id,
          dueDate,
        },
      }),
      tx.borrowRequest.update({
        where: { id: request.id },
        data: { status: "used" },
      }),
      tx.book.update({
        where: { id: request.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
      tx.member.update({
        where: { userId: request.userId },
        data: {
          activeBorrows: { increment: 1 },
          totalBorrows: { increment: 1 },
        },
      }),
    ]);

    return { borrowId: borrow.id, dueDate: borrow.dueDate };
  });
};

// ─── Librarian: return a book ─────────────────────────────────────────────────

/**
 * Marks a Borrow as returned and increments available copies.
 * @param {string} borrowId
 */
const returnBorrow = async (borrowId) => {
  return prisma.$transaction(async (tx) => {
    const borrow = await tx.borrow.findUnique({ where: { id: borrowId } });
    if (!borrow) throw new ApiError(404, "Borrow record not found.");
    if (borrow.returned)
      throw new ApiError(409, "Book has already been returned.");

    await Promise.all([
      tx.borrow.update({
        where: { id: borrowId },
        data: { returned: true, returnedAt: new Date() },
      }),
      tx.book.update({
        where: { id: borrow.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
      tx.member.update({
        where: { userId: borrow.userId },
        data: { activeBorrows: { decrement: 1 } },
      }),
    ]);

    return { borrowId, returnedAt: new Date() };
  });
};

module.exports = {
  createRequest,
  getRequestByCode,
  confirmBorrow,
  returnBorrow,
};
