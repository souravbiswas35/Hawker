function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (status >= 500) {
    console.error("[SERVER_ERROR]", err);
  }

  res.status(status).json({ message });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
