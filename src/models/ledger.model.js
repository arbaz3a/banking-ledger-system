const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Ledger must be associated with an account" ],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a ledger entry" ],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [ true, "Ledger must be associated with a transaction" ],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: [ "CREDIT", "DEBIT" ],
            message: "Type can be either CREDIT or DEBIT",
        },
        required: [ true, "Ledger type is required" ],
        immutable: true
    }
})


function lockLedger() {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

ledgerSchema.pre('findOneAndUpdate', lockLedger);
ledgerSchema.pre('updateOne', lockLedger);
ledgerSchema.pre('updateMany', lockLedger);
ledgerSchema.pre('findOneAndDelete', lockLedger);
ledgerSchema.pre('deleteOne', lockLedger);
ledgerSchema.pre('deleteMany', lockLedger);
ledgerSchema.pre('findOneAndReplace', lockLedger);


const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;