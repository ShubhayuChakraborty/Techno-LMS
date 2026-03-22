const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const prisma = require("../config/db");
const reviewsService = require("../services/reviews.service");

/** GET /api/v1/books/:bookId/reviews */
const getBookReviews = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const result = await reviewsService.getBookReviews(bookId, req.query);
  res.json(new ApiResponse(200, result));
});

/** GET /api/v1/books/:bookId/reviews/mine  (member only) */
const getMyReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const member = await prisma.member.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!member) throw new ApiError(404, "Member profile not found.");

  const review = await reviewsService.getMyReview(bookId, member.id);
  res.json(new ApiResponse(200, review ?? null));
});

/** POST /api/v1/books/:bookId/reviews  (member only) */
const upsertReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const member = await prisma.member.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!member) throw new ApiError(404, "Member profile not found.");

  const review = await reviewsService.upsertReview(bookId, member.id, req.body);
  res.json(new ApiResponse(200, review, "Review saved."));
});

/** DELETE /api/v1/books/:bookId/reviews  (member only) */
const deleteReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const member = await prisma.member.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!member) throw new ApiError(404, "Member profile not found.");

  await reviewsService.deleteReview(bookId, member.id);
  res.json(new ApiResponse(200, null, "Review deleted."));
});

module.exports = { getBookReviews, getMyReview, upsertReview, deleteReview };
