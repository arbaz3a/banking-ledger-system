const express = require('express')
const router = express.Router()
const transactionController = require('../controllers/transaction.controller')
const authMiddleware = require('../middleware/auth.middleware')

/**
 * POST /api/transactions/
 * Create new transaction
 */
router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)


module.exports = router