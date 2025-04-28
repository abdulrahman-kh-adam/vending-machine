const express = require("express");
const controller = require("./controller");
const router = express.Router();

router.route("/").get(controller.getAllProducts).post(controller.createProduct);
router.route("/:id").get(controller.getProduct).delete(controller.deleteProduct).put(controller.editProduct);

module.exports = router;
