const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    role: {
    type: String,
    enum: ["client", "owner"],
    default: "client",
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
