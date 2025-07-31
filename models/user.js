// models/user.js
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  role: {
    type: String,
    enum: ["client", "owner"],
    default: "client",
  },

  // Premium Subscription
  premium: {
    isActive: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    paymentId: { type: String }
  },

  // Monetization Tiers
  plan: { type: String, enum: ["free", "basic", "pro", "enterprise"], default: "free" },

  // Monetization Purchases
  monetization: {
    featuredListings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    boosts: [{ listingId: mongoose.Schema.Types.ObjectId, expiry: Date }],
    deals: [{ listingId: mongoose.Schema.Types.ObjectId, expiry: Date }]
  }
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);
