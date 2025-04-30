const express = require("express");
const controller = require("./controller");
const router = express.Router();

router.route("/create-payment").post(controller.createPayment);
router.route("/finish-payment/:id").get(controller.finishPayment);

module.exports = router;
