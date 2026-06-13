const accountModel = require("../models/account.model");

const accountCreateController = async (req, res) => {
  const user = req.user;
  const acccount = await accountModel.create({
    user: user._id,
  });
  res.status(201).json({
    acccount,
  });
};

const fetchAllUserAccoundController = async (req, res) => {
  const accounts = await accountModel.find({ user: req.user._id });

  res.status(200).json({
    accounts,
  });
};

const fetchAccountBalanceController = async (req, res) => {
  const { accountId } = req.params;
  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    return res.status(404).json({
      message: "Account not found",
    });
  }
  try {
    const balance = await account.getBalance();

    res.status(200).json({
      accountId: account._id,
      balance: balance,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  accountCreateController,
  fetchAllUserAccoundController,
  fetchAccountBalanceController,
};
