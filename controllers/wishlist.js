const User = require("../models/user");
const Listing = require("../models/listing");

module.exports.addToWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user.wishlist.includes(id)) {
    user.wishlist.push(id);
    await user.save();
    req.flash("success", "Added to your wishlist!");
  }
  res.redirect("back");
};

module.exports.removeFromWishlist = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: id }
  });
  req.flash("success", "Removed from wishlist.");
  res.redirect("back");
};

module.exports.viewWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.render("wishlist/index", { listings: user.wishlist });
};

module.exports.previewWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    const items = user?.wishlist || [];
    res.json({
      items: items.map(l => ({ _id: l._id, title: l.title })),
      count: items.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load wishlist." });
  }
};
