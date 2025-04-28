const AppError = require("./AppError");

const handleDbCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDbDuplicateFields = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleDbValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleAuthTokenError = () => {
  return new AppError("Invalid token. Please log in again!", 401);
};

const handleExpAuthTokenError = () => {
  return new AppError("Your token has expired! Please log in again.", 401);
};

const sendErrorDev = (err, res, req) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, res, req) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Something went wrong!",
      });
    }
  } else {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV === "production") {
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    };
    if (error.name === "CastError") {
      error = handleDbCastError(error);
    } else if (error.code === "11000") {
      error = handleDbDuplicateFields(error);
    } else if (error.name === "ValidationError") {
      error = handleDbValidationError(error);
    } else if (error.name === "JsonWebTokenError") {
      error = handleAuthTokenError(error);
    } else if (error.name === "TokenExpiredError") {
      error = handleExpAuthTokenError(error);
    }
    sendErrorProd(error, res, req);
  }
};
