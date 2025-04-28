const Product = require("./model");
const catchAsync = require("../Utils/catchAsync");

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
  const product = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
    imageUrl: req.body.imageUrl,
  };

  const newProduct = await Product.create(product);

  res.status(201).json({
    status: "success",
    data: {
      product: newProduct,
    },
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
