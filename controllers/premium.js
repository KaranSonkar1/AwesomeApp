const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/user");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.showSubscribe = (req, res) => {
  if (req.user.role !== "owner") {
    req.flash("error", "Only owners can subscribe to premium.");
    return res.redirect("/listings");
  }
  res.render("premium/subscribe", { razorpayKey: process.env.RAZORPAY_KEY_ID });
};

module.exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: 99900, // ₹999 in paise
      currency: "INR",
      receipt: `premium_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Unable to create order" });
  }
};

module.exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const digest = hmac.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const user = await User.findById(req.user._id);
    user.premium.isActive = true;
    user.premium.startDate = new Date();
    user.premium.endDate = new Date();
    user.premium.endDate.setMonth(user.premium.startDate.getMonth() + 1);
    user.premium.paymentId = razorpay_payment_id;
    await user.save();

    res.json({ success: true, message: "Premium activated" });
  } catch (err) {
    console.error("Error verifying Razorpay payment:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
};
