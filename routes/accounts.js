import express from "express";

// Load Model
import Account from "../models/Account";

import AccountAPI from "../api/account";
import { errorObj } from "../lib/utils";

const router = express.Router();

// @route   GET accounts
// @desc    Get list of account detail
// @access  Public
router.get("/", (req, res) => {
  const accountIds = req.query.accountId;

  if (accountIds === undefined) return res.status(200).json({});

  AccountAPI.getAccounts({
    cmd: "ACCOUNTS",
    accountIds: typeof accountIds === "string" ? [accountIds] : accountIds
  })
    .then(details => {
      res.send(details.filter(d => d !== undefined));
    })
    .catch(e => {
      console.error(e);
      res.status(500).json(e);
    });
});

module.exports = router;
