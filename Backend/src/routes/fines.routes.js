const router = require("express").Router();
const finesController = require("../controllers/fines.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// Member self-service
router.get("/my", protect, finesController.getMyFines);

router.get(
  "/",
  protect,
  restrictTo("admin", "librarian"),
  finesController.getAll,
);
router.get("/:id", protect, finesController.getById);

// Allow member to pay their own fine; admin/librarian can pay any
router.patch("/:id/pay", protect, finesController.payMine);
router.patch("/:id/waive", protect, restrictTo("admin"), finesController.waive);

// Pay all fines for a member — admin/librarian OR the member themselves
router.post("/pay-all/:memberId", protect, finesController.payMyAll);

module.exports = router;
