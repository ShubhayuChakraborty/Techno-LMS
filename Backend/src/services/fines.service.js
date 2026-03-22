const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

const FINE_INCLUDE = {
  borrow: {
    select: {
      id: true,
      borrowDate: true,
      dueDate: true,
      returnedAt: true,
      book: { select: { id: true, title: true, author: true } },
    },
  },
  member: { select: { id: true, name: true, membershipNo: true, email: true } },
};

const getAll = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  memberId = "",
} = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (status) where.status = status;
  if (memberId) where.memberId = memberId;

  if (search) {
    where.OR = [
      { member: { name: { contains: search, mode: "insensitive" } } },
      { member: { membershipNo: { contains: search, mode: "insensitive" } } },
      {
        borrow: {
          book: { title: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [total, fines] = await Promise.all([
    prisma.fine.count({ where }),
    prisma.fine.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: FINE_INCLUDE,
    }),
  ]);

  return {
    fines,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const getById = async (id) => {
  const fine = await prisma.fine.findUnique({
    where: { id },
    include: FINE_INCLUDE,
  });
  if (!fine) throw new ApiError(404, "Fine not found.");
  return fine;
};

const pay = async (id) => {
  const fine = await getById(id);
  if (fine.status === "paid")
    throw new ApiError(400, "Fine has already been paid.");

  return prisma.$transaction(async (tx) => {
    const [updated] = await Promise.all([
      tx.fine.update({
        where: { id },
        data: { isPaid: true, status: "paid", paidAt: new Date() },
        include: FINE_INCLUDE,
      }),
      tx.member.update({
        where: { id: fine.memberId },
        data: { unpaidFines: { decrement: Number(fine.amount) } },
      }),
    ]);
    return updated;
  });
};

const waive = async (id) => {
  const fine = await getById(id);
  if (fine.status === "paid" || fine.status === "waived") {
    throw new ApiError(400, `Fine is already ${fine.status}.`);
  }

  return prisma.$transaction(async (tx) => {
    const [updated] = await Promise.all([
      tx.fine.update({
        where: { id },
        data: { status: "waived", isPaid: true, paidAt: new Date() },
        include: FINE_INCLUDE,
      }),
      tx.member.update({
        where: { id: fine.memberId },
        data: { unpaidFines: { decrement: Number(fine.amount) } },
      }),
    ]);
    return updated;
  });
};

const getMyFines = async (userId) => {
  const member = await prisma.member.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!member) throw new ApiError(404, "Member profile not found.");

  const fines = await prisma.fine.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "desc" },
    include: {
      borrow: {
        select: {
          id: true,
          borrowDate: true,
          dueDate: true,
          returnedAt: true,
          book: { select: { id: true, title: true, author: true } },
        },
      },
    },
  });
  return { fines, memberId: member.id };
};

const payAllForMember = async (userId, memberId) => {
  // verify the user owns this member record
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, userId: true },
  });
  if (!member) throw new ApiError(404, "Member not found.");
  // allow admin to pay for any member (no userId check needed for staff)
  if (userId && member.userId !== userId) {
    throw new ApiError(403, "You can only pay your own fines.");
  }
  return payAll(memberId);
};

const payAll = async (memberId) => {
  const unpaidFines = await prisma.fine.findMany({
    where: { memberId, status: { in: ["unpaid", "pending"] } },
  });
  if (unpaidFines.length === 0)
    throw new ApiError(400, "No unpaid fines for this member.");

  const totalAmount = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);
  const fineIds = unpaidFines.map((f) => f.id);
  const borrowIds = unpaidFines.map((f) => f.borrowId);

  await prisma.$transaction([
    prisma.fine.updateMany({
      where: { id: { in: fineIds } },
      data: { isPaid: true, status: "paid", paidAt: new Date() },
    }),
    prisma.member.update({ where: { id: memberId }, data: { unpaidFines: 0 } }),
  ]);

  return { paidCount: fineIds.length, totalAmount };
};

module.exports = {
  getAll,
  getById,
  pay,
  waive,
  payAll,
  getMyFines,
  payAllForMember,
};
