const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  isbn: true,
  category: true,
  year: true,
  description: true,
  publisher: true,
  coverUrl: true,
  totalCopies: true,
  availableCopies: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
};

const getAll = async ({
  page = 1,
  limit = 12,
  search = "",
  category = "",
  availability = "",
} = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (availability === "available") where.availableCopies = { gt: 0 };
  if (availability === "unavailable") where.availableCopies = 0;

  const [total, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: BOOK_SELECT,
    }),
  ]);

  return {
    books,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

const search = async (query) => {
  if (!query) return [];
  return prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { isbn: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: BOOK_SELECT,
  });
};

const getById = async (id) => {
  const book = await prisma.book.findUnique({
    where: { id },
    select: BOOK_SELECT,
  });
  if (!book) throw new ApiError(404, "Book not found.");
  return book;
};

const create = async (data) => {
  const existing = await prisma.book.findUnique({ where: { isbn: data.isbn } });
  if (existing)
    throw new ApiError(409, "A book with this ISBN already exists.");

  return prisma.book.create({
    data: {
      ...data,
      availableCopies: data.totalCopies,
    },
    select: BOOK_SELECT,
  });
};

const update = async (id, data) => {
  if (data.isbn) {
    const conflict = await prisma.book.findFirst({
      where: { isbn: data.isbn, NOT: { id } },
    });
    if (conflict)
      throw new ApiError(409, "Another book with this ISBN already exists.");
  }
  try {
    return await prisma.book.update({
      where: { id },
      data,
      select: BOOK_SELECT,
    });
  } catch (err) {
    if (err.code === "P2025") throw new ApiError(404, "Book not found.");
    throw err;
  }
};

const remove = async (id) => {
  const activeBorrows = await prisma.borrow.count({
    where: { bookId: id, returned: false },
  });
  if (activeBorrows > 0)
    throw new ApiError(400, "Cannot delete a book with active borrows.");
  try {
    await prisma.book.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2025") throw new ApiError(404, "Book not found.");
    throw err;
  }
};

module.exports = { getAll, search, getById, create, update, remove };
