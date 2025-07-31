// controllers/monetization.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Listing = require("../models/listing");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper to verify payment signature
function verifySignature(order_id, payment_id, signature) {
  const body = order_id + "|" + payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  return expected === signature;
}

// ================= CREATE BOOST ORDER =================
module.exports.createBoostOrder = async (req, res) => {
  try {
    const options = { amount: 199 * 100, currency: "INR" }; // ₹199 boost fee
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Boost order creation failed" });
  }
};

module.exports.verifyBoostPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const listing = await Listing.findById(req.params.id);

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.json({ success: false });
  }

  listing.isFeatured = true;
  listing.boostExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  listing.featuredPaymentId = razorpay_payment_id;
  await listing.save();

  res.json({ success: true });
};

// ================= CREATE FEATURED ORDER =================
module.exports.createFeaturedOrder = async (req, res) => {
  try {
    const options = { amount: 999 * 100, currency: "INR" }; // ₹999 Featured fee
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Featured order creation failed" });
  }
};

module.exports.verifyFeaturedPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const listing = await Listing.findById(req.params.id);

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.json({ success: false });
  }

  listing.isFeatured = true;
  listing.featuredExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  listing.featuredPaymentId = razorpay_payment_id;
  await listing.save();

  res.json({ success: true });
};

// ================= CREATE DEAL ORDER =================
module.exports.createDealOrder = async (req, res) => {
  try {
    const options = { amount: 99 * 100, currency: "INR" }; // ₹99 Deal fee
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Deal order creation failed" });
  }
};

module.exports.verifyDealPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const listing = await Listing.findById(req.params.id);

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.json({ success: false });
  }

  listing.lastMinuteDeal = true;
  listing.dealExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
  await listing.save();

  res.json({ success: true });
};
