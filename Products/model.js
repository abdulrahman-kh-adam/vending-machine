const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  machineLocation: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
