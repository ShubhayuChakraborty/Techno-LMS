const { z } = require("zod");
const router = require("express").Router();
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

// ─── Auth-specific rate limiter ──────────────────────────────────────────────
// Stricter than the global limiter: 10 attempts per 15 min, only failed requests count.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again in 15 minutes.",
  },
  keyGenerator: (req) => req.body?.email || ipKeyGenerator(req), // rate-limit per email, fallback to IP
});

// ─── Validation schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["admin", "librarian", "member"]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  membershipType: z
    .enum(["basic", "premium", "student", "standard"])
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  avatarColor: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const verifyAndRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// Legacy direct register (admin-created accounts via admin panel — still available)
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.patch(
  "/profile",
  protect,
  validate(updateProfileSchema),
  authController.updateProfile,
);

// OTP-based public registration
router.post(
  "/send-registration-otp",
  authLimiter,
  validate(sendOtpSchema),
  authController.sendRegistrationOtp,
);
router.post(
  "/verify-and-register",
  authLimiter,
  validate(verifyAndRegisterSchema),
  authController.verifyAndRegister,
);

// Forgot / reset password
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// Register Librarian — admin only
const registerLibrarianSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

router.post(
  "/register-librarian",
  protect,
  restrictTo("admin"),
  validate(registerLibrarianSchema),
  authController.registerLibrarian,
);

// Google OAuth
router.post(
  "/google",
  authLimiter,
  validate(googleAuthSchema),
  authController.googleAuth,
);

module.exports = router;
