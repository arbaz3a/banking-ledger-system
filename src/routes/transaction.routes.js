const express = require('express')
const router = express.Router()
const transactionController = require('../controllers/transaction.controller')
const authMiddleware = require('../middleware/auth.middleware')

/**
 * POST /api/transactions/
 * Create new transaction
 */
router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user account
 */
router.post('/system/initial-funds', authMiddleware.authSystemMiddleware, transactionController.createInitialFundsTransaction)

module.exports = router