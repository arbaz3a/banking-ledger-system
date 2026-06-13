const express = require("express")
const cookieParser = require('cookie-parser')
const app = express()

/**
 * - Built-in Middlewares
 */
app.use(express.json())
app.use(cookieParser())


/**
 * - Routes required
 */
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")

/**
 * - Use routes
 */

app.use("/api/auth", authRouter)
app.use('/api/accounts', accountRouter)
app.use('/api/transactions', transactionRouter)




module.exports = app