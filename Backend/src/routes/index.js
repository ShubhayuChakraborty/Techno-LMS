const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/books", require("./books.routes"));
router.use("/members", require("./members.routes"));
router.use("/librarian", require("./librarian.routes"));
router.use("/borrows", require("./borrows.routes"));
router.use("/borrow", require("./borrowCode.routes"));
router.use("/fines", require("./fines.routes"));
router.use("/recommendations", require("./recommendations.routes"));
router.use("/reports", require("./reports.routes"));
router.use("/upload", require("./upload.routes"));

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
