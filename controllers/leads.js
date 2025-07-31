const Lead = require("../models/lead");

module.exports.purchaseLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  lead.purchasedBy = req.user._id;
  await lead.save();
  req.flash("success", "Lead purchased successfully!");
  res.redirect("/leads");
};
