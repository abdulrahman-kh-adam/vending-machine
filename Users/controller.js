const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../Utils/catchAsync");
const User = require("./model");
const AppError = require("../Utils/appError");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require("../Utils/cloudinary"); // << make sure you have this
const streamifier = require("streamifier");

// Use memoryStorage (no change here)
const storage = multer.memoryStorage();

const filter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filter,
});

exports.uploadUserPhoto = upload.single("image");

// Replace resizeUserPhoto to upload to cloudinary
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Resize the image
  const resizedImageBuffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer(); // Keep in buffer

  // Upload resized buffer to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "users", // Upload to users folder
      public_id: `user-${req.user._id}`, // filename will be user-{id}
      overwrite: true, // overwrite if same public_id
      resource_type: "image",
    },
    (error, result) => {
      if (error) {
        return next(new AppError("Cloudinary upload failed.", 500));
      }

      req.file.cloudinaryUrl = result.secure_url; // Save URL for next middleware
      next();
    }
  );

  streamifier.createReadStream(resizedImageBuffer).pipe(uploadStream);
});

const signToken = (key) => {
  return jwt.sign({ id: key }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (key, res, data) => {
  const token = signToken(key);

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  if (data) {
    data.user.password = undefined;
    data.user.active = undefined;
    data.user.__v = undefined;
  }

  res.status(200).json({
    status: "success",
    token,
    data,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  sendToken(newUser._id, res, { user: newUser });
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password!", 401));
  }

  sendToken(user._id, res, null);
});

exports.signout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 3 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please log in to get access.", 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("The user belonging to this token does no longer exist.", 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("User recently changed password! Please log in again.", 401));
  }

  req.user = currentUser.toObject();
  req.user._id = req.user._id.toString();
  res.locals.user = currentUser;

  // Grant access to protected route
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (req.cookies.jwt) {
    // 2) Verification token
    try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // USER LOGGED IN
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select("+password");
  // 2) Check if POSTed current password is correct
  const postedPass = req.body.password;
  const userPass = user.password;
  if (!(await user.correctPassword(postedPass, userPass))) {
    return next(new AppError("Incorrect password", 401));
  }
  // 3) If so, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  // 4) Log user in, send JWT
  sendToken(user._id, res, null);
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.deleteSelf = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError(`No user found with that ID: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.getSelf = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError(`No user found with that ID: ${id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Update self (with Cloudinary image if exists)
exports.updateSelf = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates. Please use /update-password", 400));
  }

  const { name, email } = req.body;
  const filteredBody = { name, email };

  if (req.file && req.file.cloudinaryUrl) {
    filteredBody.photo = req.file.cloudinaryUrl; // Save the cloudinary URL
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError(`No user found with that ID: ${req.user.id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const newUser = await User.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError(`No user found with that ID: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    return next(new AppError(`No user found with that ID: ${req.params.id}`, 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
