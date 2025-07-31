// controllers/bookings.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/bookings");
const Listing = require("../models/listing");
const { sendStatusEmail } = require("../utils/email");

const SERVICE_FEE_PERCENT = 5; // You earn this % on each booking

// ✅ GET: Show checkout form with already booked dates
module.exports.checkoutForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const bookings = await Booking.find({ listing: id });

  const bookedDates = bookings.map(b => ({
    checkIn: b.checkIn.toISOString().split("T")[0],
    checkOut: b.checkOut.toISOString().split("T")[0],
  }));

  res.render("bookings/checkout", { listing, bookedDates });
};

// ✅ POST: Create Razorpay order
module.exports.createOrder = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.body;
  const listing = await Listing.findById(id);

  if (!listing) return res.status(404).json({ error: "Listing not found." });

  // Prevent overlapping bookings
  const overlappingBookings = await Booking.find({
    listing: id,
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
  });
  if (overlappingBookings.length > 0) {
    return res.status(400).json({ error: "Selected dates are already booked." });
  }

  // Calculate number of days
  const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
  if (isNaN(days) || days <= 0) {
    return res.status(400).json({ error: "Check-out must be after check-in." });
  }

  // ✅ Price calculation with Service Fee
  const totalAmount = listing.price * days;
  const serviceFee = (totalAmount * SERVICE_FEE_PERCENT) / 100;
  const grandTotal = totalAmount + serviceFee;

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  try {
    const order = await razorpay.orders.create({
      amount: grandTotal * 100, // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      order,
      totalAmount,
      serviceFee,
      grandTotal,
      checkIn,
      checkOut,
      listing: { _id: listing._id, title: listing.title }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
};

// ✅ POST: Verify Razorpay payment and create booking
module.exports.verifyAndCreateBooking = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    listingId,
    checkIn,
    checkOut,
    grandTotal
  } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  // Final check for overlapping bookings
  const overlapping = await Booking.find({
    listing: listingId,
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
  });
  if (overlapping.length > 0) {
    return res.status(400).json({ error: "Dates were booked just now. Try different dates." });
  }

  // Save booking with service fee details
  const booking = new Booking({
    listing: listingId,
    user: req.user._id,
    checkIn,
    checkOut,
    price: grandTotal,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    status: "Confirmed"
  });
  await booking.save();

  const listing = await Listing.findById(listingId).populate("owner");

  await sendStatusEmail(req.user.email, "Confirmed", {
    listing,
    checkIn,
    checkOut,
    price: grandTotal
  });

  res.status(200).json({ message: "Booking successful!" });
};

// ✅ POST: Cancel booking by user
module.exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking || booking.status !== "Confirmed") {
    req.flash("error", "Invalid or already cancelled/refunded booking.");
    return res.redirect("/bookings/my");
  }

  booking.status = "Cancelled";
  await booking.save();

  await sendStatusEmail(req.user.email, "Cancelled", {
    listing: booking.listing,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    price: booking.price
  });

  req.flash("success", "Booking cancelled.");
  res.redirect("/bookings/my");
};

// ✅ GET: Admin panel to view all bookings
module.exports.adminPanel = async (req, res) => {
  const bookings = await Booking.find({})
    .populate("listing")
    .populate("user")
    .sort({ createdAt: -1 });

  res.render("admin/bookings", { bookings });
};

// ✅ POST: Admin confirm booking
module.exports.confirmBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing user");

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/bookings/admin");
  }

  booking.status = "Confirmed";
  await booking.save();

  await sendStatusEmail(booking.user.email, "Confirmed", {
    listing: booking.listing,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    price: booking.price
  });

  req.flash("success", "Booking confirmed.");
  res.redirect("/bookings/admin");
};

// ✅ POST: Admin refund booking via Razorpay
module.exports.refundBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing user");

  if (!booking || booking.status === "Refunded") {
    req.flash("error", "Booking already refunded or not found.");
    return res.redirect("/bookings/admin");
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  try {
    await razorpay.payments.refund(booking.paymentId, {
      amount: booking.price * 100
    });

    booking.status = "Refunded";
    await booking.save();

    await sendStatusEmail(booking.user.email, "Refunded", {
      listing: booking.listing,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      price: booking.price
    });

    req.flash("success", "Refund processed successfully.");
    res.redirect("/bookings/admin");
  } catch (err) {
    console.error("Refund error:", err);
    req.flash("error", "Refund failed. Please try again.");
    res.redirect("/bookings/admin");
  }
};
