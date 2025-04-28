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
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ status: "fail", message: err.message });
    }

    const id = req.params.id;
    const updates = {
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
      machineLocation: req.body.machineLocation,
    };

    // If the user uploaded a new image
    if (req.file) {
      let cld_upload_stream = cloudinary.uploader.upload_stream({ folder: "uploads" }, async (error, result) => {
        if (error) {
          return res.status(500).json({ status: "fail", message: error.message });
        }

        updates.imageUrl = result.secure_url; // Add new image URL

        const editedProduct = await Product.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });

        if (!editedProduct) {
          return next(new Error(`No document found with ID: ${req.params.id}`));
        }

        res.status(200).json({
          status: "success",
          data: {
            product: editedProduct,
          },
        });
      });

      streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
    } else {
      // No new image uploaded, just update text fields
      const editedProduct = await Product.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!editedProduct) {
        return next(new Error(`No document found with ID: ${req.params.id}`));
      }

      res.status(200).json({
        status: "success",
        data: {
          product: editedProduct,
        },
      });
    }
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
