const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

/** Get all reviews for a book (paginated, newest first) */
const getBookReviews = async (bookId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { bookId } }),
    prisma.review.findMany({
      where: { bookId },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: { name: true, avatarColor: true, membershipNo: true },
        },
      },
    }),
  ]);
  return { reviews, total, page: Number(page), limit: Number(limit) };
};

/** Get the calling member's own review for a book (or null) */
const getMyReview = async (bookId, memberId) => {
  return prisma.review.findUnique({
    where: { bookId_memberId: { bookId, memberId } },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/** Create or update a review; recalculate book rating aggregate */
const upsertReview = async (bookId, memberId, { rating, comment }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5.");
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true },
  });
  if (!book) throw new ApiError(404, "Book not found.");

  const review = await prisma.review.upsert({
    where: { bookId_memberId: { bookId, memberId } },
    create: {
      bookId,
      memberId,
      rating: Number(rating),
      comment: comment?.trim() || null,
    },
    update: { rating: Number(rating), comment: comment?.trim() || null },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Recalculate aggregate rating & count on the book
  const agg = await prisma.review.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await prisma.book.update({
    where: { id: bookId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count.id,
    },
  });

  return review;
};

/** Delete a member's own review */
const deleteReview = async (bookId, memberId) => {
  const existing = await prisma.review.findUnique({
    where: { bookId_memberId: { bookId, memberId } },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, "Review not found.");

  await prisma.review.delete({
    where: { bookId_memberId: { bookId, memberId } },
  });

  // Recalculate aggregate
  const agg = await prisma.review.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await prisma.book.update({
    where: { id: bookId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count.id,
    },
  });
};

module.exports = { getBookReviews, getMyReview, upsertReview, deleteReview };
