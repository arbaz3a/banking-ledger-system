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




/**
 * - Use routes
 */

app.use("/api/auth", authRouter)
app.use('api/accounts', accountRouter)





module.exports = app