const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.services");
const userModel = require("../models/user.model");
const { default: mongoose } = require("mongoose");

// createTransaction function flow
/**
 * Create a new transaction
 * - THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

const createTransaction = async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  // 1 - validate input
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "All fields are required to process this transaction",
    });
  }

  const senderAccount = await accountModel.findById(fromAccount);
  const receiverAccount = await accountModel.findById(toAccount);

  if (!senderAccount || !receiverAccount) {
    return res.status(400).json({
      message: "Invalid account details provided",
    });
  }

  // 3 - account status validation
  if (senderAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "Sender account is not active. Please contact support",
    });
  }

  if (receiverAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "Receiver account is not active. Please contact support",
    });
  }

  // 4 - balance check
  const balance = await senderAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Your current balance is ${balance} but you are trying to send ${amount}`,
    });
  }

  // 2 - idempotency check + 5 - create transaction (PENDING) — session se bahir
  // race condition fix: first make PENDING record because of to fetch duplicate requests
  let transaction;
  try {
    transaction = await transactionModel.create({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      // status: "PENDING" — dont need as we set PENDING default in the model
    });
  } catch (err) {
    if (err.code === 11000) {
      // duplicate idempotency key
      const existingTransaction = await transactionModel.findOne({
        idempotencyKey,
      });

      if (existingTransaction.status === "COMPLETED") {
        return res.status(200).json({
          message:
            "This transaction has already been completed successfully. No further action is needed",
          transaction: existingTransaction,
        });
      }

      if (existingTransaction.status === "PENDING") {
        return res.status(200).json({
          message:
            "This transaction is currently being processed. Please wait and do not retry",
        });
      }

      if (existingTransaction.status === "FAILED") {
        return res.status(400).json({
          message:
            "A previous transaction with this key has failed. Please initiate a new transaction with a different idempotency key",
        });
      }

      if (existingTransaction.status === "REVERSED") {
        return res.status(400).json({
          message:
            "This transaction was previously reversed. Please initiate a new transaction with a different idempotency key",
        });
      }
    }

    return res.status(500).json({
      message: "Unable to initiate transaction. Please try again later",
    });
  }

  // 5 - start transaction session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // use to extract object cuz mongo db operaion inside context require session and wrap inside array [] so we use this technique
    // or create simple instance then save middleware to save manual like as we did in createInitialFundsTransaction function

    // 7 - DEBIT ledger
    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    // wait
    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })();

    // 8 - CREDIT ledger
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    // 9 - update transaction status
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // 10 - commit
    await session.commitTransaction();

    // 11 - email notification
    try {
      const receiverUser = await userModel.findById(receiverAccount.user);

      // sender email
      await emailService.sendTransactionSenderEmail(
        req.user.email,
        req.user.name,
        amount,
        receiverUser.name,
      );

      // receiver email
      await emailService.sendTransactionReceivedEmail(
        receiverUser.email,
        receiverUser.name,
        amount,
        req.user.name,
      );
    } catch (emailError) {
      console.error("Email Error:", emailError);
    }

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction: transaction,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // dont left PENDING status— have to mark FAILED
    await transactionModel.findByIdAndUpdate(transaction._id, {
      status: "FAILED",
    });

    // console.error(error);

    return res.status(500).json({
      message:
        "Transaction failed due to an internal error. Your balance has not been deducted. Please try again later",
    });
  } finally {
    await session.endSession();
  }
};

// create createInitialFunds function (by using system user)
const createInitialFundsTransaction = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;

  // validating credentials
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    });
  }

  const receiverAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!receiverAccount) {
    return res.status(400).json({
      message: "Invalid toAccount. Please provide a valid account ID",
    });
  }

  const senderAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!senderAccount) {
    return res.status(400).json({
      message: "System user account not found. Please contact support",
    });
  }

  // check receiver account status
  if (senderAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "System sender account is not active. Please contact support",
    });
  }

  if (receiverAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message:
        "Receiver account is not active. Funds can only be sent to active accounts",
    });
  }

  // creating MongoDB session for transaction, session is like a context or workspace
  const session = await mongoose.startSession();

  try {
    // start a transaction so multiple operations succeed or fail together (temporary write operations inside context)
    session.startTransaction();

    const transaction = new transactionModel({
      fromAccount: senderAccount._id,
      toAccount,
      amount,
      idempotencyKey,
    });

    // create DEBIT ledger entry
    await ledgerModel.create(
      [
        {
          account: senderAccount._id,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session }, // attach operation to current transaction session
    );

    // create CREDIT ledger entry
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }, // attach operation to current transaction session
    );

    // mark transaction as successfully completed
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    // permanently save all changes made within the transactionn
    await session.commitTransaction();

    return res.status(201).json({
      message: "Initial funds transferred successfully",
      transaction,
    });
  } catch (error) {
    // roll back (undo) all changes made within the transaction if any step fail
    await session.abortTransaction();

    return res.status(500).json({
      message:
        "Failed to transfer initial funds due to an internal error. No balance was deducted. Please try again later",
    });
  } finally {
    // always close the session to free resources
    await session.endSession();
  }
};

const fetchAllUserTransactions = async (req, res) => {
  const accounts = await accountModel.find({
    user: req.user._id,
  });

  const accountIds = accounts.map((acc) => acc._id);

  const transactions = await transactionModel
    .find({
      $or: [
        { fromAccount: { $in: accountIds } },
        { toAccount: { $in: accountIds } },
      ],
    })
    .populate({
      path: "fromAccount",
      select: "user currency status",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .populate({
      path: "toAccount",
      select: "user currency status",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    message: "Request Accepted",
    transactions,
  });
};

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  fetchAllUserTransactions,
};
