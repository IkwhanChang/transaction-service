/**
 * Transaction API
 * @module TransactionAPI
 * @author Matthew Chang
 */
import mongoose from "mongoose";

import {
  CMD_DEPOSIT,
  CMD_FREEZE,
  CMD_THAW,
  CMD_WITHDRAW,
  CMD_XFER
} from "../constants/command-types";
import { isInt, isStr, errorObj } from "../lib/utils";

import Account from "../models/Account";

class TransactionAPI {
  /**
   *
   * Execute the command with parameter
   *
   * @param   {string}  cmd     The command to execute
   * @param   {object}  params  Parameters to execute
   * @return  {Promise}         The promise result of do cmd
   *
   */
  exec(cmd, params) {
    switch (cmd) {
      case CMD_DEPOSIT:
        return this.deposit(params);
      case CMD_WITHDRAW:
        return this.withdraw(params);
      case CMD_XFER:
        return this.xfer(params);
      case CMD_FREEZE:
        return this.freeze(params);
      case CMD_THAW:
        return this.thaw(params);
      default:
        return Promise.reject();
    }
  }

  /**
   *
   * Deposit
   *
   * @param {string}    cmd         The command to execute
   * @param {string}    accountId   The account id to deposit money into.
   * @param {number}    amount      The amount in dollars and cents to add to the account.
   * @return {Promise}              The promise result of deposit
   *
   */
  deposit({ cmd, accountId, amount }) {
    return new Promise((resolve, reject) => {
      // parameter validations
      if (!isStr(accountId)) {
        reject(errorObj(cmd, "Invaild accountId"));
      } else if (!isInt(amount) || amount < 0) {
        reject(errorObj(cmd, "Invaild amount"));
      } else {
        // upserting
        Account.exists({ accountId })
          .then(isExist => {
            if (!isExist) {
              // Insert if user not exist
              const _account = new Account({
                accountId,
                balance: amount,
                freeze: false
              });
              _account
                .save()
                .then(() => {
                  resolve();
                })
                .catch(e => reject(e));
            } else {
              // validations & logic
              Account.findOne({ accountId })
                .then(account => {
                  const { balance, freeze } = account;
                  if (freeze) {
                    reject(errorObj(cmd, "Account were freeze"));
                  } else {
                    const newBalance = balance + amount;
                    Account.findOneAndUpdate(
                      { accountId },
                      { balance: newBalance },
                      { upsert: true }
                    )
                      .then(() => {
                        resolve();
                      })
                      .catch(e => reject(e));
                  }
                })
                .catch(e => reject(e));
            }
          })
          .catch(e => reject(e));
      }
    });
  }

  /**
   *
   * Withdraw from account
   *
   * @param {string}    cmd         The command to execute
   * @param {string}    accountId   The account id to withdraw money from
   * @param {number}    amount      The amount in dollars and cents to remove from the account.
   * @return {Promise}              The promise result of withdraw
   *
   */
  withdraw({ cmd, accountId, amount }) {
    return new Promise((resolve, reject) => {
      // parameter validations
      if (!isStr(accountId)) {
        reject(errorObj(cmd, "Invaild accountId"));
      } else if (!isInt(amount) || amount < 0) {
        reject(errorObj(cmd, "Invaild amount"));
      } else {
        // Check account exists
        Account.exists({ accountId }).then(isExist => {
          if (!isExist) {
            reject(errorObj(cmd, "Account does not exists"));
          } else {
            // validations & logic
            Account.findOne({ accountId })
              .then(account => {
                const { balance, freeze } = account;
                if (freeze) {
                  reject(errorObj(cmd, "Account were freeze"));
                } else if (balance < amount) {
                  reject(errorObj(cmd, "Not enough balance"));
                } else {
                  const newBalance = balance - amount;
                  Account.findOneAndUpdate(
                    { accountId },
                    { balance: newBalance },
                    { upsert: true }
                  )
                    .then(() => {
                      resolve();
                    })
                    .catch(e => reject(e));
                }
              })
              .catch(e => {
                console.log(e);
                reject(e);
              });
          }
        });
      }
    });
  }

  /**
   *
   * Transfer money
   *
   * @param {string}    cmd         The command to execute
   * @param {string}    fromId      The account id to transfer money from
   * @param {string}    toId        The account id to transfer money to
   * @param {number}    amount      The amount in dollars and cents to remove from the account.
   * @return {Promise}              The promise result of transfering
   *
   */
  xfer({ cmd, fromId, toId, amount }) {
    return new Promise((resolve, reject) => {
      // parameter validations
      if (!isStr(fromId)) {
        reject(errorObj(cmd, "Invaild fromId"));
      } else if (!isStr(toId)) {
        reject(errorObj(cmd, "Invaild toId"));
      } else {
        // validations & logic
        Account.findOne({ accountId: fromId })
          .then(fromAccount => {
            if (fromAccount.freeze) {
              reject(errorObj(cmd, "FromId's account were freeze"));
            } else if (fromAccount.balance < amount) {
              reject(errorObj(cmd, "Not enough balance"));
            } else {
              Account.findOne({ accountId: toId })
                .then(toAccount => {
                  if (toAccount.freeze) {
                    reject(errorObj(cmd, "ToId's account were freeze"));
                  } else {
                    const newBalanceFromId = fromAccount.balance - amount;
                    const newBalanceToId = toAccount.balance + amount;

                    Account.findOneAndUpdate(
                      { accountId: fromId },
                      { balance: newBalanceFromId },
                      { upsert: true }
                    )
                      .then(() => {
                        Account.findOneAndUpdate(
                          { accountId: toId },
                          { balance: newBalanceToId },
                          { upsert: true }
                        )
                          .then(() => {
                            resolve();
                          })
                          .catch(e => reject(e));
                      })
                      .catch(e => reject(e));
                  }
                })
                .catch(e => reject(errorObj(cmd, "Cannot found ToId")));
            }
          })
          .catch(e => reject(errorObj(cmd, "Cannot found FromId")));
      }
    });
  }

  /**
   *
   * Do freeze the account
   *
   * @param {string}    cmd         The command to execute
   * @param {string}    accountId   The account id to freeze
   * @return {Promise}              The promise result of freezing
   *
   */
  freeze({ cmd, accountId }) {
    return new Promise((resolve, reject) => {
      // parameter validations
      if (!isStr(accountId)) {
        reject(errorObj(cmd, "Invaild accountId"));
      } else {
        // validations & logic
        Account.exists({ accountId })
          .then(exists => {
            console;
            if (exists) {
              Account.findOneAndUpdate({ accountId }, { freeze: true })
                .then(() => resolve())
                .catch(e => reject(errorObj(cmd, "Unknown error")));
            } else {
              reject(errorObj(cmd, "Cannot found accountId"));
            }
          })
          .catch(e => reject(errorObj(cmd, "Unknown error")));
      }
    });
  }

  /**
   *
   * Do thaw the account
   *
   * @param {string}    cmd         The command to execute
   * @param {string}    accountId   The account id to thaw
   * @return {Promise}              The promise result of thawing
   *
   */
  thaw({ cmd, accountId }) {
    return new Promise((resolve, reject) => {
      // parameter validations
      if (!isStr(accountId)) {
        reject(errorObj(cmd, "Invaild accountId"));
      } else {
        // validations & logic
        Account.exists({ accountId })
          .then(exists => {
            if (exists) {
              Account.findOneAndUpdate({ accountId }, { freeze: false })
                .then(() => resolve())
                .catch(e => reject(errorObj(cmd, "Unknown error")));
            } else {
              reject(errorObj(cmd, "Cannot found accountId"));
            }
          })
          .catch(e => reject(errorObj(cmd, "Unknown error")));
      }
    });
  }
}

const transactionAPI = new TransactionAPI();
export default transactionAPI;
