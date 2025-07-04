const Listing = require("./models/listing");
const Review = require("./models/review");
const Booking = require("./models/bookings");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema, bookingSchema } = require("./schema");

module.exports.isLoggedIn = function (req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect("back");
  }
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to delete this review!");
    return res.redirect("back");
  }
  next();
};

module.exports.isBookingOwner = async (req, res, next) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.user.equals(req.user._id)) {
    req.flash("error", "You do not own this booking.");
    return res.redirect("/bookings");
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};

module.exports.validateBooking = (req, res, next) => {
  const { error } = bookingSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};
