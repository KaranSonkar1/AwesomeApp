const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const { q = "", category = "all" } = req.query;
  const queryObj = {};

  if (q) {
    queryObj.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  if (category !== "all") {
    queryObj.category = category;
  }

  const allListings = await Listing.find(queryObj);
  const dbCategories = await Listing.distinct("category");
  const fallbackCategories = [
    "trending", "room", "iconic cities", "mountains", "castles",
    "amazing pools", "camping", "farms", "artic", "domes", "boats"
  ];
  const categories = [...new Set([...dbCategories, ...fallbackCategories])];

  res.render("listings/index", {
    allListings,
    searchParams: { q, category },
    categories,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show", { listing });
};

module.exports.createListing = async (req, res) => {
  const geoResponse = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const feature = geoResponse.body.features[0];

  if (!feature) {
    req.flash("error", "Invalid location. Please enter a valid location.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  newListing.geometry = feature.geometry;
  await newListing.save();

  req.flash("success", "Listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/edit", { listing, originalImageUrl: listing.image?.url || "/images/default.jpg" });
};
