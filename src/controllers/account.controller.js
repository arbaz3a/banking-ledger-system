const accountModel = require("../models/account.model")

const accountCreateController = async (req, res)=>{
    const user = req.user
    const acccount = await accountModel.create({
        user: user._id
    })
    res.status(201).json({
        acccount
    })
}


module.exports = {accountCreateController}