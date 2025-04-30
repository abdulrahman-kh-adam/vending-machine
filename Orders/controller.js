const Order = require("./model");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate("products.productId");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId).populate("products.productId");
  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const products = req.body.products;
  const totalPrice = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
  const newOrder = await Order.create({
    products,
    totalPrice,
  });
  res.status(201).json({
    status: "success",
    data: {
      order: newOrder,
    },
  });
});

exports.checkOrderStatus = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
    },
  });
});

exports.markOrderAsDone = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }
  order.orderStatus = "Done";
  await order.save();
  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});
