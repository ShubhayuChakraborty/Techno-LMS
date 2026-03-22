const borrowCodeService = require("../services/borrowCode.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ─── Member ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/borrow/request
 * Auth: member
 * Body: { bookId }
 *
 * Generates a LIB-XXXXX code tied to the authenticated member + book.
 * The code is valid for 30 minutes.
 */
const requestBorrow = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const { code, expiresAt } = await borrowCodeService.createRequest(
    req.user.id,
    bookId,
  );
  res
    .status(201)
    .json(new ApiResponse(201, { code, expiresAt }, "Borrow request created."));
});

// ─── Librarian ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/borrow/request/:code
 * Auth: librarian | admin
 *
 * Returns the request details so the librarian can review before confirming.
 */
const getRequest = asyncHandler(async (req, res) => {
  const request = await borrowCodeService.getRequestByCode(req.params.code);
  res.status(200).json(new ApiResponse(200, request));
});

/**
 * POST /api/v1/borrow/confirm
 * Auth: librarian | admin
 * Body: { code, borrowDays }
 *
 * Validates the code, creates the Borrow record, and marks the request used.
 */
const confirmBorrow = asyncHandler(async (req, res) => {
  const { code, borrowDays } = req.body;
  const { borrowId, dueDate } = await borrowCodeService.confirmBorrow(
    code,
    Number(borrowDays),
  );
  res
    .status(201)
    .json(new ApiResponse(201, { borrowId, dueDate }, "Borrow confirmed."));
});

/**
 * POST /api/v1/borrow/return
 * Auth: librarian | admin
 * Body: { borrowId }
 *
 * Marks the borrow as returned and restores the book's available copies.
 */
const returnBorrow = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const result = await borrowCodeService.returnBorrow(borrowId);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Book returned successfully."));
});

module.exports = { requestBorrow, getRequest, confirmBorrow, returnBorrow };
