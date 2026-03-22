const { z } = require("zod");
const router = require("express").Router();
const membersController = require("../controllers/members.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Allow admin/librarian OR the member themselves
const selfOrStaff = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "librarian") return next();
  const member = await prisma.member.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!member || member.userId !== req.user.id) {
    return next(
      new ApiError(403, "You do not have permission to perform this action."),
    );
  }
  next();
});

const createSchema = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .refine((v) => /@technoindiaeducation\.com$/i.test(v), {
      message: "Email must be a @technoindiaeducation.com address",
    }),
  password: z.string().min(6).optional(),
  phone: z.string().min(10),
  address: z.string().min(1),
  membershipType: z
    .enum(["basic", "premium", "student", "standard"])
    .optional(),
  expiryDate: z.string().optional(),
  avatarColor: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.get(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  membersController.getAll,
);
router.get(
  "/search",
  protect,
  restrictTo("admin", "librarian"),
  membersController.search,
);
router.get(
  "/:id",
  protect,
  restrictTo("admin", "librarian"),
  membersController.getById,
);
router.post(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  validate(createSchema),
  membersController.create,
);
router.put(
  "/:id",
  protect,
  restrictTo("admin", "librarian"),
  validate(updateSchema),
  membersController.update,
);
router.patch(
  "/:id/toggle-active",
  protect,
  restrictTo("admin", "librarian"),
  membersController.toggleActive,
);
router.delete("/:id", protect, restrictTo("admin"), membersController.remove);
router.get(
  "/:id/borrows",
  protect,
  selfOrStaff,
  membersController.getMemberBorrows,
);
router.get(
  "/:id/fines",
  protect,
  selfOrStaff,
  membersController.getMemberFines,
);

module.exports = router;
