const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirectUrl } = require("../middleware");
const router = express.Router();
const userController = require("../controllers/users");

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

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


router.get("/logout", userController.logout);

router.get("/choose-role", userController.renderRoleForm);
router.post("/choose-role", wrapAsync(userController.assignRole));


module.exports = router;
