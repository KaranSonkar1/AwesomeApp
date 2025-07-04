const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/bookings");
const Listing = require("../models/listing");
const transporter = require("../utils/email");

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

module.exports.createOrder = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.body;
  const listing = await Listing.findById(id);

  if (!listing) return res.status(404).json({ error: "Listing not found." });

  const overlappingBookings = await Booking.find({
    listing: id,
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
  });

  if (overlappingBookings.length > 0) {
    return res.status(400).json({ error: "Selected dates are already booked for this listing." });
  }

  const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
  if (isNaN(days) || days <= 0) {
    return res.status(400).json({ error: "Check-out must be after check-in." });
  }

  let price = listing.price * days;
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      order,
      price,
      checkIn,
      checkOut,
      listing: { _id: listing._id, title: listing.title },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
};

module.exports.verifyAndCreateBooking = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    listingId,
    checkIn,
    checkOut,
    price
  } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  const overlapping = await Booking.find({
    listing: listingId,
    $or: [
      { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
  });

  if (overlapping.length > 0) {
    return res.status(400).json({ error: "Dates were booked just now. Try different dates." });
  }

  const booking = new Booking({
    listing: listingId,
    user: req.user._id,
    checkIn,
    checkOut,
    price,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });

  await booking.save();

  const listing = await Listing.findById(listingId);

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: req.user.email,
    subject: "Booking Confirmed!",
    html: `
      <h1>Booking Confirmed</h1>
      <p><strong>Listing:</strong> ${listing.title}</p>
      <p><strong>Check In:</strong> ${checkIn}</p>
      <p><strong>Check Out:</strong> ${checkOut}</p>
      <p><strong>Total Price:</strong> ₹${price}</p>
    `,
  });

  res.status(200).json({ message: "Booking successful!" });
};
