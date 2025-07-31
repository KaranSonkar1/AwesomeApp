module.exports.setPlan = async (req, res) => {
  const { plan } = req.body;
  await User.findByIdAndUpdate(req.user._id, { plan });
  req.flash("success", `You are now on the ${plan} plan!`);
  res.redirect("/dashboard");
};
