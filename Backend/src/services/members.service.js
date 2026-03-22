const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

const MEMBER_SELECT = {
  id: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  membershipNo: true,
  address: true,
  membershipType: true,
  joinedAt: true,
  expiryDate: true,
  isActive: true,
  activeBorrows: true,
  unpaidFines: true,
  totalBorrows: true,
  avatarColor: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const getAll = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
} = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { membershipNo: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [total, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: MEMBER_SELECT,
    }),
  ]);

  return {
    members,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const search = async (query) => {
  if (!query) return [];
  return prisma.member.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { membershipNo: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: MEMBER_SELECT,
  });
};

const getById = async (id) => {
  const member = await prisma.member.findUnique({
    where: { id },
    select: MEMBER_SELECT,
  });
  if (!member) throw new ApiError(404, "Member not found.");
  return member;
};

const create = async ({
  name,
  email,
  password,
  phone,
  address,
  membershipType,
  expiryDate,
  avatarColor,
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(409, "Email already registered.");

  const passwordHash = await bcrypt.hash(password || "Member@123", 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash, role: "member" },
    });
    const count = await tx.member.count();
    const membershipNo = `LIB-${String(count + 1).padStart(6, "0")}`;
    const expiry = expiryDate
      ? new Date(expiryDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return tx.member.create({
      data: {
        userId: user.id,
        name,
        email,
        phone,
        membershipNo,
        address,
        membershipType: membershipType || "basic",
        expiryDate: expiry,
        avatarColor: avatarColor || null,
      },
      select: MEMBER_SELECT,
    });
  });
};

const update = async (id, data) => {
  await getById(id);
  const {
    name,
    phone,
    address,
    membershipType,
    expiryDate,
    avatarColor,
    isActive,
  } = data;
  return prisma.member.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(membershipType !== undefined && { membershipType }),
      ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
      ...(avatarColor !== undefined && { avatarColor }),
      ...(isActive !== undefined && { isActive }),
    },
    select: MEMBER_SELECT,
  });
};

const toggleActive = async (id) => {
  const member = await getById(id);
  if (member.isActive && member.activeBorrows > 0) {
    throw new ApiError(400, "Cannot deactivate member with active borrows.");
  }
  return prisma.member.update({
    where: { id },
    data: { isActive: !member.isActive },
    select: MEMBER_SELECT,
  });
};

const getMemberBorrows = async (
  id,
  { page = 1, limit = 10, status = "" } = {},
) => {
  const member = await getById(id);
  const skip = (Number(page) - 1) * Number(limit);
  const now = new Date();
  const where = { userId: member.userId };
  if (status === "active") {
    where.returned = false;
    where.dueDate = { gte: now };
  } else if (status === "overdue") {
    where.returned = false;
    where.dueDate = { lt: now };
  } else if (status === "returned") where.returned = true;

  const [total, records] = await Promise.all([
    prisma.borrow.count({ where }),
    prisma.borrow.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { borrowDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            member: { select: { id: true, name: true, membershipNo: true } },
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            coverUrl: true,
          },
        },
        fine: true,
      },
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

const getMemberFines = async (id, { page = 1, limit = 10 } = {}) => {
  await getById(id);
  const skip = (Number(page) - 1) * Number(limit);
  const where = { memberId: id };

  const [total, fines] = await Promise.all([
    prisma.fine.count({ where }),
    prisma.fine.findMany({
      where,
      skip,
      take: Number(limit),
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

const remove = async (id) => {
  const member = await getById(id);
  if (member.activeBorrows > 0) {
    throw new ApiError(400, "Cannot delete a member with active borrows.");
  }
  // Deleting the User cascades to Member (see schema relations)
  await prisma.user.delete({ where: { id: member.userId } });
};

module.exports = {
  getAll,
  search,
  getById,
  create,
  update,
  toggleActive,
  remove,
  getMemberBorrows,
  getMemberFines,
};
