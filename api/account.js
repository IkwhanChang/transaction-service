/**
 * Account API
 * @module AccountAPI
 * @author Matthew Chang
 */
import mongoose from "mongoose";

import { isInt, isStr, errorObj } from "../lib/utils";

import Account from "../models/Account";

class AccountAPI {
  /**
   *
   * Get All Accounts
   *
   * @param {string}    cmd         The command to execute
   * @param {List}      accountIds  Accounts to return results
   * @return {Promise}              The promise result of deposit
   *
   */
  getAccounts({ cmd, accountIds }) {
    const promises = [];

    accountIds.forEach((accountId, id) => {
      promises.push(
        new Promise((resolve, reject) => {
          Account.exists({ accountId }).then(exist => {
            if (!exist) {
              //reject(errorObj("ACCOUNTS", "Account not exist"));
              resolve();
            } else {
              Account.findOne({ accountId })
                .then(account => {
                  const { accountId, balance, frozen } = account;
                  resolve({
                    accountId,
                    balance,
                    frozen
                  });
                })
                .catch(e => {
                  reject(errorObj("ACCOUNTS", "Unknown error"));
                });
            }
          });
        })
      );
    });

    return Promise.all(promises);
  }
}

const accountAPI = new AccountAPI();
export default accountAPI;
