const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const premiumController = require("../controllers/premium");

router.get("/subscribe", isLoggedIn, premiumController.showSubscribe);
router.post("/create-order", isLoggedIn, premiumController.createOrder);
router.post("/verify", isLoggedIn, premiumController.verifyPayment);

module.exports = router;
