const express = require("express");
const controller = require("./controller");
const auth = require("../Users/controller");
const router = express.Router();

router.route("/").get(controller.getAllProducts).post(auth.protect, controller.createProduct);
router
  .route("/:id")
  .get(controller.getProduct)
  .delete(auth.protect, controller.deleteProduct)
  .put(auth.protect, controller.editProduct);

module.exports = router;
