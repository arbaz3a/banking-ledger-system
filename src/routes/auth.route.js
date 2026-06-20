const express = require("express")
const authController = require("../controllers/auth.controller")

const router = express.Router()


/**
 *  POST /api/auth/register
 *  Register your account
 */ 

router.post("/register", authController.userRegisterController)

/**
 * POST /api/auth/login
 * Login your account
 */

router.post("/login",authController.userLoginController)

/**
 * - POST /api/auth/logout
 * Logout your account
 */

router.post("/logout", authController.userLogoutController)





/**
 * - POST /api/auth/forgot-password
 * Request a password reset email
 */
router.post("/forgot-password", authController.forgotPasswordController)

/**
 * - POST /api/auth/reset-password/:id/:token
 * Reset password using the token sent via email
 */
router.post("/reset-password/:id/:token", authController.resetPasswordController)

module.exports = router