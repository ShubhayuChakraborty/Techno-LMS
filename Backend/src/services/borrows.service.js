const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const {
  calculateFine,
  calculateOverdueDays,
} = require("../utils/fineCalculator");

const BORROW_DURATION_DAYS = 14;
const EXTENSION_DAYS = 7;
const MAX_ACTIVE_BORROWS = 3;

// Include user→member (for memberName/membershipNo) + book + fine
const BORROW_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      member: {
        select: {
          id: true,
          name: true,
          membershipNo: true,
          email: true,
          avatarUrl: true,
          avatarColor: true,
        },
      },
    },
  },
  book: {
    select: { id: true, title: true, author: true, isbn: true, coverUrl: true },
  },
  fine: { select: { id: true, amount: true, status: true, isPaid: true } },
};

// Helper: translate status query param to where clause on borrows table
function statusWhere(status) {
  const now = new Date();
  if (status === "active") return { returned: false, dueDate: { gte: now } };
  if (status === "overdue") return { returned: false, dueDate: { lt: now } };
  if (status === "returned") return { returned: true };
  return {};
}

const getAll = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  memberId = "",
} = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = { ...statusWhere(status) };

  if (memberId) {
    // memberId is a Member.id — find via user relation
    where.user = { member: { id: memberId } };
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      {
        user: {
          member: { membershipNo: { contains: search, mode: "insensitive" } },
        },
      },
      { book: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, records] = await Promise.all([
    prisma.borrow.count({ where }),
    prisma.borrow.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { borrowDate: "desc" },
      include: BORROW_INCLUDE,
    }),
  ]);

  return {
    records,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const getById = async (id) => {
  const record = await prisma.borrow.findUnique({
    where: { id },
    include: BORROW_INCLUDE,
  });
  if (!record) throw new ApiError(404, "Borrow record not found.");
  return record;
};

const getOverdue = async () => {
  return prisma.borrow.findMany({
    where: { returned: false, dueDate: { lt: new Date() } },
    orderBy: { dueDate: "asc" },
    include: BORROW_INCLUDE,
  });
};

// Librarian: issue directly without a borrow code (manual flow)
const issue = async (memberId, bookId, borrowDays = BORROW_DURATION_DAYS) => {
  return prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({ where: { id: memberId } });
    if (!member) throw new ApiError(404, "Member not found.");
    if (!member.isActive)
      throw new ApiError(400, "Member account is inactive.");
    if (member.activeBorrows >= MAX_ACTIVE_BORROWS) {
      throw new ApiError(
        400,
        `Member has reached the maximum of ${MAX_ACTIVE_BORROWS} active borrows.`,
      );
    }

    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) throw new ApiError(404, "Book not found.");
    if (book.availableCopies < 1)
      throw new ApiError(400, "No available copies for this book.");

    // Prevent duplicate active borrow
    const duplicate = await tx.borrow.findFirst({
      where: { userId: member.userId, bookId, returned: false },
    });
    if (duplicate)
      throw new ApiError(400, "Member already has this book borrowed.");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(borrowDays));

    const [borrow] = await Promise.all([
      tx.borrow.create({
        data: { userId: member.userId, bookId, dueDate },
        include: BORROW_INCLUDE,
      }),
      tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
      tx.member.update({
        where: { id: memberId },
        data: {
          activeBorrows: { increment: 1 },
          totalBorrows: { increment: 1 },
        },
      }),
    ]);

    return borrow;
  });
};

const returnBook = async (borrowId) => {
  return prisma.$transaction(async (tx) => {
    const borrow = await tx.borrow.findUnique({
      where: { id: borrowId },
      include: { user: { include: { member: true } } },
    });
    if (!borrow) throw new ApiError(404, "Borrow record not found.");
    if (borrow.returned)
      throw new ApiError(400, "Book has already been returned.");

    const member = borrow.user?.member;
    if (!member) throw new ApiError(404, "Member profile not found.");

    const now = new Date();
    const fineAmount = calculateFine(borrow.dueDate, now);
    const overdueDays = calculateOverdueDays(borrow.dueDate, now);
    const isOverdue = fineAmount > 0;

    await Promise.all([
      tx.borrow.update({
        where: { id: borrowId },
        data: { returnedAt: now, returned: true },
      }),
      tx.book.update({
        where: { id: borrow.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
      tx.member.update({
        where: { id: member.id },
        data: { activeBorrows: { decrement: 1 } },
      }),
      ...(isOverdue
        ? [
            tx.fine.create({
              data: {
                borrowId,
                memberId: member.id,
                overdueDays,
                amount: fineAmount,
                status: "unpaid",
              },
            }),
            tx.member.update({
              where: { id: member.id },
              data: { unpaidFines: { increment: fineAmount } },
            }),
          ]
        : []),
    ]);

    return {
      message: "Book returned successfully.",
      fineAmount,
      isOverdue,
      overdueDays,
    };
  });
};

const extend = async (borrowId) => {
  const borrow = await prisma.borrow.findUnique({ where: { id: borrowId } });
  if (!borrow) throw new ApiError(404, "Borrow record not found.");
  if (borrow.returned)
    throw new ApiError(400, "Cannot extend a returned borrow.");
  if (borrow.extendedOnce)
    throw new ApiError(400, "This borrow has already been extended once.");

  const newDueDate = new Date(borrow.dueDate);
  newDueDate.setDate(newDueDate.getDate() + EXTENSION_DAYS);

  return prisma.borrow.update({
    where: { id: borrowId },
    data: { dueDate: newDueDate, extendedOnce: true },
    include: BORROW_INCLUDE,
  });
};

// No-op: status is now computed from dueDate + returned flag, not stored
const syncOverdueStatus = async () => ({ count: 0 });

module.exports = {
  getAll,
  getById,
  getOverdue,
  issue,
  returnBook,
  extend,
  syncOverdueStatus,
};
