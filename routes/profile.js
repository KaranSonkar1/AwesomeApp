router.get("/", isLoggedIn, async (req, res) => {
  res.render("users/profile", { user: req.user });
});
