const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/waanderlust";

main()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  let user = await User.findOne();
  if (!user) {
    user = new User({ username: "admin", email: "admin@example.com" });
    await User.register(user, "adminpass");
  }

  for (let obj of initData.data) {
    const geoData = await geocoder
      .forwardGeocode({
        query: `${obj.location}, ${obj.country}`,
        limit: 1,
      })
      .send();

    const listing = new Listing({
      ...obj,
      owner: user._id,
      geometry: geoData.body.features[0]?.geometry || {
        type: "Point",
        coordinates: [0, 0],
      },
    });

    await listing.save();
  }

  console.log("✅ Listings initialized with real geometry and owner:", user.username);
};

initDB();
