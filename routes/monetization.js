// routes/monetization.js
const express = require("express");
const router = express.Router();
const monetization = require("../controllers/monetization");
const { isLoggedIn, isOwner } = require("../middleware");

// Monetization Order Creation
router.post("/boost/:id/order", isLoggedIn, isOwner, monetization.createBoostOrder);
router.post("/featured/:id/order", isLoggedIn, isOwner, monetization.createFeaturedOrder);
router.post("/deal/:id/order", isLoggedIn, isOwner, monetization.createDealOrder);

// Payment Verification
router.post("/boost/:id/verify", isLoggedIn, isOwner, monetization.verifyBoostPayment);
router.post("/featured/:id/verify", isLoggedIn, isOwner, monetization.verifyFeaturedPayment);
router.post("/deal/:id/verify", isLoggedIn, isOwner, monetization.verifyDealPayment);

module.exports = router;
