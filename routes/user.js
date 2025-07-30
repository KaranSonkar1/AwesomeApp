const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirectUrl, isLoggedIn } = require("../middleware");
const router = express.Router();
const userController = require("../controllers/users");

// Signup routes
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// Login routes
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    userController.login
  );

// Logout
router.get("/logout", userController.logout);

// Role selection
router.get("/choose-role", userController.renderRoleForm);
router.post("/choose-role", wrapAsync(userController.assignRole));

// ✅ My Profile route
router.get("/profile", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/profile", { user });
});

module.exports = router;
