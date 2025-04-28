const express = require("express");
const controller = require("./controller");
const router = express.Router();

router.post("/signup", controller.signup);
router.post("/signin", controller.signin);
router.get("/signout", controller.signout);

router.patch("/update-password", controller.protect, controller.updatePassword);

router.get("/me", controller.protect, controller.getSelf);
router.patch(
  "/update-self",
  controller.protect,
  controller.uploadUserPhoto,
  controller.resizeUserPhoto,
  controller.updateSelf
);
router.delete("/delete-self", controller.protect, controller.deleteSelf);

router
  .route("/")
  .get(controller.protect, controller.restrictTo("admin"), controller.getAllUsers)
  .post(controller.protect, controller.restrictTo("admin"), controller.createUser);

router
  .route("/:id")
  .get(controller.protect, controller.restrictTo("admin"), controller.getUser)
  .patch(controller.protect, controller.restrictTo("admin"), controller.updateUser)
  .delete(controller.protect, controller.restrictTo("admin"), controller.deleteUser);

module.exports = router;
