const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  products: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      imageUrl: { type: String, required: true },
      machineLocation: { type: String, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  orderStatus: { type: String, enum: ["Pending", "Done", "Cancelled"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
