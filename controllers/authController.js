const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { promisify } = require("util");
const validator = require('validator');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    mobileNo: req.body.mobileNo,
    email: req.body.email,
    password: req.body.password,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;

  // Check if identifier (email or mobile number) and password exist
  if (!identifier || !password) {
    return next(new AppError("Please provide email/mobile number and password!", 400));
  }

  // Check if the provided identifier is an email or mobile number
  let user;
  if (validator.isEmail(identifier)) {
    // If the identifier is an email
    user = await User.findOne({ email: identifier }).select("+password");
  } else if (validator.isMobilePhone(identifier, "any", { strictMode: false })) {
    // If the identifier is a mobile number
    user = await User.findOne({ mobileNo: identifier }).select("+password");
  } else {
    // If the identifier is neither an email nor a mobile number
    return next(new AppError("Please provide a valid email/mobile number!", 400));
  }

  // Check if the user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email/mobile number or password", 401));
  }

  // If everything is ok, send token to client
  createSendToken(user, 200, res);
});



exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { itemId } = req.body;

  // Get the current user
  const currentUser = req.user;

  // Create the cart item object
  const cartItem = {
    itemId: itemId,
  };

  // Push the cart item to the user's cart array
  currentUser.cart.push(cartItem);

  // Save the user
  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "Item added to cart successfully",
    },
  });
});

exports.getCart = catchAsync(async (req, res, next) => {
  // Get the current user
  const currentUser = req.user;

  res.status(200).json({
    status: "success",
    data: {
      cart: currentUser.cart,
    },
  });
});

exports.removeCart = catchAsync(async (req, res, next) => {
  // Get the item ID to remove from the request body
  const { itemId } = req.body;

  // Get the current user
  const currentUser = req.user;

  // Check if the item exists in the user's cart
  const itemIndex = currentUser.cart.findIndex(
    (item) => item.itemId === itemId
  );

  // If the item is not found in the cart, return an error
  if (itemIndex === -1) {
    return next(new AppError("Item not found in the cart", 404));
  }

  // Remove the item from the user's cart array
  currentUser.cart.splice(itemIndex, 1);

  // Save the updated user data
  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "Item removed from cart successfully",
    },
  });
});

exports.deleteAllItemsFromCart = catchAsync(async (req, res, next) => {
  // Get the current user
  const currentUser = req.user;

  // Clear the user's cart array
  currentUser.cart = [];

  // Save the updated user data
  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "All items removed from cart successfully",
    },
  });
});

exports.checkOut = catchAsync(async (req, res, next) => {
  const { TotalAmt } = req.body;
  const currentUser = req.user;

  const checkOutItem = {
    newItem: currentUser.cart,
    totalAmount: TotalAmt,
  };

  currentUser.checkout.push(checkOutItem);

  currentUser.cart = [];

  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "Checkout successful",
    },
  });
});

exports.createInvoice = catchAsync(async (req, res, next) => {
  const { address, paymentOption } = req.body;
  const currentUser = req.user;
  let id;
  if (currentUser.invoice.lenght === 0) {
    id = 1;
  } else {
    id = currentUser.invoice.length + 1;
  }

  const invoiceItem = {
    newInvoice: currentUser.checkout,
    id: id,
    address: {
      name: `${currentUser.name}`,
      address: `${address}`,
    },
    paymentOption,
  };

  currentUser.invoice.push(invoiceItem);

  currentUser.checkout = [];

  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {
      message: "Item saved in Invoice successfully",
    },
  });
});

exports.getInvoice = catchAsync(async (req, res, next) => {
  const currentUser = req.user;

  res.status(200).json({
    status: "success",
    data: {
      invoice: currentUser.invoice,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const currentUser = req.user;

  res.status(200).json({
    status: "success",
    data: {
      user: currentUser,
    },
  });
});

exports.getInvoiceById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;

  if (!id) return next(new AppError("ID not provided", 400));

  const invoice = currentUser.invoice.find((item) => item.id === parseInt(id));

  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      invoice: invoice,
    },
  });
});
