import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
import fs from "fs";
import http from "http";

// Routers
import transactions from "./routes/transactions";
import accounts from "./routes/accounts";

// Queue & Workers
import Worker from "./worker/worker";

const app = express();
mongoose.Promise = global.Promise;

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
  })
);

app.use(cors(corsOptions));

// DB Config
const db = process.env.DB_HOST || require("./config/keys").mongoURI;

const http_port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Worker
//worker.start();
const worker = new Worker(0);
worker.stop();

// Use Routes
app.use("/accounts", accounts);
app.use("/transactions", transactions);

// app.get("*", (req, res) => {
//   res.status(401).send({ error: "Unauthorized" });
// });

const server = http.createServer(app);

server.listen(http_port, () => {
  console.log("Service Listening on Port " + http_port);
});
