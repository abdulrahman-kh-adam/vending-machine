const express = require("express");
const controller = require("./controller");
const auth = require("../Users/controller");
const router = express.Router();

router.route("/").get(controller.getAllOrders).post(controller.createOrder);
router.route("/:id").get(controller.getOrder);

router.route("/check-order-status/:id").get(controller.checkOrderStatus);
router.route("/mark-as-done/:id").get(controller.markOrderAsDone);

module.exports = router;
