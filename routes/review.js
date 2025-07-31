// routes/review.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const reviewController = require("../controllers/reviews");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");

// ================= CREATE REVIEW =================
router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview)
);

// ================= EDIT REVIEW FORM =================
router.get(
  "/:reviewId/edit",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.renderEditForm)
);

// ================= UPDATE REVIEW =================
router.put(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  validateReview,
  wrapAsync(reviewController.updateReview)
);

// ================= DELETE REVIEW =================
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
