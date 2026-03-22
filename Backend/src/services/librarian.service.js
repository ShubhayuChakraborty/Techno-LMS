const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

const LIBRARIAN_SELECT = {
  id: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  department: true,
  avatarColor: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const getAll = async ({ page = 1, limit = 50, search = "" } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, librarians] = await Promise.all([
    prisma.librarian.count({ where }),
    prisma.librarian.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: LIBRARIAN_SELECT,
    }),
  ]);

  return {
    librarians,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

// ─── Get profile by userId ────────────────────────────────────────────────────

const getProfile = async (userId) => {
  const librarian = await prisma.librarian.findUnique({
    where: { userId },
    select: LIBRARIAN_SELECT,
  });

  if (!librarian) {
    // Return a minimal profile derived from the user record if no profile row exists yet
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found.");
    return {
      id: null,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: null,
      address: null,
      department: null,
      avatarColor: null,
      avatarUrl: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  return librarian;
};

// ─── Update profile by userId ─────────────────────────────────────────────────

const updateProfile = async (userId, data) => {
  const { name, phone, address, department, avatarColor, avatarUrl } = data;

  // Fetch user to populate the create branch if the row doesn't exist yet
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found.");

  // Upsert: create the row on first edit if it doesn't exist yet
  const librarian = await prisma.librarian.upsert({
    where: { userId },
    update: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(department !== undefined && { department }),
      ...(avatarColor !== undefined && { avatarColor }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    create: {
      userId,
      name: name ?? user.name,
      email: user.email,
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(department !== undefined && { department }),
      ...(avatarColor !== undefined && { avatarColor }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: LIBRARIAN_SELECT,
  });

  // Keep User.name in sync
  if (name !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { name } });
  }

  return librarian;
};

module.exports = { getAll, getProfile, updateProfile };
