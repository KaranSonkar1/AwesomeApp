if (process.env.NODE_ENV !== "production") require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");

// Routes
const listingRoutes = require("./routes/listing");
const userRoutes = require("./routes/user");
const bookingRoutes = require("./routes/bookings");
const wishlistRoutes = require("./routes/wishlist");

// Middleware
const { syncGuestWishlist } = require("./middleware");

// ✅ MongoDB Connection
const dbUrl = process.env.ATLASDB_URL;

mongoose
  .connect(dbUrl)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Middleware Setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Session Store (connect-mongo)
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600 // session will only update once in 24 hours
});

store.on("error", function (e) {
  console.log("❌ SESSION STORE ERROR", e);
});

// ✅ Session Configuration
const sessionConfig = {
  store,
  name: "session", // to avoid default "connect.sid"
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true, // enable in production with HTTPS
    sameSite: "lax",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// ✅ Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ✅ Sync guest wishlist on login
app.use(syncGuestWishlist);

// ✅ Global Template Variables
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.guestWishlist = req.session.wishlist || [];
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ✅ Routes
app.use("/", userRoutes);
app.use("/listings", listingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/wishlist", wishlistRoutes);

// ✅ Home Route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.get("/privacy", (req, res) => {
  res.render("static/privacy");
});

app.get("/terms", (req, res) => {
  res.render("static/terms");
});


// ✅ 404 Handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// ✅ Centralized Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error", {
    message: err.message,
    errors: err.errors || [],
  });
});

// ✅ Start Server
app.listen(8080, () => {
  console.log("🚀 Server running on http://localhost:8080");
});
