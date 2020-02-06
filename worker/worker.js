/**
 * Worker with Redis RSMQ (https://github.com/smrchy/rsmq)
 * @module TransactionAPI
 * @author Matthew Chang
 */
import RedisSMQ from "rsmq";

import TransactionAPI from "../api/transaction";

const qname = process.env.QUEUE_NAME || "scratch";
let successCallback = () => {};

class Worker {
  constructor(messageCnt = 0) {
    this.rsmq = new RedisSMQ({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,
      ns: "rsmq"
    });

    // Default variables
    //this.successCallback = () => {};
    this.isError = false;
    this.errors = [];
    this.messageCnt = messageCnt;

    // Binding functions
    this.init = this.init.bind(this);
    this.createQueue = this.createQueue.bind(this);
    this.send = this.send.bind(this);
    this.start = this.start.bind(this);
    this.receive = this.receive.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);

    // Initialization w/ Queue
    this.init();
  }

  init() {
    this.rsmq.listQueues((err, queues) => {
      if (err) {
        console.error(err);
        return;
      }

      if (queues.includes(qname)) {
        this.rsmq.deleteQueue({ qname }, (err, resp) => {
          if (err) {
            console.error(err);
            return;
          }

          if (resp === 1) {
            console.log("Queue and all messages deleted.");
            this.createQueue();
          } else {
            console.log("Queue not found.");
          }
        });
      } else {
        this.createQueue();
      }
    });
  }

  createQueue() {
    this.rsmq.createQueue({ qname }, (err, resp) => {
      if (err) {
        console.error(err);
        return;
      }

      if (resp === 1) {
        console.log("queue created");
        this.start();
      }
    });
  }

  start() {
    console.log("Worker started");
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
      //console.log("waiting..", res);
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
      } else {
        //console.log("waiting..");
      }
    });
  }

  send(message, callback) {
    successCallback = callback;
    this.rsmq.sendMessage({ qname, message }, function(err, resp) {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  deleteMessage(id) {
    const { res, rsmq, isError, errors } = this;
    rsmq.deleteMessage({ qname, id }, (err, resp) => {
      if (!err) {
        this.messageCnt = this.messageCnt - 1;
        if (this.messageCnt <= 0) {
          successCallback(this.messageCnt, isError, errors);
          this.stop();
        }
      } else {
        console.log("Err", err);
      }
    });
  }
}

export default Worker;
