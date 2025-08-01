// controllers/listings.js
const Listing = require("../models/listing");
const Review = require("../models/review");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ================= INDEX PAGE =================
module.exports.index = async (req, res) => {
  let { q = "", category = "all", sort = "" } = req.query;
  const queryObj = {};

  if (q) {
    queryObj.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } }
    ];
  }

  if (category !== "all") {
    queryObj.category = category;
  }

  let listingsQuery = Listing.find(queryObj);
  if (sort === "priceAsc") listingsQuery = listingsQuery.sort({ price: 1 });
  else if (sort === "priceDesc") listingsQuery = listingsQuery.sort({ price: -1 });
  else if (sort === "latest") listingsQuery = listingsQuery.sort({ createdAt: -1 });

  const allListings = await listingsQuery.exec();

  const dbCategories = await Listing.distinct("category");
  const fallbackCategories = [
    "trending", "room", "iconic cities", "mountains", "castles",
    "amazing pools", "camping", "farms", "arctic", "domes", "boats"
  ];
  const categories = [...new Set([...dbCategories, ...fallbackCategories])];

  res.render("listings/index", {
    allListings,
    searchParams: { q, category, sort },
    categories,
    currentUser: req.user || null,
    guestWishlist: req.session.guestWishlist || []
  });
};

// ================= NEW FORM =================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new", { currentUser: req.user || null });
};

// ================= SHOW LISTING =================
module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show", {
    listing,
    currentUser: req.user || null,
    guestWishlist: req.session.guestWishlist || [],
    razorpayKey: process.env.RAZORPAY_KEY_ID
  });
};

// ================= CREATE LISTING =================
module.exports.createListing = async (req, res) => {
  const geoResponse = await geocodingClient
    .forwardGeocode({ query: req.body.listing.location, limit: 1 })
    .send();

  const feature = geoResponse.body.features[0];
  if (!feature) {
    req.flash("error", "Invalid location. Please enter a valid location.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  newListing.geometry = feature.geometry;
  await newListing.save();

  req.flash("success", "Listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

// ================= UPDATE LISTING =================
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

// ================= DELETE LISTING =================
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};

// ================= EDIT FORM =================
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/edit", {
    listing,
    originalImageUrl: listing.image?.url || "/images/default.jpg",
    currentUser: req.user || null
  });
};

// ================= CREATE REVIEW =================
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("reviews");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const hasReviewed = listing.reviews.some(
    review => review.author && review.author.equals(req.user._id)
  );
  if (hasReviewed) {
    req.flash("error", "You have already submitted a review.");
    return res.redirect(`/listings/${listing._id}`);
  }

  const review = new Review(req.body.review);
  review.author = req.user._id;
  await review.save();

  listing.reviews.push(review);
  await listing.save();

  req.flash("success", "Review added!");
  res.redirect(`/listings/${listing._id}`);
};

// ================= DELETE REVIEW =================
module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
};
