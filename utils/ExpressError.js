class ExpressError extends Error {
  constructor(statusCode, message, errors = null) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
  }
}

module.exports = ExpressError;
