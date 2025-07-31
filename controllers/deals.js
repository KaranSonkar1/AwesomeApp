const Listing = require("../models/listing");

module.exports.markLastMinuteDeal = async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.id, {
    lastMinuteDeal: true,
    dealExpiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });
  req.flash("success", "Listing added to Last-Minute Deals!");
  res.redirect("/listings");
};
