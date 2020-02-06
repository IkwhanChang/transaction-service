var supertest = require("supertest");
var expect = require("expect.js");
const server = supertest.agent("http://localhost:5000");
const mongoose = require("mongoose");
const _ = require("lodash");

const Account = require("../models/Account");

// DB Config
const db = require("../config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

describe("Deposit to ACT310, withdraw and get balance", () => {
  describe("Deposit 100.0 to ACT310", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "DEPOSIT", accountId: "ACT310", amount: 100.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Get balance of ACT310", () => {
    it("should 100.0", done => {
      server
        .get(`/accounts?accountId=ACT310`)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const balance = JSON.parse(res.text)[0].balance;
          expect(balance).to.be.equal(100.0);
          return done();
        });
    });
  });

  describe("Withdraw 50.0 to ACT310", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "WITHDRAW", accountId: "ACT310", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Get balance of ACT310", () => {
    it("should 50.0", done => {
      server
        .get(`/accounts?accountId=ACT310`)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const balance = JSON.parse(res.text)[0].balance;
          expect(balance).to.be.equal(50.0);
          return done();
        });
    });
  });

  describe("Withdraw 55.0 to ACT310", () => {
    it("return not enough balance error", done => {
      server
        .post("/transactions")
        .send([{ cmd: "WITHDRAW", accountId: "ACT310", amount: 55.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Not enough balance");
          return done();
        });
    });
  });
});

describe("Transfer from ACT310 to ACT320", () => {
  describe("Deposit 200.0 to ACT320", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "DEPOSIT", accountId: "ACT320", amount: 200.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Deposit 100.0 to ACT310", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "DEPOSIT", accountId: "ACT310", amount: 100.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Get balance of ACT320", () => {
    it("should 200.0", done => {
      server
        .get(`/accounts?accountId=ACT320`)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const balance = JSON.parse(res.text)[0].balance;
          expect(balance).to.be.equal(200.0);
          return done();
        });
    });
  });

  describe("Transfer 170 from ACT310 to ACT320", () => {
    it("Should be not enough balance error of ACT310", done => {
      server
        .post("/transactions")
        .send([
          { cmd: "XFER", fromId: "ACT310", toId: "ACT320", amount: 170.0 }
        ])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Not enough balance");
          return done();
        });
    });
  });

  describe("Transfer 50 from ACT310 to ACT320", () => {
    it("Return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT310", toId: "ACT320", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Get balance of ACT320 and ACT310", () => {
    it("should be ACT320 = 250.0 and ACT310 = 100", done => {
      server
        .get(`/accounts?accountId=ACT320&accountId=ACT310`)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const balance1 = JSON.parse(res.text)[0].balance;
          expect(balance1).to.be.equal(250.0);

          const balance2 = JSON.parse(res.text)[1].balance;
          expect(balance2).to.be.equal(100.0);

          return done();
        });
    });
  });

  describe("Transfer 10 from ACT310 to ACT330 (not existed account)", () => {
    it("Should be error with invaild toId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT310", toId: "ACT330", amount: 10.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];

          expect(msg).to.be.equal("Cannot found ToId");
          return done();
        });
    });
  });

  describe("Transfer 10 from ACT330 to ACT310 (not existed account)", () => {
    it("Should be error with invaild fromId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT330", toId: "ACT310", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Cannot found FromId");
          return done();
        });
    });
  });
});

//
describe("Freeze Test", () => {
  describe("Freeze ACT330 (not existed account)", () => {
    it("Should be error with Cannot found accountId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "FREEZE", accountId: "ACT330" }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];

          expect(msg).to.be.equal("Cannot found accountId");
          return done();
        });
    });
  });

  describe("Freeze ACT320", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "FREEZE", accountId: "ACT320" }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Deposit ACT320", () => {
    it("shoud be error", done => {
      server
        .post(`/transactions`)
        .send([{ cmd: "DEPOSIT", accountId: "ACT320", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Account were freeze");
          return done();
        });
    });
  });

  describe("Withdraw ACT320", () => {
    it("shoud be error", done => {
      server
        .post(`/transactions`)
        .send([{ cmd: "WITHDRAW", accountId: "ACT320", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Account were freeze");
          return done();
        });
    });
  });

  describe("Transfer 50 from ACT320 to ACT310", () => {
    it("Should be error with freeze fromId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT320", toId: "ACT310", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("FromId's account were freeze");
          return done();
        });
    });
  });

  describe("Transfer 50 from ACT310 to ACT320", () => {
    it("Should be error with freeze toId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT310", toId: "ACT320", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("ToId's account were freeze");
          return done();
        });
    });
  });
});

//
describe("Thaw Test", () => {
  describe("Thaw ACT330 (not existed account)", () => {
    it("Should be error with invaild accountId", done => {
      server
        .post("/transactions")
        .send([{ cmd: "THAW", accountId: "ACT330" }])
        .end((err, res) => {
          if (err) return done(err);
          const { msg } = JSON.parse(res.text).errors[0];
          expect(msg).to.be.equal("Cannot found accountId");
          return done();
        });
    });
  });

  describe("Thaw ACT320", () => {
    it("return 200 code", done => {
      server
        .post("/transactions")
        .send([{ cmd: "THAW", accountId: "ACT320" }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Deposit ACT320", () => {
    it("shoud be working", done => {
      server
        .post(`/transactions`)
        .send([{ cmd: "DEPOSIT", accountId: "ACT320", amount: 100.0 }])
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Withdraw ACT320", () => {
    it("shoud be working", done => {
      server
        .post(`/transactions`)
        .send([{ cmd: "WITHDRAW", accountId: "ACT320", amount: 50.0 }])
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Transfer 50 from ACT320 to ACT310", () => {
    it("Should be working", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT320", toId: "ACT310", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });

  describe("Transfer 50 from ACT310 to ACT320", () => {
    it("Should be working", done => {
      server
        .post("/transactions")
        .send([{ cmd: "XFER", fromId: "ACT310", toId: "ACT320", amount: 50.0 }])
        .end((err, res) => {
          if (err) return done(err);
          return done();
        });
    });
  });
});

// describe("Restore all test data", () => {
//   it("delete ACT310", done => {
//     removeByAccountId("ACT310", err => done(err));
//   });
//   it("delete ACT320", done => {
//     removeByAccountId("ACT320", err => done(err));
//   });
// });

describe("GET /accounts", () => {
  it("return accounts", done => {
    server
      .get("/accounts")
      .expect("Content-Type", /json/)
      .expect(200)
      .end((err, res) => {
        return done();
      });
  });
});

function removeByAccountId(accountId, callback) {
  Account.findOne({ accountId }).then(account => {
    Account.remove({ _id: account._id }, err => {
      if (!err) {
        callback();
      } else {
        callback(err);
      }
    });
  });
}
