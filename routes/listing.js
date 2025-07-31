// routes/listing.js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");

// ✅ Correct filename: listings.js (plural)
const listingController = require("../controllers/listings");

// Multer for image uploads
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Nested review routes
const reviewRoutes = require("./review");
router.use("/:id/reviews", reviewRoutes);

// =========================
// Normal Listing Routes
// =========================
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("image"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

// =========================
// Featured Listing Routes
// =========================
const featuredController = require("../controllers/featured"); // ✅ Now this file exists

// Create Razorpay order for featuring a listing
router.post(
  "/:id/feature/create-order",
  isLoggedIn,
  isOwner,
  wrapAsync(featuredController.createFeatureOrder)
);

// Verify payment & mark listing as featured
router.post(
  "/:id/feature/verify",
  isLoggedIn,
  isOwner,
  wrapAsync(featuredController.verifyFeaturePayment)
);

module.exports = router;
