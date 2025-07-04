const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const booking = require("../controllers/bookings");
const { isLoggedIn } = require("../middleware");
const Booking = require("../models/bookings");

const router = express.Router();

router.get("/:id/checkout", isLoggedIn, wrapAsync(booking.checkoutForm));
router.post("/:id/create-order", isLoggedIn, wrapAsync(booking.createOrder));
router.post("/verify", isLoggedIn, wrapAsync(booking.verifyAndCreateBooking));

router.get("/my", isLoggedIn, wrapAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings/index", { bookings });
}));

module.exports = router;
