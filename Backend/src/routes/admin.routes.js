const { z } = require("zod");
const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  avatarColor: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

router.use(protect, restrictTo("admin"));

router.get("/profile", adminController.getProfile);
router.patch(
  "/profile",
  validate(updateProfileSchema),
  adminController.updateProfile,
);
router.put(
  "/change-password",
  validate(changePasswordSchema),
  adminController.changePassword,
);

module.exports = router;
