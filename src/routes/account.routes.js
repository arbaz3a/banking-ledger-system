const express = require("express")
const router = express.Router()

const authMiddleware = require('../middleware/auth.middleware')
const accountController = require('../controllers/account.controller')
/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/", authMiddleware.authMiddleware, accountController.accountCreateController)

/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.fetchAllUserAccoundController)

/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.fetchAccountBalanceController)




module.exports = router