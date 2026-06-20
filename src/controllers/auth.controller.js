const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.services");
const tokenBlackListModel = require("../models/blacklist.model");

/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, password, name } = req.body;

  const isExists = await userModel.findOne({
    email: email,
  });

  if (isExists) {
    return res.status(422).json({
      message: "User already exists with email.",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.sendWelcomeEmail(user.email, user.name);
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */

async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */

async function userLogoutController(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      await tokenBlackListModel.create({
        token,
      });
    }

    res.clearCookie("token");

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
}

/**
 * - Forgot Password Controller
 * - POST /api/auth/forgot-password
 */
async function forgotPasswordController(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(404).json({ message: "User not found with this email." });
  }

  const secret = process.env.JWT_SECRET + user.password;
  const token = jwt.sign({ userId: user._id, email: user.email }, secret, {
    expiresIn: "15m",
  });

  const resetLink = `${process.env.FRONTEND_URL}/api/auth/reset-password/${user._id}/${token}`;

  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetLink);
    return res.status(200).json({ message: "A reset link has been sent." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send reset email. Please try again." });
  }
}

/**
 * - Reset Password Controller
 * - POST /api/auth/reset-password/:id/:token
 */
async function resetPasswordController(req, res) {
  const { id, token } = req.params || {};
  const { newPassword } = req.body || {};

  if (!id || !token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Invalid request. Missing parameters." });
  }

  const user = await userModel.findById(id).select("+password");

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired link." });
  }

  const secret = process.env.JWT_SECRET + user.password;

  try {
    jwt.verify(token, secret);

    // save new password, the pre-save hook in userModel will hash it
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: "Password has been successfully reset. You can now login.",
    });
  } catch (error) {
    // console.log("JWT Error:", error.message);
    return res
      .status(400)
      .json({
        errormessage: error.message,
        message: "Invalid or expired link.",
      });
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
  forgotPasswordController,
  resetPasswordController,
};
