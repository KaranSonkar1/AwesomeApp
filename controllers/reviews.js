// controllers/reviews.js
const Listing = require("../models/listing");
const Review = require("../models/review");

// ================= CREATE REVIEW =================
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("reviews");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // Prevent duplicate review by same user
  const alreadyReviewed = listing.reviews.some(
    (r) => r.author && r.author.equals(req.user._id)
  );
  if (alreadyReviewed) {
    req.flash("error", "You have already reviewed this listing.");
    return res.redirect(`/listings/${listing._id}`);
  }

  const review = new Review({
    ...req.body.review,
    author: req.user._id
  });

  await review.save();
  listing.reviews.push(review._id);
  await listing.save();

  req.flash("success", "Review added successfully!");
  res.redirect(`/listings/${listing._id}`);
};

// ================= RENDER EDIT FORM =================
module.exports.renderEditForm = async (req, res) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect(`/listings/${id}`);
  }

  res.render("reviews/editReview", { review, listingId: id });
};

// ================= UPDATE REVIEW =================
module.exports.updateReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Review.findByIdAndUpdate(reviewId, req.body.review);
  req.flash("success", "Review updated successfully!");
  res.redirect(`/listings/${id}`);
};

// ================= DELETE REVIEW =================
module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted successfully!");
  res.redirect(`/listings/${id}`);
};
