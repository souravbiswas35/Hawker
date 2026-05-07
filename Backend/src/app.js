const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { clientUrl } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: clientUrl }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
