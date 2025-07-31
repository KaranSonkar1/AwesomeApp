// models/listing.js
const mongoose = require("mongoose");
const Review = require("./review.js");

const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,

  // Main Image
  image: {
    url: String,
    filename: String,
  },

  // Price
  price: {
    type: Number,
    min: 0,
  },

  location: String,
  country: String,

  // Category for filtering/search
  category: {
    type: String,
    enum: [
      "trending",
      "room",
      "iconic cities",
      "mountains",
      "castles",
      "amazing pools",
      "camping",
      "farms",
      "arctic",
      "domes",
      "boats"
    ],
    required: true,
    lowercase: true,
  },

  // Listing owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Reviews
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],

  // Map location
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  // =====================
  // ✅ Monetization Fields
  // =====================

  // Premium Featured Listing
  isFeatured: {
    type: Boolean,
    default: false, // Default: not featured
  },
  featuredExpiresAt: {
    type: Date, // Expiry date for featured status
  },
  featuredPaymentId: {
    type: String, // Razorpay payment ID for tracking
  },

  // Platform Commission
  serviceFeePercent: {
    type: Number,
    default: 5, // Default: 5% commission on bookings
  },

  // Boost Visibility
  boostExpiry: {
    type: Date,
    default: null, // Date until boost is active
  },

  // Last-Minute Deals
  lastMinuteDeal: {
    type: Boolean,
    default: false,
  },
  dealExpiry: {
    type: Date, // When the deal ends
  }
}, { timestamps: true });

// ✅ Auto-delete reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
