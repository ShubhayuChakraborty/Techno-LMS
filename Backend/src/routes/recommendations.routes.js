const { z } = require("zod");
const router = require("express").Router();
const recsController = require("../controllers/recommendations.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const createSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
  score: z.number().min(0).max(1),
  strategy: z.string().min(1),
  reason: z.string().optional(),
});

// ─── Standard CRUD ───────────────────────────────────────────────────────
router.get("/", protect, recsController.getAll);
router.post(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  validate(createSchema),
  recsController.create,
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "librarian"),
  recsController.remove,
);

// ─── AI-Powered Endpoints ─────────────────────────────────────────────────
// GET  /recommendations/ai/stats          – engine stats + trending insight
// POST /recommendations/ai/generate/:memberId – generate for one member
// POST /recommendations/ai/generate-all   – bulk generate for all members
router.get(
  "/ai/stats",
  protect,
  restrictTo("admin", "librarian"),
  recsController.getAIStats,
);
router.post(
  "/ai/generate/:memberId",
  protect,
  restrictTo("admin", "librarian"),
  recsController.generateForMember,
);
router.post(
  "/ai/generate-all",
  protect,
  restrictTo("admin", "librarian"),
  recsController.generateForAll,
);

// Member: get my personalised recommendations (auto-generates on first visit)
router.get("/me", protect, recsController.getForMe);

module.exports = router;
