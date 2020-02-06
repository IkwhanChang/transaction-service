import express from "express";

import Worker from "../worker/worker";

const router = express.Router();

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
    console.log(params);
    worker.send(params, (messageCnt, isError, errors) => {
      if (messageCnt <= 0) {
        if (isError) {
          res.json({ errors });
        } else {
          res.send("OK");
        }
      }
    });
  });
});

module.exports = router;
