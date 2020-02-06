# Transaction Processor Service

A API service for a small bank.

## Specifications

Main Framework: Node.js with Express.js
Dependencies Management: Yarn
Database: MongoDB
In-Memory Storage (for queue): Redis
Testing: Supertest, Mocha
Container Library: Docker

## API

## Account API

#### routes/accounts.js

```javascript
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
```

#### routes/transactions.js

```javascript
// @route   GET transactions
// @desc    Execute command
// @access  Public
router.post("/", (req, res) => {
  const worker = new Worker(req.body.length);
  //worker.start();
  req.body.forEach(({ cmd, ...rest }) => {
    const params = JSON.stringify({
      cmd: `CMD_${cmd}`,
      params: { cmd, ...rest }
    });
    worker.send(params, (messageCnt, isError, errors) => {
      if (messageCnt === 0) {
        if (isError) {
          res.json({ errors });
        } else {
          res.send("OK");
        }
      }
    });
  });
});
```

## Data Model

#### models/Account.js

```javascript
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
```

## Database

- MongoDB for the main database.

## Message Queue

- Used Redis Simple Message Queue (https://github.com/smrchy/rsmq) to maintain the concurrent transaction request.

#### API Endpoint

- Every transaction request will be sent to the worker, which is maintain the message queue with multiple transactions.
- Once transactions are sent to worker, worker.send will add the message into MQ, then MQ will automatically hooked in every 100ms via setInterval function (Worker.start())
- In every 100ms, rsmq.receiveMessage will catch the message and call the TransactionAPI with specific parameters

#### worker/worker.js

```javascript
class Worker {
  constructor(messageCnt) {
    this.rsmq = new RedisSMQ({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,
      ns: "rsmq"
    });

    ...
  }

  init() {...}

  createQueue() {...}

  start() {
    this.listener = setInterval(() => {
      this.receive();
    }, 50);
  }
  stop() {
    clearInterval(this.listener);
  }

  receive() {
    const { rsmq, deleteMessage } = this;
    rsmq.receiveMessage({ qname }, (err, res) => {
      if (err) {
        console.error(err);
        return;
      }

      if (res.id) {
        const { cmd, params } = JSON.parse(res.message);

        TransactionAPI.exec(cmd, params)
          .then(() => {
            console.log("done");
            deleteMessage(res.id);
          })
          .catch(e => {
            console.error("Error while handling command", e);
            this.isError = true;
            this.errors.push(e);
            deleteMessage(res.id);
          });
      }
    });
  }

  send(message, successCallback) {
    this.successCallback = successCallback;
    this.rsmq.sendMessage({ qname, message }, function(err, resp) {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  deleteMessage(id) {...}
}
```

#### /api/transaction.js

```javascript

...
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
```

- TransactionAPI.exec() will run the command with parameters.

## How to Run

[Prerequisite]

- Node.js
- Docker

[Installation with Docker]

1. Clone the repository: git clone https://www.github.com/IkwhanChang/transaction-service.git
2. Go to transaction-service folder
3. chmod 707 ./app.sh
4. ./app.sh run
5. Test http://localhost:5000/accounts

[Installation without Docker]

(More prerequisites: MongoDB, Redis on your machine)

1. Clone the repository: git clone https://www.github.com/IkwhanChang/transaction-service.git
2. Go to transaction-service folder
3. Install dependencies: npm i or npm install (make sure you already installed the node)
4. Run Mongod and redis-server on other terminal
5. npm run start
6. Test http://localhost:5000/accounts
