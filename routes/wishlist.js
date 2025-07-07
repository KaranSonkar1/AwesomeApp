const express = require("express");
const router = express.Router();
const { isLoggedIn, previewWishlist } = require("../middleware");
const Listing = require("../models/listing");
const User = require("../models/user");

// Toggle wishlist (for both logged-in and guests)
router.post("/toggle/:id", async (req, res) => {
  const { id } = req.params;

  if (!await Listing.exists({ _id: id }))
    return res.status(404).json({ error: "Listing not found" });

  if (req.isAuthenticated()) {
    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(id);

    if (index === -1) {
      user.wishlist.push(id);
      await user.save();
      return res.json({ inWishlist: true });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      return res.json({ inWishlist: false });
    }
  } else {
    // Guest user
    req.session.wishlist = req.session.wishlist || [];
    const wishlist = req.session.wishlist;

    const index = wishlist.indexOf(id);
    if (index === -1) {
      wishlist.push(id);
      req.session.wishlist = wishlist;
      return res.json({ inWishlist: true, guest: true });
    } else {
      req.session.wishlist = wishlist.filter(w => w !== id);
      return res.json({ inWishlist: false, guest: true });
    }
  }
});

// ✅ Preview wishlist for navbar dropdown
router.get("/preview", previewWishlist);

module.exports = router;
