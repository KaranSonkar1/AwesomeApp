// models/monetization.js
const mongoose = require("mongoose");

const monetizationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
  type: { 
    type: String, 
    enum: ["boost", "featured", "subscription", "lead", "deal"], 
    required: true 
  },
  plan: String, // e.g., Basic, Premium, Pro for subscription
  amount: Number,
  currency: { type: String, default: "INR" },
  paymentId: String,
  orderId: String,
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  expiry: Date,
}, { timestamps: true });

module.exports = mongoose.model("Monetization", monetizationSchema);
