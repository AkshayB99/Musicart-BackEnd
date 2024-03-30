const express = require("express");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.protect, authController.logout);
router.get("/", authController.protect, authController.getUser);

router
  .route("/cart")
  .get(authController.protect, authController.getCart)
  .post(authController.protect, authController.addToCart)
  .patch(authController.protect, authController.removeCart)
  .delete(authController.protect, authController.deleteAllItemsFromCart);

router
  .route("/invoice")
  .post(authController.protect, authController.createInvoice)
  .get(authController.protect, authController.getInvoice);

router
  .route("/invoice/:id")
  .get(authController.protect, authController.getInvoiceById);

router.post("/checkout", authController.protect, authController.checkOut);

module.exports = router;
