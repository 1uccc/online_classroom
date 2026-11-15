export class AppError extends Error {
  constructor(statusCode, message, code = 'REQUEST_ERROR', errors) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export function assert(condition, status, message, code) {
  if (!condition) throw new AppError(status, message, code);
}
