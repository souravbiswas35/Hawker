const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { clientUrl } = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
];

// 🔥 MUST be FIRST middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS CHECK:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // dev mode allow all
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 IMPORTANT: force preflight support
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH,DELETE, OPTIONS");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;