const { z } = require("zod");
const router = require("express").Router();
const booksController = require("../controllers/books.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const createSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().min(10),
  category: z.string().min(1),
  year: z
    .number()
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 1),
  description: z.string().min(1),
  publisher: z.string().optional(),
  coverUrl: z.string().url().optional(),
  totalCopies: z.number().int().min(1),
});

const updateSchema = createSchema.partial();

router.get("/", protect, booksController.getAll);
router.get("/search", protect, booksController.search);
router.get("/:id", protect, booksController.getById);
router.post(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  validate(createSchema),
  booksController.create,
);
router.put(
  "/:id",
  protect,
  restrictTo("admin", "librarian"),
  validate(updateSchema),
  booksController.update,
);
router.delete("/:id", protect, restrictTo("admin"), booksController.remove);

// Nested reviews routes: /api/v1/books/:bookId/reviews
router.use("/:bookId/reviews", require("./reviews.routes"));

module.exports = router;
