const Ad = require("../models/ad");

module.exports.getActiveAds = async () => {
  return Ad.find({
    active: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).populate("listing");
};
