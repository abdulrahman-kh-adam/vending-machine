const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connection.collection("orders").dropIndex("products.name_1");
}

connectDB();

console.log("Database connection established and index dropped.");
