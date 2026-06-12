const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')

const authMiddleware = async (req, res, next)=>{

    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // console.log(decoded)
        const user = await userModel.findById(decoded.userId)
        req.user = user

        return next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}



module.exports = {authMiddleware}