const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup");
};

module.exports.signup = async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;
    const user = new User({ username, email, phone, role });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome to WanderLust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect("/listings");
};

module.exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Logged out!");
    res.redirect("/listings");
  });
};

module.exports.renderRoleForm = (req, res) => {
  res.render("users/chooseRole");
};

module.exports.assignRole = async (req, res) => {
  const { role } = req.body;
  if (!["client", "owner"].includes(role)) {
    req.flash("error", "Invalid role");
    return res.redirect("/choose-role");
  }
  req.user.role = role;
  await req.user.save();
  req.flash("success", `Role set to ${role}`);
  res.redirect("/listings");
};
