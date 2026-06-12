const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with the user"],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currecny is required for creating an account"],
      default: "PK",
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({user: 1, status: 1})



const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
