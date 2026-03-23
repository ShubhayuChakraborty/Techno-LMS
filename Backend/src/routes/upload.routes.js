const router = require("express").Router();
const prisma = require("../config/db");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const {
  uploadBookCover,
  uploadAvatar,
  cloudinary,
  hasCloudinaryConfig,
  localStorageReady,
} = require("../middleware/upload");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const toDataUrl = (file) => {
  if (!file?.buffer || !file?.mimetype) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const uploadAvatarBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (!file?.buffer) {
      reject(new Error("Missing avatar buffer"));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lms/avatars",
        resource_type: "image",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(file.buffer);
  });

const resolveUploadedUrl = (file, type) => {
  if (!file) return null;

  if (file.path && /^https?:\/\//i.test(file.path)) return file.path;
  if (file.secure_url) return file.secure_url;
  if (file.filename) {
    const folder = type === "avatar" ? "avatars" : "books";
    return `/uploads/${folder}/${file.filename}`;
  }
  if (type === "avatar") {
    const dataUrl = toDataUrl(file);
    if (dataUrl) return dataUrl;
  }
  if (file.path) return file.path;
  return null;
};

// POST /api/v1/upload/book-cover
router.post(
  "/book-cover",
  protect,
  restrictTo("admin", "librarian"),
  (req, res, next) => {
    uploadBookCover(req, res, (err) => {
      if (err) return next(new ApiError(400, err.message));
      if (!req.file) return next(new ApiError(400, "No file uploaded."));

      const fileUrl = resolveUploadedUrl(req.file, "book");
      if (!fileUrl) {
        if (!hasCloudinaryConfig && !localStorageReady) {
          return next(
            new ApiError(
              503,
              "Image upload storage is not configured on server.",
            ),
          );
        }
        return next(new ApiError(500, "Failed to resolve file URL."));
      }
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { url: fileUrl },
            "Cover uploaded successfully.",
          ),
        );
    });
  },
);

// POST /api/v1/upload/avatar
router.post("/avatar", protect, (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return next(new ApiError(400, err.message));
    if (!req.file) return next(new ApiError(400, "No file uploaded."));

    let fileUrl = resolveUploadedUrl(req.file, "avatar");

    if (req.file?.buffer && hasCloudinaryConfig) {
      try {
        fileUrl = await uploadAvatarBufferToCloudinary(req.file);
      } catch {
        // Keep fallback URL (data URL) so upload still succeeds.
      }
    }

    if (!fileUrl) {
      if (!hasCloudinaryConfig && !localStorageReady) {
        return next(
          new ApiError(
            503,
            "Image upload storage is not configured on server.",
          ),
        );
      }
      return next(new ApiError(500, "Failed to resolve file URL."));
    }

    if (req.user.role === "librarian" || req.user.role === "admin") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true },
      });
      if (!user) return next(new ApiError(404, "User not found."));

      await prisma.librarian.upsert({
        where: { userId: req.user.id },
        update: { avatarUrl: fileUrl },
        create: {
          userId: req.user.id,
          name: user.name,
          email: user.email,
          avatarUrl: fileUrl,
        },
      });
    } else {
      const updated = await prisma.member.updateMany({
        where: { userId: req.user.id },
        data: { avatarUrl: fileUrl },
      });
      if (updated.count === 0) {
        return next(new ApiError(404, "Member profile not found."));
      }
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, { url: fileUrl }, "Avatar uploaded successfully."),
      );
  });
});

module.exports = router;
