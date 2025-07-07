const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const booking = require("../controllers/bookings");
const { isLoggedIn, isAdmin, isBookingOwner } = require("../middleware");
const Booking = require("../models/bookings");

const router = express.Router();

// User routes
router.get("/:id/checkout", isLoggedIn, wrapAsync(booking.checkoutForm));
router.post("/:id/create-order", isLoggedIn, wrapAsync(booking.createOrder));
router.post("/verify", isLoggedIn, wrapAsync(booking.verifyAndCreateBooking));

router.get("/my", isLoggedIn, wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings/index", { bookings });
}));

// Cancel booking (User)
router.post("/:bookingId/cancel", isLoggedIn, isBookingOwner, wrapAsync(booking.cancelBooking));

// Admin routes
router.get("/admin", isLoggedIn, isAdmin, wrapAsync(booking.adminPanel));
router.post("/:bookingId/confirm", isLoggedIn, isAdmin, wrapAsync(booking.confirmBooking));
router.post("/:bookingId/refund", isLoggedIn, isAdmin, wrapAsync(booking.refundBooking));

module.exports = router;
