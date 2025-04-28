const Product = require("./model");
const catchAsync = require("../Utils/catchAsync");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../Utils/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ status: "fail", message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: "fail", message: "No image file uploaded" });
    }

    // Upload image to Cloudinary
    let cld_upload_stream = cloudinary.uploader.upload_stream({ folder: "uploads" }, async (error, result) => {
      if (error) {
        return res.status(500).json({ status: "fail", message: error.message });
      }

      // Create product after image uploaded
      const product = {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        machineLocation: req.body.machineLocation,
        imageUrl: result.secure_url, // image URL from cloudinary
      };

      const newProduct = await Product.create(product);

      res.status(201).json({
        status: "success",
        data: {
          product: newProduct,
        },
      });
    });

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
  });
});

exports.editProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const product = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
    imageUrl: req.body.imageUrl,
  };
  const editedProduct = await Product.findByIdAndUpdate(id, product, {
    new: true,
    runValidators: true,
  });

  if (!editedProduct) {
    return new Error(`No document found with ID: ${req.params.id}`);
  }

  res.status(200).json({
    status: "success",
    data: {
      product: editedProduct,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const deletedProduct = await Product.findByIdAndDelete(productId);

  if (!deletedProduct) {
    return new Error(`No document found with ID: ${req.params.id}`);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
