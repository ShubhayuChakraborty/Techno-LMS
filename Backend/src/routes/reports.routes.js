const router = require("express").Router();
const reportsController = require("../controllers/reports.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get(
  "/dashboard",
  protect,
  restrictTo("admin", "librarian"),
  reportsController.getDashboard,
);
router.get(
  "/analytics",
  protect,
  restrictTo("admin"),
  reportsController.getAdminAnalytics,
);

router.get(
  "/summary",
  protect,
  restrictTo("admin", "librarian"),
  reportsController.getSummary,
);
router.get(
  "/monthly-borrows",
  protect,
  restrictTo("admin", "librarian"),
  reportsController.getMonthlyBorrows,
);
router.get(
  "/category-stats",
  protect,
  restrictTo("admin", "librarian"),
  reportsController.getCategoryStats,
);
router.get("/popular-books", protect, reportsController.getPopularBooks);
router.get(
  "/member-growth",
  protect,
  restrictTo("admin", "librarian"),
  reportsController.getMemberGrowth,
);

module.exports = router;
