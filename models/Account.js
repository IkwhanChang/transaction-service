const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const AccountSchema = new Schema(
  {
    accountId: {
      type: String,
      unique: true
    },
    balance: {
      type: Number
    },
    freeze: {
      type: Boolean
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("accounts", AccountSchema);
