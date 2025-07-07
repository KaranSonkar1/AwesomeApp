const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  price: { type: Number, required: true },

  // Razorpay Info
  paymentId: String,
  orderId: String,

  // Booking status
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled", "Refunded"], // ✅ Added "Cancelled"
    default: "Pending"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);
