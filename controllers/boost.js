const Listing = require("../models/listing");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.createBoostOrder = async (req, res) => {
  const amount = 19900; // ₹199 in paise
  const options = { amount, currency: "INR", receipt: `boost_${Date.now()}` };
  const order = await razorpay.orders.create(options);
  res.json(order);
};

module.exports.verifyBoostPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, listingId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await Listing.findByIdAndUpdate(listingId, {
      boostExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    return res.json({ success: true });
  }
  res.json({ success: false });
};
