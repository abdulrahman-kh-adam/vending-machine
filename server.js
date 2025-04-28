const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();
const mongoURI =
  "mongodb+srv://adam:Boody0570090614@vending-machine.w8dgy2g.mongodb.net/?retryWrites=true&w=majority&appName=vending-machine"; // Replace with your MongoDB URI
mongoose.connect(mongoURI).then(() => {
  console.log("Connected to MongoDB");
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api/products", require("./Products/route"));
app.use("/api/users", require("./Users/route"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
