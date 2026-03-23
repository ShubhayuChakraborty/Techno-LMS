const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const hasCloudinaryConfig =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;
const isProduction = process.env.NODE_ENV === "production";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();
  const looksLikeImage = mime.startsWith("image/");

  if (ALLOWED_MIME.has(mime) || ALLOWED_EXT.has(ext) || looksLikeImage) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid image format. Please upload JPG, PNG, WEBP, AVIF, or HEIC.",
      ),
      false,
    );
  }
};

const uploadsRoot = path.join(__dirname, "../../public/uploads");
const avatarsDir = path.join(uploadsRoot, "avatars");
const booksDir = path.join(uploadsRoot, "books");

let localStorageReady = false;
try {
  if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
  if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });
  localStorageReady = true;
} catch {
  localStorageReady = false;
}

const localAvatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const localBookStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, booksDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `book-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const bookCoverStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "lms/book-covers",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"],
        transformation: [{ width: 400, height: 600, crop: "limit" }],
      },
    })
  : !isProduction && localStorageReady
    ? localBookStorage
    : multer.memoryStorage();

const avatarStorage = multer.memoryStorage();

const uploadBookCover = multer({
  storage: bookCoverStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).single("cover");

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("avatar");

module.exports = {
  uploadBookCover,
  uploadAvatar,
  cloudinary,
  hasCloudinaryConfig,
  localStorageReady,
};
