const { z } = require("zod");
const router = require("express").Router();
const borrowsController = require("../controllers/borrows.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const issueSchema = z.object({
  memberId: z.string().min(1),
  bookId: z.string().min(1),
  borrowDays: z.number().int().min(1).max(180).optional(),
});

router.get(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  borrowsController.getAll,
);
router.get(
  "/overdue",
  protect,
  restrictTo("admin", "librarian"),
  borrowsController.getOverdue,
);
router.get("/:id", protect, borrowsController.getById);
router.post(
  "/issue",
  protect,
  restrictTo("admin", "librarian"),
  validate(issueSchema),
  borrowsController.issue,
);
router.patch(
  "/:id/return",
  protect,
  restrictTo("admin", "librarian"),
  borrowsController.returnBook,
);
router.patch("/:id/extend", protect, borrowsController.extend);
router.post(
  "/sync-overdue",
  protect,
  restrictTo("admin"),
  borrowsController.syncOverdue,
);

module.exports = router;
