const { z } = require("zod");
const router = require("express").Router();
const borrowCodeController = require("../controllers/borrowCode.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

// ─── Validation schemas ───────────────────────────────────────────────────────

const requestSchema = z.object({
  bookId: z.string().min(1, "bookId is required"),
});

const confirmSchema = z.object({
  code: z
    .string()
    .regex(/^LIB-[A-Z2-9]{5}$/, "Invalid borrow code format (e.g. LIB-3K9X2)"),
  borrowDays: z
    .number({ invalid_type_error: "borrowDays must be a number" })
    .int()
    .min(1, "borrowDays must be at least 1")
    .max(180, "borrowDays cannot exceed 180"),
});

const approveSchema = z.object({
  borrowDays: z
    .number({ invalid_type_error: "borrowDays must be a number" })
    .int()
    .min(1, "borrowDays must be at least 1")
    .max(180, "borrowDays cannot exceed 180")
    .optional(),
});

const returnSchema = z.object({
  borrowId: z.string().min(1, "borrowId is required"),
});

// ─── Member routes ────────────────────────────────────────────────────────────

// GET /api/v1/borrow/notifications  — role-aware in-app notifications
router.get("/notifications", protect, borrowCodeController.getNotifications);

// POST /api/v1/borrow/request  — member generates a borrow code
router.post(
  "/request",
  protect,
  restrictTo("member"),
  validate(requestSchema),
  borrowCodeController.requestBorrow,
);

// ─── Librarian / Admin routes ─────────────────────────────────────────────────

// GET /api/v1/borrow/requests  — pending/approved/declined requests list
router.get(
  "/requests",
  protect,
  restrictTo("admin", "librarian"),
  borrowCodeController.listRequests,
);

// GET /api/v1/borrow/request/:code  — look up a request before confirming
router.get(
  "/request/:code",
  protect,
  restrictTo("admin", "librarian"),
  borrowCodeController.getRequest,
);

// POST /api/v1/borrow/confirm  — librarian confirms the borrow
router.post(
  "/confirm",
  protect,
  restrictTo("admin", "librarian"),
  validate(confirmSchema),
  borrowCodeController.confirmBorrow,
);

// PATCH /api/v1/borrow/requests/:id/approve  — approve a pending request
router.patch(
  "/requests/:id/approve",
  protect,
  restrictTo("admin", "librarian"),
  validate(approveSchema),
  borrowCodeController.approveRequest,
);

// PATCH /api/v1/borrow/requests/:id/decline  — decline a pending request
router.patch(
  "/requests/:id/decline",
  protect,
  restrictTo("admin", "librarian"),
  borrowCodeController.declineRequest,
);

// POST /api/v1/borrow/return  — librarian returns the book
router.post(
  "/return",
  protect,
  restrictTo("admin", "librarian"),
  validate(returnSchema),
  borrowCodeController.returnBorrow,
);

module.exports = router;
