const router = require("express").Router({ mergeParams: true });
const { protect, restrictTo } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/reviews.controller");

// Public: anyone can read reviews
router.get("/", ctrl.getBookReviews);

// Member only: own review
router.route("/mine").get(protect, restrictTo("member"), ctrl.getMyReview);

router
  .route("/")
  .post(protect, restrictTo("member"), ctrl.upsertReview)
  .delete(protect, restrictTo("member"), ctrl.deleteReview);

module.exports = router;
