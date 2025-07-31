const express = require("express");
const router = express.Router();
const { isLoggedIn, isOwner } = require("../middleware");
const boostController = require("../controllers/boost");

router.post("/create-order", isLoggedIn, isOwner, boostController.createBoostOrder);
router.post("/verify", isLoggedIn, isOwner, boostController.verifyBoostPayment);

module.exports = router;
