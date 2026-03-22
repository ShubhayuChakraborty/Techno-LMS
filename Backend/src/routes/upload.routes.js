const router = require("express").Router();
const prisma = require("../config/db");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { uploadBookCover, uploadAvatar } = require("../middleware/upload");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// POST /api/v1/upload/book-cover
router.post(
  "/book-cover",
  protect,
  restrictTo("admin", "librarian"),
  (req, res, next) => {
    uploadBookCover(req, res, (err) => {
      if (err) return next(new ApiError(400, err.message));
      if (!req.file) return next(new ApiError(400, "No file uploaded."));

      // Cloudinary returns the secure URL in req.file.path
      const fileUrl = req.file.path;
      res
        .status(200)
        .json(new ApiResponse(200, { url: fileUrl }, "Cover uploaded successfully."));
    });
  },
);

// POST /api/v1/upload/avatar
router.post("/avatar", protect, (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return next(new ApiError(400, err.message));
    if (!req.file) return next(new ApiError(400, "No file uploaded."));

    // Cloudinary returns the secure URL in req.file.path
    const fileUrl = req.file.path;

    if (req.user.role === "librarian" || req.user.role === "admin") {
      await prisma.librarian.updateMany({
        where: { userId: req.user.id },
        data: { avatarUrl: fileUrl },
      });
    } else {
      await prisma.member.updateMany({
        where: { userId: req.user.id },
        data: { avatarUrl: fileUrl },
      });
    }

    res
      .status(200)
      .json(new ApiResponse(200, { url: fileUrl }, "Avatar uploaded successfully."));
  });
});

module.exports = router;
