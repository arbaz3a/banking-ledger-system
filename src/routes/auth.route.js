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




module.exports = router