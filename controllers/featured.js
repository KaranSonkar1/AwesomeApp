// controllers/featured.js
const Listing = require("../models/listing");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===============================
// Create Razorpay order for featuring a listing
// ===============================
module.exports.createFeatureOrder = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  const options = {
    amount: 19900, // ₹199 (in paise)
    currency: "INR",
    receipt: `feature_${listing._id}_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);

  res.json({
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency
  });
};

// ===============================
// Verify Razorpay payment & mark listing as featured
// ===============================
module.exports.verifyFeaturePayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const { id } = req.params;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    await Listing.findByIdAndUpdate(id, { isFeatured: true });
    req.flash("success", "Listing marked as featured!");
    res.redirect(`/listings/${id}`);
  } else {
    req.flash("error", "Payment verification failed!");
    res.redirect(`/listings/${id}`);
  }
};
