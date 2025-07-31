const Listing = require("./models/listing");
const Review = require("./models/review");
const Booking = require("./models/bookings");
const User = require("./models/user");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema, bookingSchema } = require("./schema");

// ------------------
// AUTH + VALIDATIONS
// ------------------

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

module.exports.isOwner = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "owner") {
    return next();
  }
  req.flash("error", "Only Owners can perform this action.");
  res.redirect("/listings");
};

module.exports.isClient = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "client") {
    return next();
  }
  req.flash("error", "Only Clients can perform this action.");
  res.redirect("/listings");
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

// -------------------------
// ✅ WISHLIST FUNCTIONALITY
// -------------------------

module.exports.previewWishlist = async (req, res) => {
  try {
    if (!req.user) {
      const guestWishlist = req.session.wishlist || [];
      const listings = await Listing.find({ _id: { $in: guestWishlist } }).limit(3);
      return res.json({
        items: listings,
        count: guestWishlist.length,
        guest: true
      });
    }

    const user = await User.findById(req.user._id).populate("wishlist");
    const topThree = user.wishlist.slice(0, 3);
    res.json({
      items: topThree,
      count: user.wishlist.length,
      guest: false
    });
  } catch (err) {
    console.error("Error in previewWishlist:", err);
    res.status(500).json({ error: "Failed to load wishlist." });
  }
};

module.exports.syncGuestWishlist = async (req, res, next) => {
  if (req.session.wishlist && req.user) {
    const user = await User.findById(req.user._id);
    const merged = new Set([
      ...user.wishlist.map(id => id.toString()),
      ...req.session.wishlist
    ]);
    user.wishlist = Array.from(merged);
    await user.save();
    delete req.session.wishlist;
  }
  next();
};

// -------------------------
// ✅ ADMIN PROTECTION
// -------------------------

module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    req.flash("error", "You do not have admin privileges.");
    return res.redirect("/");
  }
  next();
};

// -------------------------
// 💰 MONETIZATION MIDDLEWARE
// -------------------------

// Check if Owner is Premium
module.exports.isPremiumOwner = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "owner" && req.user.isPremium) {
    return next();
  }
  req.flash("error", "You must have a Premium subscription to access this feature.");
  res.redirect("/premium");
};

// Check if Listing has active boost
module.exports.hasBoostAccess = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (listing && listing.boostExpiry && listing.boostExpiry > Date.now()) {
    return next();
  }
  req.flash("error", "This feature is available only for boosted listings.");
  res.redirect(`/listings/${req.params.id}/boost`);
};

// Apply commission logic
module.exports.applyCommission = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    res.locals.commissionRate = 0.10; // 10% commission
  } else {
    res.locals.commissionRate = 0;
  }
  next();
};
