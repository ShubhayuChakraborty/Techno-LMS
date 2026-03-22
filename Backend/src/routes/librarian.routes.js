const { z } = require("zod");
const router = require("express").Router();
const librarianController = require("../controllers/librarian.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

// ─── Validation schemas ──────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  avatarColor: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

// GET  /api/v1/librarian  (admin only)
router.get("/", protect, restrictTo("admin"), librarianController.getAll);

// ─── All routes require a valid access token and librarian role ──────────────

router.use(protect, restrictTo("librarian", "admin"));

// GET  /api/v1/librarian/profile
router.get("/profile", librarianController.getProfile);

// PATCH /api/v1/librarian/profile
router.patch(
  "/profile",
  validate(updateProfileSchema),
  librarianController.updateProfile,
);

module.exports = router;
